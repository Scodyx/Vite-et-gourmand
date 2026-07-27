param(
    [string]$AdminEmail = "",
    [string]$AdminPassword = "",
    [switch]$FailAfterEmployeeLogin,
    [switch]$FailCleanupAfterDeactivation
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$jar = Join-Path $backend "target\vite-et-gourmand-api-0.1.0-SNAPSHOT.jar"
$base = "http://127.0.0.1:8080/api/v1"
$backendProcess = $null
$frontendProcess = $null
$employeeCreated = $false
$scenarioError = $null
$cleanupErrors = [Collections.Generic.List[string]]::new()
function New-RandomPassword {
    $bytes = New-Object byte[] 24
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    [Convert]::ToBase64String($bytes) + "Aa1!"
}
function Request([string]$Method,[string]$Uri,[hashtable]$Headers=@{},$Body=$null) {
    try {
        $args=@{Method=$Method;Uri=$Uri;Headers=$Headers;UseBasicParsing=$true;TimeoutSec=15}
        if($null-ne $Body){$args.ContentType="application/json";$args.Body=$Body|ConvertTo-Json -Depth 8}
        $response=Invoke-WebRequest @args
        @{Code=[int]$response.StatusCode;Content=if($response.Content){$response.Content|ConvertFrom-Json}else{$null}}
    } catch {
        if($null-eq $_.Exception.Response){return @{Code=0;Content=$null}}
        @{Code=[int]$_.Exception.Response.StatusCode;Content=$null}
    }
}
function Expect([string]$Name,$Response,[int[]]$Codes) {
    if($Response.Code-notin $Codes){throw "$Name returned HTTP $($Response.Code), expected $($Codes-join ' or ')"}
    Write-Output "$Name=$($Response.Code)"
}
function Stop-ProcessTree([Diagnostics.Process]$Process) {
    if($null-eq $Process -or $Process.HasExited){return}
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$($Process.Id)" -ErrorAction SilentlyContinue |
        ForEach-Object {
            $child=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
            if($child){Stop-ProcessTree $child}
        }
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
}
function Assert-SmokeIdentity([string]$Email,[ValidateSet("ADMIN","EMPLOYEE")][string]$Role) {
    $expectedPrefix=if($Role-eq "ADMIN"){"smoke.admin."}else{"smoke.employee."}
    $escaped=[regex]::Escape($expectedPrefix)
    if($Email-notmatch "^$escaped[0-9]+@example[.]test$"){
        throw "Cleanup guard rejected a non-smoke $Role account."
    }
    $expectedPrefix
}
function Disable-SmokeAccount([string]$Email,[ValidateSet("ADMIN","EMPLOYEE")][string]$Role) {
    $expectedPrefix=Assert-SmokeIdentity $Email $Role
    $dbUser=(& docker compose exec -T postgres printenv POSTGRES_USER).Trim()
    $dbName=(& docker compose exec -T postgres printenv POSTGRES_DB).Trim()
    if($LASTEXITCODE-ne 0-or [string]::IsNullOrWhiteSpace($dbUser)-or [string]::IsNullOrWhiteSpace($dbName)){
        throw "Unable to resolve the local PostgreSQL configuration."
    }
    $pattern="$expectedPrefix%@example.test"
    $sql=@'
UPDATE app_user
SET enabled = false
WHERE email = :'smoke_email'
  AND role = :'smoke_role'
  AND email LIKE :'smoke_pattern'
RETURNING id;
'@
    $result=$sql | & docker compose exec -T postgres psql -X -v ON_ERROR_STOP=1 `
        -v "smoke_email=$Email" -v "smoke_role=$Role" -v "smoke_pattern=$pattern" `
        -U $dbUser -d $dbName -tA
    if($LASTEXITCODE-ne 0-or @($result|Where-Object{$_-match "^[0-9]+$"}).Count-ne 1){
        throw "Exact $Role smoke account was not deactivated."
    }
}
function Start-EmployeeBrowserSmoke {
    if(Get-NetTCPConnection -State Listen -LocalPort 4200 -ErrorAction SilentlyContinue){
        throw "Port 4200 is already used; nothing was stopped."
    }
    $frontLog=Join-Path $backend "target\employee-e2e.log"
    $frontErr=Join-Path $backend "target\employee-e2e-error.log"
    $script:frontendProcess=Start-Process cmd.exe -ArgumentList "/c","npm.cmd start -- --host 127.0.0.1 --port 4200" `
        -WorkingDirectory $frontend -WindowStyle Hidden -RedirectStandardOutput $frontLog `
        -RedirectStandardError $frontErr -PassThru
    $ready=$false
    for($i=0;$i-lt 90;$i++){
        Start-Sleep 1
        try {
            $response=Invoke-WebRequest "http://127.0.0.1:4200" -UseBasicParsing -TimeoutSec 2
            if($response.StatusCode-eq 200){$ready=$true;break}
        } catch {}
        if($script:frontendProcess.HasExited){break}
    }
    if(-not $ready){throw "Angular did not become ready."}
    $env:E2E_EMPLOYEE_EMAIL=$employeeEmail
    $env:E2E_EMPLOYEE_PASSWORD=$employeePassword
    try {
        & npm.cmd run e2e:smoke --prefix $frontend
        if($LASTEXITCODE-ne 0){throw "Playwright employee smoke test failed."}
    } finally {
        Remove-Item Env:E2E_EMPLOYEE_EMAIL,Env:E2E_EMPLOYEE_PASSWORD -ErrorAction SilentlyContinue
    }
}
if(-not(Test-Path -LiteralPath $jar)){throw "Build the backend JAR first."}
if(Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue){throw "Port 8080 is already used; nothing was stopped."}
$guardRejected=$false
try {Assert-SmokeIdentity "admin@example.test" ADMIN|Out-Null}catch{$guardRejected=$true}
if(-not $guardRejected){throw "Cleanup guard accepted a non-smoke account."}
Write-Output "CLEANUP_GUARD_NON_SMOKE=REJECTED"
if([string]::IsNullOrWhiteSpace($AdminEmail)){$AdminEmail="smoke.admin.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"}
if([string]::IsNullOrWhiteSpace($AdminPassword)){$AdminPassword=New-RandomPassword}
Assert-SmokeIdentity $AdminEmail ADMIN|Out-Null
$employeeEmail="smoke.employee.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
$employeePassword=New-RandomPassword
$userEmail="smoke.user.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
$userPassword=New-RandomPassword
try {
    $env:INITIAL_ADMIN_ENABLED="true";$env:INITIAL_ADMIN_EMAIL=$AdminEmail;$env:INITIAL_ADMIN_PASSWORD=$AdminPassword
    $log=Join-Path $backend "target\privileged-smoke.log";$err=Join-Path $backend "target\privileged-smoke-error.log"
    $backendProcess=Start-Process java -ArgumentList "-jar `"$jar`" --spring.profiles.active=dev" -WorkingDirectory $backend `
      -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err -PassThru
    Remove-Item Env:INITIAL_ADMIN_ENABLED,Env:INITIAL_ADMIN_EMAIL,Env:INITIAL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    $ready=$false
    for($i=0;$i-lt 60;$i++){Start-Sleep 1;$health=Request GET "$base/public/reviews";if($health.Code-eq 200){$ready=$true;break};if($backendProcess.HasExited){break}}
    if(-not $ready){throw "Backend did not become ready."}
    Expect ANONYMOUS_EMPLOYEE (Request GET "$base/employee/orders") 401
    $admin=Request POST "$base/auth/login" @{} @{email=$AdminEmail;password=$AdminPassword};Expect ADMIN_LOGIN $admin 200
    $ah=@{Authorization="Bearer $($admin.Content.accessToken)"}
    Expect ADMIN_EMPLOYEES (Request GET "$base/admin/employees" $ah) 200
    $created=Request POST "$base/admin/employees" $ah @{firstName="Smoke";lastName="Employee";email=$employeeEmail;temporaryPassword=$employeePassword;phone="0600000000"}
    Expect ADMIN_CREATE_EMPLOYEE $created 201;$employeeId=$created.Content.id;$employeeCreated=$true
    Expect ADMIN_EMPLOYEE_ACCESS (Request GET "$base/employee/orders?page=0&size=1" $ah) 200
    Expect ADMIN_STATISTICS (Request GET "$base/admin/statistics/menus" $ah) 200
    Expect ADMIN_REBUILD (Request POST "$base/admin/statistics/rebuild" $ah @{}) 200
    $employee=Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword};Expect EMPLOYEE_LOGIN $employee 200
    $eh=@{Authorization="Bearer $($employee.Content.accessToken)"}
    if($FailAfterEmployeeLogin){throw "Intentional intermediate failure used to validate finally cleanup."}
    Expect EMPLOYEE_ORDERS (Request GET "$base/employee/orders?page=0&size=1" $eh) 200
    Expect EMPLOYEE_ADMIN_FORBIDDEN (Request GET "$base/admin/employees" $eh) 403
    $user=Request POST "$base/auth/register" @{} @{firstName="Smoke";lastName="Customer";phone="0600000001";email=$userEmail;
      addressLine="1 rue Test";postalCode="33000";city="Bordeaux";country="France";password=$userPassword;termsAccepted=$true}
    Expect USER_REGISTER $user 201;$uh=@{Authorization="Bearer $($user.Content.accessToken)"}
    Expect USER_EMPLOYEE_FORBIDDEN (Request GET "$base/employee/orders" $uh) 403
    $menus=Request GET "$base/public/menus?size=1";Expect PUBLIC_MENUS $menus 200;$menu=$menus.Content.content|Select-Object -First 1
    if($null-eq $menu){throw "No active menu available."}
    $date=(Get-Date).Date.AddDays(10).ToString("yyyy-MM-dd")
    $order=Request POST "$base/orders" $uh @{menuId=$menu.id;personCount=$menu.minimumPersons;prestationDate=$date;desiredDeliveryTime="12:00";
      deliveryAddress="1 rue Test";deliveryPostalCode="33000";deliveryCity="Bordeaux";deliveryCountry="France";distanceKm=0;
      outsideBordeaux=$false;equipmentLoaned=$false}
    Expect USER_CREATE_ORDER $order 201;$orderId=$order.Content.id;$number=$order.Content.orderNumber
    $page=Request GET "$base/employee/orders?page=0&size=20&status=PENDING&dateFrom=$date&dateTo=$date&search=$number&sort=orderNumber&direction=asc" $eh
    Expect EMPLOYEE_FILTERED_PAGE $page 200
    if($null-eq $page.Content.totalElements-or $null-eq $page.Content.first){throw "Pagination structure incomplete."}
    Expect EMPLOYEE_SIZE_CAPPED (Request GET "$base/employee/orders?size=1000" $eh) 200
    Expect EMPLOYEE_INVALID_SORT (Request GET "$base/employee/orders?sort=passwordHash" $eh) 400
    Expect EMPLOYEE_INVALID_STATUS (Request GET "$base/employee/orders?status=UNKNOWN" $eh) 400
    Expect EMPLOYEE_INVALID_DATES (Request GET "$base/employee/orders?dateFrom=2030-02-01&dateTo=2030-01-01" $eh) 400
    Expect EMPLOYEE_MALFORMED_DATE (Request GET "$base/employee/orders?dateFrom=not-a-date" $eh) 400
    Expect EMPLOYEE_DETAIL (Request GET "$base/employee/orders/$orderId" $eh) 200
    Start-EmployeeBrowserSmoke
    foreach($status in "ACCEPTED","IN_PREPARATION","OUT_FOR_DELIVERY","DELIVERED","COMPLETED"){
      Expect "EMPLOYEE_TRANSITION_$status" (Request PATCH "$base/employee/orders/$orderId/status" $eh @{status=$status;comment="Automated smoke transition"}) 200}
    $detail=Request GET "$base/employee/orders/$orderId" $eh;Expect EMPLOYEE_HISTORY $detail 200
    if($detail.Content.history.Count-lt 6){throw "Order history was not updated."}
    $review=Request POST "$base/users/me/orders/$orderId/review" $uh @{rating=5;comment="Avis automatique de validation du parcours"}
    Expect USER_CREATE_REVIEW $review 201
    Expect EMPLOYEE_PENDING_REVIEWS (Request GET "$base/employee/reviews/pending" $eh) 200
    Expect EMPLOYEE_APPROVE_REVIEW (Request PATCH "$base/employee/reviews/$($review.Content.id)/approve" $eh @{}) 200
    Expect PUBLIC_APPROVED_REVIEWS (Request GET "$base/public/reviews") 200
} catch {
    $scenarioError=$_
} finally {
    if($employeeCreated -and $employeeId -and $ah){
        try {
            $disabled=Request PATCH "$base/admin/employees/$employeeId/enabled?value=false" $ah
            if($disabled.Code-notin 200,204){throw "Employee API deactivation returned HTTP $($disabled.Code)."}
        } catch {$cleanupErrors.Add("EMPLOYEE API cleanup failed: $($_.Exception.Message)")}
    }
    if($employeeCreated){
        try {Disable-SmokeAccount $employeeEmail EMPLOYEE;Write-Output "EMPLOYEE_CLEANUP=DEACTIVATED"}
        catch {$cleanupErrors.Add("EMPLOYEE database cleanup failed: $($_.Exception.Message)")}
    }
    try {Disable-SmokeAccount $AdminEmail ADMIN;Write-Output "ADMIN_CLEANUP=DEACTIVATED"}
    catch {$cleanupErrors.Add("ADMIN database cleanup failed: $($_.Exception.Message)")}
    if($FailCleanupAfterDeactivation){$cleanupErrors.Add("Intentional cleanup failure used to validate the non-zero exit code.")}
    if($backendProcess -and -not $backendProcess.HasExited){
        if($employeeCreated){
            try {Expect EMPLOYEE_RELOGIN_AFTER_CLEANUP (Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword}) 401}
            catch {$cleanupErrors.Add("EMPLOYEE reconnection check failed: $($_.Exception.Message)")}
        }
        try {Expect ADMIN_RELOGIN_AFTER_CLEANUP (Request POST "$base/auth/login" @{} @{email=$AdminEmail;password=$AdminPassword}) 401}
        catch {$cleanupErrors.Add("ADMIN reconnection check failed: $($_.Exception.Message)")}
    }
    $AdminPassword=$null;$employeePassword=$null;$userPassword=$null
    Remove-Item Env:INITIAL_ADMIN_ENABLED,Env:INITIAL_ADMIN_EMAIL,Env:INITIAL_ADMIN_PASSWORD,Env:E2E_EMPLOYEE_EMAIL,Env:E2E_EMPLOYEE_PASSWORD -ErrorAction SilentlyContinue
    Stop-ProcessTree $frontendProcess
    Stop-ProcessTree $backendProcess
}
if($cleanupErrors.Count-gt 0){
    $details=$cleanupErrors-join " | "
    if($scenarioError){Write-Error "SCENARIO_FAILED: $($scenarioError.Exception.Message)" -ErrorAction Continue}
    throw "CLEANUP_FAILED: $details"
}
if($scenarioError){throw "SCENARIO_FAILED: $($scenarioError.Exception.Message)"}
