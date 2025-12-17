@echo off
chcp 65001 > nul
echo ========================================
echo 剧本脚本数据初始化
echo ========================================
echo.
echo 本脚本将初始化Galgame剧本数据到MongoDB
echo.
echo 注意: 
echo   - 确保MongoDB服务已启动
echo   - 此操作会清空现有的剧本数据
echo.
pause

node src/scripts/initNovelScript.js

echo.
echo ========================================
pause











