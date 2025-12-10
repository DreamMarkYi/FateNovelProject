@echo off
chcp 65001 >nul
echo ============================================
echo Start Page API 测试脚本
echo ============================================
echo.

:: 设置API基础URL
set API_URL=http://localhost:3000/api/mongo/start-choices

echo [1/5] 测试：创建玩家
echo.
curl -X POST %API_URL%/create-player ^
  -H "Content-Type: application/json" ^
  -d "{\"playerName\":\"测试玩家\",\"identityChoice\":\"named\"}" ^
  > temp_response.json

echo.
echo 响应：
type temp_response.json
echo.
echo.

:: 从响应中提取playerId（需要手动设置）
echo [2/5] 请从上面的响应中复制 playerId，然后输入：
set /p PLAYER_ID="playerId: "

echo.
echo [3/5] 测试：记录第一个选择
echo.
curl -X POST %API_URL%/player/%PLAYER_ID%/choice ^
  -H "Content-Type: application/json" ^
  -d "{\"sceneId\":30,\"choiceText\":\"微光的窄门\",\"score\":1}"

echo.
echo.

echo [4/5] 测试：记录第二个选择
echo.
curl -X POST %API_URL%/player/%PLAYER_ID%/choice ^
  -H "Content-Type: application/json" ^
  -d "{\"sceneId\":31,\"choiceText\":\"时钟的滴答声\",\"score\":1}"

echo.
echo.

echo [5/5] 测试：完成游戏
echo.
curl -X POST %API_URL%/player/%PLAYER_ID%/complete ^
  -H "Content-Type: application/json" ^
  -d "{\"endingId\":100,\"playTime\":120}"

echo.
echo.

echo [额外] 获取统计数据
echo.
curl %API_URL%/statistics

echo.
echo.

echo [额外] 获取玩家记录
echo.
curl %API_URL%/player/%PLAYER_ID%

echo.
echo.

:: 清理临时文件
del temp_response.json >nul 2>&1

echo ============================================
echo 测试完成！
echo ============================================
pause

