@echo off
echo ======================================
echo     Sowaka 故事数据初始化 (简化版)
echo ======================================
echo.

cd /d "%~dp0"

echo 正在初始化Sowaka故事数据...
echo.

node src/scripts/initSowakaStorySimple.js

echo.
echo 初始化完成！
echo.
pause
