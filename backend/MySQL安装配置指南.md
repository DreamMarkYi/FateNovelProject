# 🛠️ MySQL 安装配置指南（针对轻小说项目）

## 📋 当前安装步骤指导

根据您的安装界面，请按以下配置进行：

### 1. Type and Networking 配置

#### Server Configuration Type
```
✅ 选择: Development Computer
```
**说明：** 适合开发环境，资源占用较少

#### Connectivity 连接配置
```
✅ TCP/IP: 勾选 ✓
✅ Port: 3306 （保持默认）
✅ X Protocol Port: 33060 （保持默认）
✅ Open Windows Firewall ports: 勾选 ✓
```

#### Named Pipe 和 Shared Memory
```
❌ Named Pipe: 不勾选（项目不需要）
❌ Shared Memory: 不勾选（项目不需要）
```

#### Advanced Configuration
```
❌ Show Advanced and Logging Options: 不勾选
```
**说明：** 项目使用默认配置即可

---

## 📝 完整安装步骤指导

### 第1步：Type and Networking（当前步骤）
按上述配置完成后，点击 **"Next >"**

### 第2步：Authentication Method
```
✅ 选择: Use Strong Password Encryption for Authentication
```

### 第3步：Accounts and Roles
```
Root Password: 设置一个强密码（请记住！）
建议密码: MyProject2025!

✅ 勾选: Enable X Protocol
```

**⚠️ 重要：请记住这个密码，后续配置需要用到！**

### 第4步：Windows Service
```
✅ Configure MySQL Server as a Windows Service: 勾选
✅ Windows Service Name: MySQL80 （默认）
✅ Start the MySQL Server at System Startup: 勾选
✅ Run Windows Service as: Standard System Account
```

### 第5步：Server File Permissions
```
✅ 保持默认设置即可
```

### 第6步：Apply Configuration
等待配置完成

---

## 🔧 安装完成后的项目配置

### 1. 更新项目配置文件

安装完成后，编辑 `backend/config.js`：

```javascript
module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MyProject2025!', // 替换为你设置的密码
    database: process.env.DB_NAME || 'novel_reading_db'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};
```

### 2. 测试MySQL连接

安装完成后，打开命令提示符测试：

```cmd
# 测试MySQL连接
mysql -u root -p

# 输入你设置的密码
# 如果成功，会看到 mysql> 提示符

# 退出MySQL
exit
```

### 3. 运行项目初始化

```cmd
# 进入backend目录
cd backend

# 安装依赖（如果还没安装）
npm install

# 初始化数据库
npm run init-db

# 启动后端服务器
npm run dev
```

---

## 🎯 推荐的MySQL配置

### 开发环境配置
```
Server Configuration Type: Development Computer
Port: 3306
Root Password: MyProject2025! （或你喜欢的强密码）
Windows Service: 启用，开机自启
```

### 生产环境配置（将来部署时）
```
Server Configuration Type: Server Computer
Port: 3306
Root Password: 更复杂的密码
创建专用数据库用户
启用SSL连接
```

---

## 📊 配置验证清单

安装完成后，请验证以下项目：

### ✅ MySQL服务检查
```cmd
# 检查MySQL服务状态
sc query MySQL80

# 应该显示 STATE: 4 RUNNING
```

### ✅ 端口检查
```cmd
# 检查3306端口是否开放
netstat -an | findstr 3306

# 应该显示 0.0.0.0:3306 LISTENING
```

### ✅ 连接测试
```cmd
# 连接测试
mysql -u root -p -e "SELECT VERSION();"

# 应该显示MySQL版本信息
```

### ✅ 防火墙检查
确保Windows防火墙允许MySQL通过（安装时应该已自动配置）

---

## 🚨 常见安装问题

### 问题1：端口3306被占用
**解决方案：**
```cmd
# 查看占用3306端口的程序
netstat -ano | findstr 3306

# 如果有其他程序占用，可以：
# 1. 停止占用程序
# 2. 或在安装时选择其他端口（如3307）
```

### 问题2：安装失败
**解决方案：**
1. 以管理员身份运行安装程序
2. 关闭杀毒软件
3. 确保有足够的磁盘空间

### 问题3：服务启动失败
**解决方案：**
```cmd
# 手动启动服务
net start MySQL80

# 查看错误日志
# 位置：C:\ProgramData\MySQL\MySQL Server 9.5\Data\*.err
```

---

## 🎉 安装完成后的下一步

### 1. 验证安装
```cmd
# 进入backend目录
cd C:\Users\PC\Documents\xwechat_files\wxid_2ads3b2zma0q22_2d1d\msg\file\2025-11\untitled\backend

# 运行我们创建的启动脚本
start-mysql-project.bat
```

### 2. 启动项目
```cmd
# 后端
cd backend
npm run dev

# 前端（新开终端）
cd web-project
npm install
npm run dev
```

### 3. 访问测试
- 后端API: http://localhost:3000
- 前端页面: http://localhost:5173/sowaka

---

## 📞 需要帮助？

如果安装过程中遇到问题：

1. **记录错误信息**：截图或复制错误消息
2. **检查系统要求**：Windows 10/11，足够的磁盘空间
3. **管理员权限**：确保以管理员身份运行
4. **重新安装**：如果问题严重，可以卸载后重新安装

**重要提醒：**
- ✅ 记住root密码
- ✅ 确保端口3306可用
- ✅ 启用Windows服务
- ✅ 开机自启动

---

**配置完成后，您的MySQL就可以为轻小说项目提供数据库服务了！** 🎊

