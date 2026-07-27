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
$userCreated = $false
$hoursChanged = $false
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
function Assert-SmokeIdentity([string]$Email,[ValidateSet("ADMIN","EMPLOYEE","USER")][string]$Role) {
    $expectedPrefix=switch($Role){"ADMIN"{"smoke.admin."}"EMPLOYEE"{"smoke.employee."}default{"smoke.user."}}
    $escaped=[regex]::Escape($expectedPrefix)
    if($Email-notmatch "^$escaped[0-9]+@example[.]test$"){
        throw "Cleanup guard rejected a non-smoke $Role account."
    }
    $expectedPrefix
}
function Disable-SmokeAccount([string]$Email,[ValidateSet("ADMIN","EMPLOYEE","USER")][string]$Role) {
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
function Disable-SmokeMenu([string]$Title) {
    if($Title-notmatch "^Smoke Browser Menu [0-9]+( Updated)?$"){throw "Menu cleanup guard rejected a non-smoke title."}
    $dbUser=(& docker compose exec -T postgres printenv POSTGRES_USER).Trim()
    $dbName=(& docker compose exec -T postgres printenv POSTGRES_DB).Trim()
    $sql="UPDATE menu SET active=false, updated_at=CURRENT_TIMESTAMP WHERE title=:'exact_title' RETURNING id;"
    $result=$sql | & docker compose exec -T postgres psql -X -v ON_ERROR_STOP=1 -v "exact_title=$Title" -U $dbUser -d $dbName -tA
    if($LASTEXITCODE-ne 0){throw "Browser menu cleanup failed."}
    @($result|Where-Object{$_-match "^[0-9]+$"}).Count
}
function Disable-SmokeDish([string]$Name) {
    if($Name-notmatch "^Smoke Browser Dish [0-9]+( Updated)?$"){throw "Dish cleanup guard rejected a non-smoke name."}
    $dbUser=(& docker compose exec -T postgres printenv POSTGRES_USER).Trim()
    $dbName=(& docker compose exec -T postgres printenv POSTGRES_DB).Trim()
    $sql="UPDATE dish SET active=false WHERE name=:'exact_name' RETURNING id;"
    $result=$sql | & docker compose exec -T postgres psql -X -v ON_ERROR_STOP=1 -v "exact_name=$Name" -U $dbUser -d $dbName -tA
    if($LASTEXITCODE-ne 0){throw "Browser dish cleanup failed."}
    @($result|Where-Object{$_-match "^[0-9]+$"}).Count
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
    $env:E2E_ADMIN_EMAIL=$AdminEmail
    $env:E2E_ADMIN_PASSWORD=$AdminPassword
    $env:E2E_ADMIN_EMPLOYEE_EMAIL=$browserEmployeeEmail
    $env:E2E_ADMIN_EMPLOYEE_PASSWORD=$browserEmployeePassword
    $env:E2E_ADMIN_MENU_TITLE=$browserMenuTitle
    $env:E2E_ADMIN_DISH_NAME=$browserDishName
    $env:E2E_ASSOC_MENU_ID="$adminMenuId"
    $env:E2E_ASSOC_MENU_SLUG=$adminMenuSlug
    $env:E2E_ASSOC_DISH_ONE_ID="$adminDishId"
    $env:E2E_ASSOC_DISH_ONE_NAME="$($dishPayload.name)"
    $env:E2E_ASSOC_DISH_TWO_ID="$adminDishTwoId"
    $env:E2E_ASSOC_DISH_TWO_NAME="$($dishTwoPayload.name)"
    $env:E2E_ALLERGEN_DISH_ID="$adminDishId"
    $env:E2E_ALLERGEN_ONE_NAME=$allergenPayload.name
    $env:E2E_ALLERGEN_TWO_NAME=$allergenTwoPayload.name
    try {
        & npm.cmd run e2e:smoke --prefix $frontend
        if($LASTEXITCODE-ne 0){throw "Playwright employee smoke test failed."}
    } finally {
        Remove-Item Env:E2E_EMPLOYEE_EMAIL,Env:E2E_EMPLOYEE_PASSWORD,Env:E2E_ADMIN_EMAIL,Env:E2E_ADMIN_PASSWORD,Env:E2E_ADMIN_EMPLOYEE_EMAIL,Env:E2E_ADMIN_EMPLOYEE_PASSWORD,Env:E2E_ADMIN_MENU_TITLE,Env:E2E_ADMIN_DISH_NAME,Env:E2E_ASSOC_MENU_ID,Env:E2E_ASSOC_MENU_SLUG,Env:E2E_ASSOC_DISH_ONE_ID,Env:E2E_ASSOC_DISH_ONE_NAME,Env:E2E_ASSOC_DISH_TWO_ID,Env:E2E_ASSOC_DISH_TWO_NAME,Env:E2E_ALLERGEN_DISH_ID,Env:E2E_ALLERGEN_ONE_NAME,Env:E2E_ALLERGEN_TWO_NAME -ErrorAction SilentlyContinue
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
$browserEmployeeEmail="smoke.employee.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())$((Get-Random -Minimum 100 -Maximum 999))@example.test"
$browserEmployeePassword=New-RandomPassword
$smokeMenuTitle="Smoke API Menu $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
$browserMenuTitle="Smoke Browser Menu $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
$smokeDishName="Smoke API Dish $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
$browserDishName="Smoke Browser Dish $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
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
    Expect ANONYMOUS_ADMIN (Request GET "$base/admin/employees") 401
    $admin=Request POST "$base/auth/login" @{} @{email=$AdminEmail;password=$AdminPassword};Expect ADMIN_LOGIN $admin 200
    $ah=@{Authorization="Bearer $($admin.Content.accessToken)"}
    Expect ANONYMOUS_ADMIN_ALLERGENS (Request GET "$base/admin/allergens") 401
    $allergenPayload=@{name="Smoke API Allergen $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"}
    $allergenOne=Request POST "$base/admin/allergens" $ah $allergenPayload;Expect ADMIN_CREATE_ALLERGEN $allergenOne 201;$allergenOneId=$allergenOne.Content.id
    $allergenPayload.name="$($allergenPayload.name) Updated";Expect ADMIN_UPDATE_ALLERGEN (Request PUT "$base/admin/allergens/$allergenOneId" $ah $allergenPayload) 200
    $allergenTwoPayload=@{name="Smoke API Allergen Second $([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"}
    $allergenTwo=Request POST "$base/admin/allergens" $ah $allergenTwoPayload;Expect ADMIN_CREATE_SECOND_ALLERGEN $allergenTwo 201;$allergenTwoId=$allergenTwo.Content.id
    Expect ADMIN_LIST_ALLERGENS (Request GET "$base/admin/allergens" $ah) 200
    Expect ADMIN_ALLERGEN_DETAIL (Request GET "$base/admin/allergens/$allergenOneId" $ah) 200
    Expect ADMIN_INVALID_ALLERGEN (Request POST "$base/admin/allergens" $ah @{name=" "}) 400
    Expect ADMIN_DUPLICATE_ALLERGEN (Request POST "$base/admin/allergens" $ah $allergenPayload) 409
    Expect ANONYMOUS_ADMIN_DISHES (Request GET "$base/admin/dishes") 401
    $dishPayload=@{name=$smokeDishName;description="Plat de validation automatique";type="MAIN_COURSE";active=$true}
    $adminDish=Request POST "$base/admin/dishes" $ah $dishPayload;Expect ADMIN_CREATE_DISH $adminDish 201;$adminDishId=$adminDish.Content.id
    Expect ADMIN_LIST_DISHES (Request GET "$base/admin/dishes" $ah) 200
    Expect ADMIN_DISH_DETAIL (Request GET "$base/admin/dishes/$adminDishId" $ah) 200
    $dishPayload.name="$smokeDishName Updated";$dishPayload.description="Description mise a jour"
    Expect ADMIN_UPDATE_DISH (Request PUT "$base/admin/dishes/$adminDishId" $ah $dishPayload) 200
    $invalidDish=$dishPayload.Clone();$invalidDish.name=" ";Expect ADMIN_DISH_INVALID_NAME (Request PUT "$base/admin/dishes/$adminDishId" $ah $invalidDish) 400
    Expect ADMIN_DISH_DUPLICATE (Request POST "$base/admin/dishes" $ah $dishPayload) 409
    Expect ADMIN_DISABLE_DISH (Request PATCH "$base/admin/dishes/$adminDishId/enabled?value=false" $ah) 200
    Expect ADMIN_REACTIVATE_DISH (Request PATCH "$base/admin/dishes/$adminDishId/enabled?value=true" $ah) 200
    $dishTwoPayload=@{name="$smokeDishName Second";description="Second plat de validation";type="DESSERT";active=$true}
    $adminDishTwo=Request POST "$base/admin/dishes" $ah $dishTwoPayload;Expect ADMIN_CREATE_SECOND_DISH $adminDishTwo 201;$adminDishTwoId=$adminDishTwo.Content.id
    Expect ADMIN_DISH_ALLERGENS_EMPTY (Request GET "$base/admin/dishes/$adminDishId/allergens" $ah) 200
    Expect ADMIN_ADD_DISH_ALLERGEN (Request POST "$base/admin/dishes/$adminDishId/allergens/$allergenOneId" $ah @{}) 200
    Expect ADMIN_DUPLICATE_DISH_ALLERGEN (Request POST "$base/admin/dishes/$adminDishId/allergens/$allergenOneId" $ah @{}) 409
    Expect ADMIN_REPLACE_DISH_ALLERGENS (Request PUT "$base/admin/dishes/$adminDishId/allergens" $ah @{allergenIds=@($allergenOneId,$allergenTwoId)}) 200
    Expect ADMIN_UNKNOWN_ALLERGEN_ASSOCIATION (Request POST "$base/admin/dishes/$adminDishId/allergens/999999999" $ah @{}) 404
    Expect ADMIN_REMOVE_DISH_ALLERGEN (Request DELETE "$base/admin/dishes/$adminDishId/allergens/$allergenOneId" $ah) 200
    Expect ADMIN_REMOVE_ABSENT_DISH_ALLERGEN (Request DELETE "$base/admin/dishes/$adminDishId/allergens/$allergenOneId" $ah) 409
    Expect ANONYMOUS_ADMIN_MENUS (Request GET "$base/admin/menus") 401
    $menuPayload=@{title=$smokeMenuTitle;description="Menu de validation automatique";conditions="Commande de test";minimumPersons=4;basePrice=15.50;availableStock=40;active=$true;theme="Smoke";diet="Classique";imageUrl=$null}
    $adminMenu=Request POST "$base/admin/menus" $ah $menuPayload;Expect ADMIN_CREATE_MENU $adminMenu 201;$adminMenuId=$adminMenu.Content.id;$adminMenuSlug=$adminMenu.Content.slug
    Expect ADMIN_LIST_MENUS (Request GET "$base/admin/menus" $ah) 200
    Expect ADMIN_MENU_DETAIL (Request GET "$base/admin/menus/$adminMenuId" $ah) 200
    $menuPayload.title="$smokeMenuTitle Updated";$menuPayload.basePrice=17.25;$menuPayload.availableStock=44
    Expect ADMIN_UPDATE_MENU (Request PUT "$base/admin/menus/$adminMenuId" $ah $menuPayload) 200
    Expect ANONYMOUS_MENU_DISHES (Request GET "$base/admin/menus/$adminMenuId/dishes") 401
    Expect ADMIN_UNKNOWN_MENU_DISHES (Request GET "$base/admin/menus/999999999/dishes" $ah) 404
    Expect ADMIN_UNKNOWN_DISH_ASSOCIATION (Request POST "$base/admin/menus/$adminMenuId/dishes/999999999" $ah @{}) 404
    Expect ADMIN_MENU_DISHES_EMPTY (Request GET "$base/admin/menus/$adminMenuId/dishes" $ah) 200
    Expect ADMIN_ADD_MENU_DISH (Request POST "$base/admin/menus/$adminMenuId/dishes/$adminDishId" $ah @{}) 200
    $publicMenuWithAllergen=Request GET "$base/public/menus/$adminMenuSlug";Expect PUBLIC_MENU_ALLERGENS $publicMenuWithAllergen 200
    if(-not (($publicMenuWithAllergen.Content.dishes|ForEach-Object{$_.allergens}) -contains $allergenTwoPayload.name)){throw "The associated allergen is missing from the public menu detail."}
    Expect ADMIN_DUPLICATE_MENU_DISH (Request POST "$base/admin/menus/$adminMenuId/dishes/$adminDishId" $ah @{}) 409
    Expect ADMIN_DISABLE_SECOND_DISH (Request PATCH "$base/admin/dishes/$adminDishTwoId/enabled?value=false" $ah) 200
    Expect ADMIN_REJECT_INACTIVE_MENU_DISH (Request POST "$base/admin/menus/$adminMenuId/dishes/$adminDishTwoId" $ah @{}) 409
    Expect ADMIN_REACTIVATE_SECOND_DISH (Request PATCH "$base/admin/dishes/$adminDishTwoId/enabled?value=true" $ah) 200
    Expect ADMIN_ADD_SECOND_MENU_DISH (Request POST "$base/admin/menus/$adminMenuId/dishes/$adminDishTwoId" $ah @{}) 200
    Expect ADMIN_REMOVE_MENU_DISH (Request DELETE "$base/admin/menus/$adminMenuId/dishes/$adminDishId" $ah) 200
    Expect ADMIN_REMOVE_ABSENT_MENU_DISH (Request DELETE "$base/admin/menus/$adminMenuId/dishes/$adminDishId" $ah) 409
    Expect ADMIN_REMOVE_SECOND_MENU_DISH (Request DELETE "$base/admin/menus/$adminMenuId/dishes/$adminDishTwoId" $ah) 200
    $invalid=$menuPayload.Clone();$invalid.basePrice=0;Expect ADMIN_MENU_INVALID_PRICE (Request PUT "$base/admin/menus/$adminMenuId" $ah $invalid) 400
    $invalid=$menuPayload.Clone();$invalid.availableStock=-1;Expect ADMIN_MENU_INVALID_STOCK (Request PUT "$base/admin/menus/$adminMenuId" $ah $invalid) 400
    $invalid=$menuPayload.Clone();$invalid.minimumPersons=0;Expect ADMIN_MENU_INVALID_MINIMUM (Request PUT "$base/admin/menus/$adminMenuId" $ah $invalid) 400
    Expect PUBLIC_ACTIVE_MENU (Request GET "$base/public/menus/$adminMenuSlug") 200
    Expect ADMIN_DISABLE_MENU (Request PATCH "$base/admin/menus/$adminMenuId/enabled?value=false" $ah) 200
    Expect PUBLIC_INACTIVE_MENU (Request GET "$base/public/menus/$adminMenuSlug") 404
    Expect ADMIN_EMPLOYEES (Request GET "$base/admin/employees" $ah) 200
    $created=Request POST "$base/admin/employees" $ah @{firstName="Smoke";lastName="Employee";email=$employeeEmail;temporaryPassword=$employeePassword;phone="0600000000"}
    Expect ADMIN_CREATE_EMPLOYEE $created 201;$employeeId=$created.Content.id;$employeeCreated=$true
    Expect ADMIN_DUPLICATE_EMPLOYEE (Request POST "$base/admin/employees" $ah @{firstName="Smoke";lastName="Employee";email=$employeeEmail;temporaryPassword=$employeePassword;phone="0600000000"}) 409
    $originalHours=Request GET "$base/admin/opening-hours" $ah;Expect ADMIN_OPENING_HOURS $originalHours 200
    $hour=$originalHours.Content|Select-Object -First 1
    if($null-eq $hour){throw "No opening hours available."}
    $changedHour=@{dayOfWeek=$hour.dayOfWeek;closed=$false;openingTime=$(if($hour.closed){"09:00:00"}else{([TimeSpan]::Parse($hour.openingTime).Add([TimeSpan]::FromMinutes(1))).ToString()});closingTime=$(if($hour.closed){"17:00:00"}else{$hour.closingTime});displayOrder=$hour.displayOrder}
    Expect ADMIN_UPDATE_OPENING_HOURS (Request PUT "$base/admin/opening-hours/$($hour.id)" $ah $changedHour) 200
    $hoursChanged=$true
    Expect PUBLIC_UPDATED_OPENING_HOURS (Request GET "$base/public/opening-hours") 200
    Expect ADMIN_EMPLOYEE_ACCESS (Request GET "$base/employee/orders?page=0&size=1" $ah) 200
    Expect ADMIN_STATISTICS (Request GET "$base/admin/statistics/menus" $ah) 200
    Expect ADMIN_REBUILD (Request POST "$base/admin/statistics/rebuild" $ah @{}) 200
    $employee=Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword};Expect EMPLOYEE_LOGIN $employee 200
    $eh=@{Authorization="Bearer $($employee.Content.accessToken)"}
    Expect ADMIN_DISABLE_EMPLOYEE (Request PATCH "$base/admin/employees/$employeeId/enabled?value=false" $ah) 200
    Expect DISABLED_EMPLOYEE_LOGIN (Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword}) 401
    Expect DISABLED_EMPLOYEE_OLD_JWT (Request GET "$base/employee/orders" $eh) 401
    Expect ADMIN_REACTIVATE_EMPLOYEE (Request PATCH "$base/admin/employees/$employeeId/enabled?value=true" $ah) 200
    $employee=Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword};Expect REACTIVATED_EMPLOYEE_LOGIN $employee 200
    $eh=@{Authorization="Bearer $($employee.Content.accessToken)"}
    if($FailAfterEmployeeLogin){throw "Intentional intermediate failure used to validate finally cleanup."}
    Expect EMPLOYEE_ORDERS (Request GET "$base/employee/orders?page=0&size=1" $eh) 200
    Expect EMPLOYEE_ADMIN_FORBIDDEN (Request GET "$base/admin/employees" $eh) 403
    Expect EMPLOYEE_ADMIN_MENUS_FORBIDDEN (Request GET "$base/admin/menus" $eh) 403
    Expect EMPLOYEE_ADMIN_DISHES_FORBIDDEN (Request GET "$base/admin/dishes" $eh) 403
    Expect EMPLOYEE_MENU_DISHES_FORBIDDEN (Request GET "$base/admin/menus/$adminMenuId/dishes" $eh) 403
    Expect EMPLOYEE_ADMIN_ALLERGENS_FORBIDDEN (Request GET "$base/admin/allergens" $eh) 403
    $user=Request POST "$base/auth/register" @{} @{firstName="Smoke";lastName="Customer";phone="0600000001";email=$userEmail;
      addressLine="1 rue Test";postalCode="33000";city="Bordeaux";country="France";password=$userPassword;termsAccepted=$true}
    Expect USER_REGISTER $user 201;$userCreated=$true;$uh=@{Authorization="Bearer $($user.Content.accessToken)"}
    Expect USER_EMPLOYEE_FORBIDDEN (Request GET "$base/employee/orders" $uh) 403
    Expect USER_ADMIN_MENUS_FORBIDDEN (Request GET "$base/admin/menus" $uh) 403
    Expect USER_ADMIN_DISHES_FORBIDDEN (Request GET "$base/admin/dishes" $uh) 403
    Expect USER_MENU_DISHES_FORBIDDEN (Request GET "$base/admin/menus/$adminMenuId/dishes" $uh) 403
    Expect USER_ADMIN_ALLERGENS_FORBIDDEN (Request GET "$base/admin/allergens" $uh) 403
    $inactiveOrder=@{menuId=$adminMenuId;personCount=4;prestationDate=(Get-Date).Date.AddDays(9).ToString("yyyy-MM-dd");desiredDeliveryTime="12:00";deliveryAddress="1 rue Test";deliveryPostalCode="33000";deliveryCity="Bordeaux";deliveryCountry="France";distanceKm=0;outsideBordeaux=$false;equipmentLoaned=$false}
    Expect USER_INACTIVE_MENU_ORDER (Request POST "$base/orders" $uh $inactiveOrder) 404
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
    Expect ADMIN_REACTIVATE_MENU_FOR_BROWSER (Request PATCH "$base/admin/menus/$adminMenuId/enabled?value=true" $ah) 200
    Start-EmployeeBrowserSmoke
    Expect ADMIN_DISABLE_MENU_AFTER_BROWSER (Request PATCH "$base/admin/menus/$adminMenuId/enabled?value=false" $ah) 200
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
    if($adminDishId -and $ah){
        try {Expect ADMIN_ALLERGEN_ASSOCIATIONS_CLEANUP (Request PUT "$base/admin/dishes/$adminDishId/allergens" $ah @{allergenIds=@()}) 200}
        catch {$cleanupErrors.Add("API allergen association cleanup failed: $($_.Exception.Message)")}
    }
    try {
        $browserDishes=(Disable-SmokeDish "$browserDishName Updated")+(Disable-SmokeDish $browserDishName)
        if($browserDishes-gt 0){Write-Output "BROWSER_DISH_CLEANUP=DEACTIVATED"}
    } catch {$cleanupErrors.Add("Browser dish cleanup failed: $($_.Exception.Message)")}
    if($adminDishId -and $ah){
        try {Expect ADMIN_DISH_FINAL_DISABLE (Request PATCH "$base/admin/dishes/$adminDishId/enabled?value=false" $ah) 200}
        catch {$cleanupErrors.Add("API dish cleanup failed: $($_.Exception.Message)")}
    }
    if($adminDishTwoId -and $ah){
        try {Expect ADMIN_SECOND_DISH_FINAL_DISABLE (Request PATCH "$base/admin/dishes/$adminDishTwoId/enabled?value=false" $ah) 200}
        catch {$cleanupErrors.Add("Second API dish cleanup failed: $($_.Exception.Message)")}
    }
    try {
        $browserMenus=(Disable-SmokeMenu "$browserMenuTitle Updated")+(Disable-SmokeMenu $browserMenuTitle)
        if($browserMenus-gt 0){Write-Output "BROWSER_MENU_CLEANUP=DEACTIVATED"}
    } catch {$cleanupErrors.Add("Browser menu cleanup failed: $($_.Exception.Message)")}
    if($adminMenuId -and $ah){
        try {Expect ADMIN_MENU_FINAL_DISABLE (Request PATCH "$base/admin/menus/$adminMenuId/enabled?value=false" $ah) 200}
        catch {$cleanupErrors.Add("API menu cleanup failed: $($_.Exception.Message)")}
    }
    if($hoursChanged -and $hour -and $ah){
        try {
            $restore=@{dayOfWeek=$hour.dayOfWeek;openingTime=$hour.openingTime;closingTime=$hour.closingTime;closed=$hour.closed;displayOrder=$hour.displayOrder}
            $restored=Request PUT "$base/admin/opening-hours/$($hour.id)" $ah $restore
            if($restored.Code-ne 200){throw "Opening hours restore returned HTTP $($restored.Code)."}
            Write-Output "OPENING_HOURS_RESTORED=200"
        } catch {$cleanupErrors.Add("Opening hours restore failed: $($_.Exception.Message)")}
    }
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
    try {Disable-SmokeAccount $browserEmployeeEmail EMPLOYEE;Write-Output "BROWSER_EMPLOYEE_CLEANUP=DEACTIVATED"}
    catch {
        if($_.Exception.Message-notlike "*was not deactivated*"){$cleanupErrors.Add("Browser EMPLOYEE cleanup failed: $($_.Exception.Message)")}
    }
    try {Disable-SmokeAccount $AdminEmail ADMIN;Write-Output "ADMIN_CLEANUP=DEACTIVATED"}
    catch {$cleanupErrors.Add("ADMIN database cleanup failed: $($_.Exception.Message)")}
    if($userCreated){
        try {Disable-SmokeAccount $userEmail USER;Write-Output "USER_CLEANUP=DEACTIVATED"}
        catch {$cleanupErrors.Add("USER database cleanup failed: $($_.Exception.Message)")}
    }
    if($FailCleanupAfterDeactivation){$cleanupErrors.Add("Intentional cleanup failure used to validate the non-zero exit code.")}
    if($backendProcess -and -not $backendProcess.HasExited){
        if($employeeCreated){
            try {Expect EMPLOYEE_RELOGIN_AFTER_CLEANUP (Request POST "$base/auth/login" @{} @{email=$employeeEmail;password=$employeePassword}) 401}
            catch {$cleanupErrors.Add("EMPLOYEE reconnection check failed: $($_.Exception.Message)")}
        }
        try {Expect ADMIN_RELOGIN_AFTER_CLEANUP (Request POST "$base/auth/login" @{} @{email=$AdminEmail;password=$AdminPassword}) 401}
        catch {$cleanupErrors.Add("ADMIN reconnection check failed: $($_.Exception.Message)")}
    }
    $AdminPassword=$null;$employeePassword=$null;$browserEmployeePassword=$null;$userPassword=$null
    Remove-Item Env:INITIAL_ADMIN_ENABLED,Env:INITIAL_ADMIN_EMAIL,Env:INITIAL_ADMIN_PASSWORD,Env:E2E_EMPLOYEE_EMAIL,Env:E2E_EMPLOYEE_PASSWORD,Env:E2E_ADMIN_EMAIL,Env:E2E_ADMIN_PASSWORD,Env:E2E_ADMIN_EMPLOYEE_EMAIL,Env:E2E_ADMIN_EMPLOYEE_PASSWORD,Env:E2E_ADMIN_MENU_TITLE,Env:E2E_ADMIN_DISH_NAME -ErrorAction SilentlyContinue
    Stop-ProcessTree $frontendProcess
    Stop-ProcessTree $backendProcess
}
if($cleanupErrors.Count-gt 0){
    $details=$cleanupErrors-join " | "
    if($scenarioError){Write-Error "SCENARIO_FAILED: $($scenarioError.Exception.Message)" -ErrorAction Continue}
    throw "CLEANUP_FAILED: $details"
}
if($scenarioError){throw "SCENARIO_FAILED: $($scenarioError.Exception.Message)"}
