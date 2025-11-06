@echo off
chcp 65001 >nul
echo ========================================
echo      轻小说项目 MySQL 启动脚本
echo ========================================

echo.
echo 1. 检查MySQL服务状态...
sc query MySQL80 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL80服务未找到，尝试查找其他MySQL服务...
    sc query | findstr /i mysql
    echo.
    echo 请确认MySQL已正确安装，或手动启动MySQL服务
    echo 常见服务名: MySQL, MySQL80, MySQL57
    pause
    exit /b 1
)

echo ✅ 找到MySQL80服务

echo.
echo 2. 启动MySQL服务...
net start MySQL80
if %errorlevel% neq 0 (
    echo ❌ MySQL服务启动失败
    echo 可能原因：
    echo - 服务已在运行
    echo - 权限不足（请以管理员身份运行）
    echo - 端口3306被占用
    echo.
    echo 检查端口占用：netstat -ano ^| findstr 3306
    pause
    exit /b 1
)

echo ✅ MySQL服务启动成功

echo.
echo 3. 等待MySQL服务完全启动...
timeout /t 3 >nul

echo.
echo 4. 测试数据库连接...
echo 请输入MySQL root密码来测试连接：
mysql -u root -p -e "SELECT '数据库连接成功!' as status, VERSION() as version;"
if %errorlevel% neq 0 (
    echo ❌ 数据库连接失败
    echo 请检查：
    echo - root密码是否正确
    echo - MySQL是否完全启动
    echo - 防火墙设置
    pause
    exit /b 1
)

echo ✅ 数据库连接测试成功

echo.
echo 5. 检查项目配置...
if not exist "config.js" (
    echo ❌ 未找到config.js文件
    echo 请确保在backend目录下运行此脚本
    pause
    exit /b 1
)

echo ✅ 项目配置文件存在

echo.
echo 6. 安装项目依赖（如果需要）...
if not exist "node_modules" (
    echo 正在安装npm依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ npm依赖安装完成
) else (
    echo ✅ npm依赖已存在
)

echo.
echo 7. 初始化项目数据库...
echo 正在创建数据库和表结构...
npm run init-db
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    echo 请检查：
    echo - config.js中的数据库配置
    echo - MySQL用户权限
    echo - 网络连接
    pause
    exit /b 1
)

echo ✅ 数据库初始化完成

echo.
echo ========================================
echo           🎉 启动完成！
echo ========================================
echo.
echo ✅ MySQL服务已启动
echo ✅ 数据库已初始化
echo ✅ 示例数据已插入
echo.
echo 📝 接下来的步骤：
echo    1. 运行: npm run dev  （启动后端服务器）
echo    2. 新开终端，进入web-project目录
echo    3. 运行: npm install ^&^& npm run dev  （启动前端）
echo    4. 访问: http://localhost:5173/sowaka
echo.
echo 🔗 API地址: http://localhost:3000/api/contents
echo 🔗 健康检查: http://localhost:3000/health
echo.
echo ========================================

echo.
set /p choice="是否现在启动后端服务器？(y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 正在启动后端服务器...
    npm run dev
) else (
    echo.
    echo 手动启动命令: npm run dev
    pause
)

