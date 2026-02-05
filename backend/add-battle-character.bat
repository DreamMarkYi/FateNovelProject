@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 检查是否提供了参数
if "%~1"=="" (
    echo ========================================
    echo ⚔️  战斗角色导入工具
    echo ========================================
    echo.
    echo 用法: add-battle-character.bat ^<JSON文件路径^> [选项]
    echo.
    echo 示例:
    echo   add-battle-character.bat yan_shuang_ying_boss.json
    echo   add-battle-character.bat character.json --type player
    echo   add-battle-character.bat file1.json file2.json --force
    echo.
    echo 使用 --help 查看详细帮助
    echo.
    pause
    exit /b 1
)

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

REM 运行导入脚本，传递所有参数
node src/scripts/addBattleCharacter.js %*

REM 检查执行结果
if errorlevel 1 (
    echo.
    echo ========================================
    echo ❌ 导入过程中出现错误
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ✅ 导入完成
    echo ========================================
)

echo.
pause




























