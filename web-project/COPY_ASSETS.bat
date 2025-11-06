@echo off
echo ========================================
echo 复制媒体资源到public目录
echo ========================================
echo.

REM 检查public目录是否存在
if not exist "public" (
    echo 错误: public目录不存在！
    pause
    exit /b 1
)

REM 复制图片文件
echo 正在复制图片文件...
copy /Y "..\backgroundLeft.jpg" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ backgroundLeft.jpg) else (echo ✗ backgroundLeft.jpg 失败)

copy /Y "..\backgroundRight.png" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ backgroundRight.png) else (echo ✗ backgroundRight.png 失败)

copy /Y "..\backgroundRight2.png" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ backgroundRight2.png) else (echo ✗ backgroundRight2.png 失败)

copy /Y "..\backgroundRight3.png" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ backgroundRight3.png) else (echo ✗ backgroundRight3.png 失败)

copy /Y "..\backgroundRight4.png" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ backgroundRight4.png) else (echo ✗ backgroundRight4.png 失败)

echo.
echo 正在复制视频文件...
copy /Y "..\mainBG_AE_1.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ mainBG_AE_1.mp4) else (echo ✗ mainBG_AE_1.mp4 失败)

copy /Y "..\mainBG_AE.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ mainBG_AE.mp4) else (echo ✗ mainBG_AE.mp4 失败)

copy /Y "..\mainBG.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ mainBG.mp4) else (echo ✗ mainBG.mp4 失败)

copy /Y "..\videoLeft-vmake_AE.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ videoLeft-vmake_AE.mp4) else (echo ✗ videoLeft-vmake_AE.mp4 失败)

copy /Y "..\videoLeft-vmake.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ videoLeft-vmake.mp4) else (echo ✗ videoLeft-vmake.mp4 失败)

copy /Y "..\videoLeft.mp4" "public\" 2>nul
if %errorlevel% equ 0 (echo ✓ videoLeft.mp4) else (echo ✗ videoLeft.mp4 失败)

echo.
echo ========================================
echo 资源复制完成！
echo ========================================
echo.
echo 接下来请运行: npm install
echo 然后运行: npm run dev
echo.
pause


