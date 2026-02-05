@echo off
chcp 65001 >nul
echo ========================================
echo Novel Script JSON 导入工具
echo ========================================
echo.

if "%1"=="" (
    echo 用法: import-novel-script.bat ^<JSON文件路径^> [选项]
    echo.
    echo 选项:
    echo   --no-update    如果剧本已存在，不更新（默认会更新）
    echo   --batch        批量导入模式
    echo.
    echo 示例:
    echo   import-novel-script.bat script.json
    echo   import-novel-script.bat script.json --no-update
    echo   import-novel-script.bat script1.json script2.json --batch
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"
node src/scripts/importNovelScriptFromJson.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 导入失败！
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ 导入完成！
pause
































