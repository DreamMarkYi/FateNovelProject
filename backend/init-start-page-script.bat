@echo off
chcp 65001 >nul
echo ============================================
echo StartPage 剧本数据初始化
echo ============================================
echo.

node src/scripts/initStartPageScript.js

echo.
pause

