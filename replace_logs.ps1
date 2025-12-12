# Скрипт для замены всех вызовов fetch на sendDebugLog
$files = @(
    "src/pages/Profiles.jsx",
    "src/pages/NetworkList.jsx",
    "src/pages/ProfileForm.jsx",
    "src/pages/Home.jsx",
    "src/contexts/WebAppContext.js",
    "src/contexts/MatchContext.js",
    "src/components/BottomNav.jsx",
    "src/App.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Заменяем паттерн fetch на sendDebugLog
        $content = $content -replace "fetch\('http://127\.0\.0\.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',\{method:'POST',headers:\{'Content-Type':'application/json'\},body:JSON\.stringify\((\{[^}]+\})\),timestamp:Date\.now\(\),sessionId:'debug-session',runId:'run1',hypothesisId:'([^']+)'\}\)\)\.catch\(\(\)=>\{\}\);", "sendDebugLog(`$1);"
        Set-Content $file -Value $content -NoNewline
        Write-Host "Updated $file"
    }
}

