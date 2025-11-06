@echo off
echo ======================================
echo     Sowaka 数据格式检查工具
echo ======================================
echo.

cd /d "%~dp0"

echo 正在检查数据库中的数据格式...
echo.

node src/scripts/checkDataFormat.js

echo.
echo 检查完成！
echo.
pause
