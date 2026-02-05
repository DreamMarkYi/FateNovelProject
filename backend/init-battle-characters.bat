@echo off
chcp 65001 >nul
echo ========================================
echo ⚔️  战斗角色数据库初始化
echo ========================================
echo.

REM 检查 MongoDB 是否运行
echo 检查 MongoDB 服务状态...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 (
    echo.
    echo ⚠️  警告: MongoDB 服务未运行
    echo.
    echo 请先启动 MongoDB 服务:
    echo   方法1: net start MongoDB
    echo   方法2: 打开 MongoDB Compass
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB 服务正在运行
echo.

REM 运行初始化脚本
echo 正在初始化战斗角色数据...
echo.
node src/scripts/initBattleCharacters.js

echo.
echo ========================================
echo 初始化完成
echo ========================================
echo.

pause




























