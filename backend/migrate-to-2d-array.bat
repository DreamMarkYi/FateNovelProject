@echo off
echo ======================================
echo   迁移 storyTextRight 到二维数组结构
echo ======================================
echo.

cd /d "%~dp0"

echo 正在迁移数据结构...
echo 注意：此操作会修改数据库中的数据，请确保已备份！
echo.

set /p confirm="确认继续吗？(y/N): "
if /i "%confirm%" neq "y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo 开始迁移...
echo.

node src/scripts/migrateToTwoDimensionalArray.js

echo.
echo 迁移完成！
echo.
pause
