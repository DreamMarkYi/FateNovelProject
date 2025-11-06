# 🗄️ MySQL 启动配置指南

## 📋 目录
- [检查MySQL安装状态](#检查mysql安装状态)
- [Windows系统启动MySQL](#windows系统启动mysql)
- [macOS系统启动MySQL](#macos系统启动mysql)
- [Linux系统启动MySQL](#linux系统启动mysql)
- [Docker方式启动MySQL](#docker方式启动mysql)
- [MySQL配置验证](#mysql配置验证)
- [常见问题解决](#常见问题解决)

---

## 🔍 检查MySQL安装状态

### 方法1：命令行检查
```bash
# 检查MySQL是否已安装
mysql --version

# 检查MySQL服务状态（Windows）
sc query MySQL80

# 检查MySQL服务状态（macOS/Linux）
brew services list | grep mysql
# 或
systemctl status mysql
```

### 方法2：查看已安装程序
- **Windows**: 控制面板 → 程序和功能 → 查找"MySQL"
- **macOS**: 系统偏好设置 → MySQL（如果有图标）
- **Linux**: `dpkg -l | grep mysql` 或 `rpm -qa | grep mysql`

---

## 🪟 Windows系统启动MySQL

### 情况1：已安装MySQL服务

#### 使用服务管理器启动
1. 按 `Win + R`，输入 `services.msc`
2. 找到 "MySQL80" 或类似名称的服务
3. 右键 → 启动

#### 使用命令行启动
```cmd
# 以管理员身份打开命令提示符

# 启动MySQL服务
net start MySQL80

# 或者使用具体的服务名
net start MySQL
```

#### 使用PowerShell启动
```powershell
# 以管理员身份打开PowerShell

# 启动MySQL服务
Start-Service -Name "MySQL80"

# 检查服务状态
Get-Service -Name "MySQL80"
```

### 情况2：未安装MySQL

#### 下载安装MySQL
1. 访问 [MySQL官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 "MySQL Community Server"
3. 选择 "Windows (x86, 64-bit), MSI Installer"
4. 运行安装程序

#### 安装配置要点
```
安装类型: Developer Default
Root密码: 设置一个强密码（记住这个密码！）
端口: 3306（默认）
Windows服务: 勾选"Start the MySQL Server at System Startup"
```

### 情况3：使用便携版MySQL

创建启动脚本 `start-mysql.bat`：
```batch
@echo off
echo 启动MySQL服务器...

cd /d "C:\mysql\bin"
mysqld --console

pause
```

---

## 🍎 macOS系统启动MySQL

### 情况1：使用Homebrew安装的MySQL

```bash
# 启动MySQL服务
brew services start mysql

# 检查服务状态
brew services list | grep mysql

# 停止MySQL服务（如需要）
brew services stop mysql
```

### 情况2：使用官方安装包

#### 通过系统偏好设置
1. 打开"系统偏好设置"
2. 点击"MySQL"图标
3. 点击"Start MySQL Server"

#### 通过命令行
```bash
# 启动MySQL
sudo /usr/local/mysql/support-files/mysql.server start

# 检查状态
sudo /usr/local/mysql/support-files/mysql.server status

# 停止MySQL
sudo /usr/local/mysql/support-files/mysql.server stop
```

### 情况3：未安装MySQL

#### 使用Homebrew安装（推荐）
```bash
# 安装Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装MySQL
brew install mysql

# 启动MySQL
brew services start mysql

# 设置root密码
mysql_secure_installation
```

---

## 🐧 Linux系统启动MySQL

### Ubuntu/Debian系统

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 启动MySQL
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 如果未安装MySQL
sudo apt update
sudo apt install mysql-server

# 安全配置
sudo mysql_secure_installation
```

### CentOS/RHEL系统

```bash
# 检查MySQL状态
sudo systemctl status mysqld

# 启动MySQL
sudo systemctl start mysqld

# 设置开机自启
sudo systemctl enable mysqld

# 如果未安装MySQL
sudo yum install mysql-server
# 或
sudo dnf install mysql-server
```

---

## 🐳 Docker方式启动MySQL（推荐）

### 创建Docker启动脚本

创建文件 `docker-mysql.yml`：
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: novel-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: novel_reading_db
      MYSQL_USER: novel_user
      MYSQL_PASSWORD: novel_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-init:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

### 启动命令
```bash
# 启动MySQL容器
docker-compose -f docker-mysql.yml up -d

# 查看容器状态
docker ps

# 查看日志
docker logs novel-mysql

# 停止容器
docker-compose -f docker-mysql.yml down
```

### 简单Docker命令
```bash
# 直接运行MySQL容器
docker run -d \
  --name novel-mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=novel_reading_db \
  -p 3306:3306 \
  mysql:8.0

# 进入MySQL容器
docker exec -it novel-mysql mysql -u root -p
```

---

## ✅ MySQL配置验证

### 1. 测试连接
```bash
# 使用命令行连接
mysql -u root -p

# 指定主机和端口
mysql -h localhost -P 3306 -u root -p
```

### 2. 验证数据库
```sql
-- 在MySQL命令行中执行
SHOW DATABASES;
SELECT VERSION();
SELECT USER();
```

### 3. 创建项目用户（可选）
```sql
-- 创建专用用户
CREATE USER 'novel_user'@'localhost' IDENTIFIED BY 'novel_password';

-- 授权
GRANT ALL PRIVILEGES ON novel_reading_db.* TO 'novel_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 4. 更新项目配置

修改 `backend/config.js`：
```javascript
module.exports = {
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',           // 或 'novel_user'
    password: 'your_password', // 你设置的密码
    database: 'novel_reading_db'
  }
};
```

---

## 🚨 常见问题解决

### 问题1：端口被占用
```bash
# 查看3306端口占用情况
netstat -an | grep 3306

# Windows查看端口占用
netstat -ano | findstr 3306

# 杀死占用进程（谨慎操作）
taskkill /PID <进程ID> /F
```

### 问题2：密码错误
```bash
# 重置root密码（MySQL 8.0）
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

### 问题3：服务启动失败
```bash
# 查看错误日志
# Windows: C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
# macOS: /usr/local/mysql/data/*.err
# Linux: /var/log/mysql/error.log

# 检查配置文件
# Windows: C:\ProgramData\MySQL\MySQL Server 8.0\my.ini
# macOS/Linux: /etc/mysql/my.cnf
```

### 问题4：权限不足
```bash
# Linux/macOS 给予执行权限
sudo chmod +x /usr/local/mysql/support-files/mysql.server

# Windows 以管理员身份运行命令提示符
```

---

## 🎯 针对本项目的快速启动

### 创建一键启动脚本

**Windows (`start-mysql-project.bat`):**
```batch
@echo off
echo ========================================
echo      轻小说项目 MySQL 启动脚本
echo ========================================

echo 1. 启动MySQL服务...
net start MySQL80
if %errorlevel% neq 0 (
    echo MySQL服务启动失败，请检查安装状态
    pause
    exit /b 1
)

echo 2. 等待MySQL服务完全启动...
timeout /t 5

echo 3. 测试数据库连接...
mysql -u root -p -e "SELECT 'MySQL连接成功!' as status;"

echo 4. 初始化项目数据库...
cd /d "%~dp0"
npm run init-db

echo ========================================
echo MySQL已启动，项目数据库已初始化！
echo 现在可以运行: npm run dev
echo ========================================
pause
```

**macOS/Linux (`start-mysql-project.sh`):**
```bash
#!/bin/bash

echo "========================================"
echo "      轻小说项目 MySQL 启动脚本"
echo "========================================"

echo "1. 启动MySQL服务..."
if command -v brew &> /dev/null; then
    brew services start mysql
elif command -v systemctl &> /dev/null; then
    sudo systemctl start mysql
else
    echo "请手动启动MySQL服务"
    exit 1
fi

echo "2. 等待MySQL服务完全启动..."
sleep 5

echo "3. 测试数据库连接..."
mysql -u root -p -e "SELECT 'MySQL连接成功!' as status;"

echo "4. 初始化项目数据库..."
npm run init-db

echo "========================================"
echo "MySQL已启动，项目数据库已初始化！"
echo "现在可以运行: npm run dev"
echo "========================================"
```

### 使用方法
```bash
# Windows
start-mysql-project.bat

# macOS/Linux
chmod +x start-mysql-project.sh
./start-mysql-project.sh
```

---

## 📞 需要帮助？

如果遇到问题：

1. **检查错误日志**：查看MySQL错误日志文件
2. **验证端口**：确保3306端口未被占用
3. **检查权限**：确保有足够的系统权限
4. **重启服务**：尝试重启MySQL服务
5. **重新安装**：如果问题严重，考虑重新安装MySQL

**常用命令速查：**
```bash
# 启动MySQL
Windows: net start MySQL80
macOS:   brew services start mysql
Linux:   sudo systemctl start mysql

# 连接MySQL
mysql -u root -p

# 查看进程
Windows: tasklist | findstr mysql
macOS:   ps aux | grep mysql
Linux:   ps aux | grep mysql
```

---

**创建时间：** 2025年1月  
**适用项目：** 轻小说阅读网站  
**MySQL版本：** 8.0+

