param([switch]$Apply)

$ErrorActionPreference = "Stop"
$composeFile = Join-Path $PSScriptRoot "..\docker-compose.yml"

function Invoke-Scalar([string]$Sql) {
    $result = docker compose -f $composeFile exec -T postgres `
        psql -U postgres -d vite_et_gourmand -v ON_ERROR_STOP=1 -tA -c $Sql
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL smoke audit failed." }
    return ($result | Out-String).Trim()
}

$knownUser = "^smoke\.(admin|employee|user)\.[0-9]+@example\.test$"
$knownMenu = "^Smoke (API|Browser) Menu [0-9]+( Updated)?$"
$knownDish = "^Smoke (API|Browser) Dish [0-9]+( (Updated|Second))?$"
$knownAllergen = "^Smoke API Allergen( Second)? [0-9]+( Updated)?$"

try {
    $beforeUsers = Invoke-Scalar "SELECT count(*) FROM app_user WHERE enabled AND email ~ '$knownUser';"
    $beforeMenus = Invoke-Scalar "SELECT count(*) FROM menu WHERE active AND title ~ '$knownMenu';"
    $beforeDishes = Invoke-Scalar "SELECT count(*) FROM dish WHERE active AND name ~ '$knownDish';"
    $beforeLinks = Invoke-Scalar "SELECT count(*) FROM dish_allergen da JOIN dish d ON d.id=da.dish_id JOIN allergen a ON a.id=da.allergen_id WHERE d.name ~ '$knownDish' AND a.name ~ '$knownAllergen';"

    Write-Output "MODE=$(if($Apply){'APPLY'}else{'AUDIT'})"
    Write-Output "BEFORE_ACTIVE_USERS=$beforeUsers"
    Write-Output "BEFORE_ACTIVE_MENUS=$beforeMenus"
    Write-Output "BEFORE_ACTIVE_DISHES=$beforeDishes"
    Write-Output "BEFORE_SMOKE_ALLERGEN_LINKS=$beforeLinks"

    if ($Apply) {
        $transaction = @"
BEGIN;
UPDATE app_user SET enabled=false, updated_at=now()
 WHERE enabled AND email ~ '$knownUser';
UPDATE menu SET active=false, updated_at=now()
 WHERE active AND title ~ '$knownMenu';
UPDATE dish SET active=false
 WHERE active AND name ~ '$knownDish';
DELETE FROM dish_allergen da
 USING dish d, allergen a
 WHERE da.dish_id=d.id AND da.allergen_id=a.id
   AND d.name ~ '$knownDish' AND a.name ~ '$knownAllergen';
COMMIT;
"@
        Invoke-Scalar $transaction | Out-Null
    }

    $afterUsers = Invoke-Scalar "SELECT count(*) FROM app_user WHERE enabled AND email ~ '$knownUser';"
    $afterMenus = Invoke-Scalar "SELECT count(*) FROM menu WHERE active AND title ~ '$knownMenu';"
    $afterDishes = Invoke-Scalar "SELECT count(*) FROM dish WHERE active AND name ~ '$knownDish';"
    $afterLinks = Invoke-Scalar "SELECT count(*) FROM dish_allergen da JOIN dish d ON d.id=da.dish_id JOIN allergen a ON a.id=da.allergen_id WHERE d.name ~ '$knownDish' AND a.name ~ '$knownAllergen';"

    Write-Output "AFTER_ACTIVE_USERS=$afterUsers"
    Write-Output "AFTER_ACTIVE_MENUS=$afterMenus"
    Write-Output "AFTER_ACTIVE_DISHES=$afterDishes"
    Write-Output "AFTER_SMOKE_ALLERGEN_LINKS=$afterLinks"

    if ($Apply -and ($afterUsers -ne "0" -or $afterMenus -ne "0" -or $afterDishes -ne "0" -or $afterLinks -ne "0")) {
        throw "Targeted smoke cleanup is incomplete."
    }
}
catch {
    Write-Error "Targeted smoke cleanup failed: $($_.Exception.Message)"
    exit 1
}
