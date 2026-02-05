@echo off
echo ======================================
echo     涂鸦故事数据初始化
echo ======================================
echo.

cd /d "%~dp0"

echo 正在初始化涂鸦故事数据...
echo.

node src/scripts/initDoodleStories.js

echo.
echo 初始化完成！
echo.
pause






























