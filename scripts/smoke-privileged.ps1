param([string]$AdminEmail = "", [string]$AdminPassword = "")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$jar = Join-Path $backend "target\vite-et-gourmand-api-0.1.0-SNAPSHOT.jar"
$base = "http://127.0.0.1:8080/api/v1"
$process = $null
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
if(-not(Test-Path -LiteralPath $jar)){throw "Build the backend JAR first."}
if(Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue){throw "Port 8080 is already used; nothing was stopped."}
if([string]::IsNullOrWhiteSpace($AdminEmail)){$AdminEmail="smoke.admin.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"}
if([string]::IsNullOrWhiteSpace($AdminPassword)){$AdminPassword=New-RandomPassword}
$employeeEmail="smoke.employee.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
$employeePassword=New-RandomPassword
$userEmail="smoke.user.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
$userPassword=New-RandomPassword
try {
    $env:INITIAL_ADMIN_ENABLED="true";$env:INITIAL_ADMIN_EMAIL=$AdminEmail;$env:INITIAL_ADMIN_PASSWORD=$AdminPassword
    $log=Join-Path $backend "target\privileged-smoke.log";$err=Join-Path $backend "target\privileged-smoke-error.log"
    $process=Start-Process java -ArgumentList "-jar `"$jar`" --spring.profiles.active=dev" -WorkingDirectory $backend `
      -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err -PassThru
    Remove-Item Env:INITIAL_ADMIN_ENABLED,Env:INITIAL_ADMIN_EMAIL,Env:INITIAL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    $ready=$false
    for($i=0;$i-lt 60;$i++){Start-Sleep 1;$health=Request GET "$base/public/reviews";if($health.Code-eq 200){$ready=$true;break};if($process.HasExited){break}}
    if(-not $ready){throw "Backend did not become ready."}
    Expect ANONYMOUS_EMPLOYEE (Request GET "$base/employee/orders") 401
    $admin=Request POST "$base/auth/login" @{} @{email=$AdminEmail;password=$AdminPassword};Expect ADMIN_LOGIN $admin 200
    $ah=@{Authorization="Bearer $($admin.Content.accessToken)"}
    Expect ADMIN_EMPLOYEES (Request GET "$base/admin/employees" $ah) 200
    $created=Request POST "$base/admin/employees" $ah @{firstName="Smoke";lastName="Employee";email=$employeeEmail;temporaryPassword=$employeePassword;phone="0600000000"}
    Expect ADMIN_CREATE_EMPLOYEE $created 201;$employeeId=$created.Content.id
    Expect ADMIN_EMPLOYEE_ACCESS (Request GET "$base/employee/orders?page=0&size=1" $ah) 200
    Expect ADMIN_STATISTICS (Request GET "$base/admin/statistics/menus" $ah) 200
    Expect ADMIN_REBUILD (Request POST "$base/admin/statistics/rebuild" $ah @{}) 200
    $employee=Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword};Expect EMPLOYEE_LOGIN $employee 200
    $eh=@{Authorization="Bearer $($employee.Content.accessToken)"}
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
    foreach($status in "ACCEPTED","IN_PREPARATION","OUT_FOR_DELIVERY","DELIVERED","COMPLETED"){
      Expect "EMPLOYEE_TRANSITION_$status" (Request PATCH "$base/employee/orders/$orderId/status" $eh @{status=$status;comment="Automated smoke transition"}) 200}
    $detail=Request GET "$base/employee/orders/$orderId" $eh;Expect EMPLOYEE_HISTORY $detail 200
    if($detail.Content.history.Count-lt 6){throw "Order history was not updated."}
    $review=Request POST "$base/users/me/orders/$orderId/review" $uh @{rating=5;comment="Avis automatique de validation du parcours"}
    Expect USER_CREATE_REVIEW $review 201
    Expect EMPLOYEE_PENDING_REVIEWS (Request GET "$base/employee/reviews/pending" $eh) 200
    Expect EMPLOYEE_APPROVE_REVIEW (Request PATCH "$base/employee/reviews/$($review.Content.id)/approve" $eh @{}) 200
    Expect PUBLIC_APPROVED_REVIEWS (Request GET "$base/public/reviews") 200
} finally {
    if($employeeId -and $ah){try{Request PATCH "$base/admin/employees/$employeeId/enabled?value=false" $ah|Out-Null}catch{}}
    $AdminPassword=$null;$employeePassword=$null;$userPassword=$null
    Remove-Item Env:INITIAL_ADMIN_ENABLED,Env:INITIAL_ADMIN_EMAIL,Env:INITIAL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    if($process -and -not $process.HasExited){Stop-Process $process.Id -Force -ErrorAction SilentlyContinue}
}
