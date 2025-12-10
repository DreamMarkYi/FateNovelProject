@echo off
chcp 65001 >nul
echo ============================================
echo Start Page 快速启动测试
echo ============================================
echo.

echo [检查] MongoDB 是否运行...
curl -s http://localhost:27017 >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB 未运行！请先启动 MongoDB
    echo    可以运行：mongod --dbpath "你的数据路径"
    pause
    exit /b 1
) else (
    echo ✅ MongoDB 正在运行
)
echo.

echo [检查] 后端服务器是否运行...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务器未运行！
    echo    请在另一个终端运行：
    echo    cd backend
    echo    npm start
    pause
    exit /b 1
) else (
    echo ✅ 后端服务器正在运行
)
echo.

echo [测试] 创建测试玩家...
curl -s -X POST http://localhost:3000/api/mongo/start-choices/create-player ^
  -H "Content-Type: application/json" ^
  -d "{\"playerName\":\"测试用户\",\"identityChoice\":\"named\"}"
echo.
echo.

echo [测试] 获取统计数据...
curl -s http://localhost:3000/api/mongo/start-choices/statistics
echo.
echo.

echo ============================================
echo ✅ 所有测试通过！
echo.
echo 现在可以访问：http://localhost:5173/start
echo ============================================
pause

