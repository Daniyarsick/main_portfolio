$pattern1 = "Аннануров Даниил Петрович ИВТ 1.2"
$pattern2 = "Аннануров_Даниил_Петрович_ивт_1_2_"

Get-ChildItem -Path "d:\main_portfolio" -Recurse -Include *.pdf | ForEach-Object {
    $newName = $_.Name -replace [Regex]::Escape($pattern1), ""
    $newName = $newName -replace $pattern2, ""
    $newName = $newName.Trim()
    
    if ($newName -ne $_.Name) {
        $newPath = Join-Path $_.Directory.FullName $newName
        
        # Handle collisions
        if (Test-Path $newPath) {
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($newName)
            $extension = [System.IO.Path]::GetExtension($newName)
            $counter = 1
            do {
                $tempName = "$baseName ($counter)$extension"
                $newPath = Join-Path $_.Directory.FullName $tempName
                $counter++
            } while (Test-Path $newPath)
        }
        
        Rename-Item -Path $_.FullName -NewName $newPath
        Write-Host "Renamed '$($_.Name)' to '$([System.IO.Path]::GetFileName($newPath))'"
    }
}
