# HTTPS 配置指南

## 概述

本文档提供了为 Fate Novel 项目配置 HTTPS 的完整指南，包括开发环境和生产环境的配置方法。

---

## 🔒 为什么需要 HTTPS？

1. **数据加密**：保护传输中的敏感数据
2. **JWT 安全**：JWT Token 在 HTTPS 下更安全
3. **浏览器要求**：现代浏览器对某些功能要求 HTTPS
4. **SEO 优势**：搜索引擎优先索引 HTTPS 网站

---

## 🛠️ 开发环境配置

### 方案一：使用 mkcert（推荐）

#### 1. 安装 mkcert

**Windows:**
```powershell
# 使用 Chocolatey
choco install mkcert

# 或使用 Scoop
scoop install mkcert
```

**macOS:**
```bash
brew install mkcert
brew install nss  # Firefox 支持
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

#### 2. 创建本地证书

```bash
# 初始化本地 CA
mkcert -install

# 生成证书（在项目根目录）
mkcert localhost 127.0.0.1 ::1
```

这将生成两个文件：
- `localhost+2.pem`（证书）
- `localhost+2-key.pem`（私钥）

#### 3. 配置 Vite（前端）

修改 `web-project/vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../localhost+2.pem'))
    },
    port: 5173,
    host: '0.0.0.0'
  }
})
```

#### 4. 配置 Express（后端）

修改 `backend/src/app.js`：

```javascript
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// ... 现有的中间件和路由配置 ...

const PORT = process.env.PORT || 3000;

// HTTPS 配置
if (process.env.NODE_ENV === 'development') {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../localhost+2.pem'))
  };
  
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  // 生产环境使用 HTTP，由反向代理处理 HTTPS
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

#### 5. 更新环境变量

创建 `backend/.env`：

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d
```

创建 `web-project/.env`：

```env
VITE_API_BASE_URL=https://localhost:3000
```

---

### 方案二：使用 vite-plugin-basic-ssl（简单但证书不受信任）

#### 1. 安装插件

```bash
cd web-project
npm install --save-dev @vitejs/plugin-basic-ssl
```

#### 2. 配置 Vite

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    vue(),
    basicSsl()  // 自动生成自签名证书
  ],
  server: {
    https: true,
    port: 5173
  }
})
```

⚠️ **注意**：此方法生成的证书不受浏览器信任，会显示警告。

---

## 🚀 生产环境配置

### 方案一：使用 Nginx 反向代理（推荐）

#### 1. 获取 SSL 证书

**免费证书（Let's Encrypt）：**

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 2. Nginx 配置

创建 `/etc/nginx/sites-available/fate-novel`：

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 前端
    location / {
        root /var/www/fate-novel/dist;
        try_files $uri $uri/ /index.html;
        
        # 安全头
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/fate-novel /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 4. 自动续期证书

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 会自动设置 cron job，也可以手动添加
sudo crontab -e
# 添加：
0 0 * * * certbot renew --quiet
```

---

### 方案二：使用 Cloudflare（最简单）

#### 1. 添加网站到 Cloudflare

1. 注册 Cloudflare 账号
2. 添加你的域名
3. 更新域名的 DNS 服务器为 Cloudflare 提供的 NS 记录

#### 2. 配置 SSL/TLS

在 Cloudflare 控制台：
1. SSL/TLS → 概述 → 加密模式：选择 "完全" 或 "完全（严格）"
2. SSL/TLS → 边缘证书 → 始终使用 HTTPS：开启
3. SSL/TLS → 边缘证书 → HSTS：启用

#### 3. 配置 DNS

添加 A 记录：
- 名称：`@`（或 `www`）
- IPv4 地址：你的服务器 IP
- 代理状态：已代理（橙色云朵）

✅ **完成**！Cloudflare 会自动处理 HTTPS。

---

## 🔐 安全最佳实践

### 1. 更新 JWT 密钥

```bash
# 生成强密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

将生成的密钥添加到 `.env`：

```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c5b4c0a0db428be0fb0e31e71959e21a6
```

### 2. 设置安全响应头

在 `backend/src/app.js` 添加：

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. 配置 CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'https://localhost:5173',
  credentials: true
}));
```

---

## ✅ 验证 HTTPS 配置

### 1. 检查证书

```bash
# 使用 OpenSSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 检查到期时间
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. 在线工具

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/

### 3. 浏览器测试

1. 访问 `https://yourdomain.com`
2. 点击地址栏的锁图标
3. 查看证书信息

---

## 🐛 常见问题

### 问题 1：证书不受信任

**解决方案**：
- 开发环境：确保运行了 `mkcert -install`
- 生产环境：检查证书链是否完整

### 问题 2：混合内容警告

**解决方案**：
- 确保所有资源（图片、CSS、JS）都使用 HTTPS
- 更新 API 基础 URL 为 HTTPS

### 问题 3：CORS 错误

**解决方案**：
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

## 📝 启动命令

### 开发环境（HTTPS）

```bash
# 后端
cd backend
npm run dev

# 前端
cd web-project
npm run dev
```

访问：`https://localhost:5173`

### 生产环境

```bash
# 构建前端
cd web-project
npm run build

# 部署到 Nginx
sudo cp -r dist/* /var/www/fate-novel/

# 启动后端
cd backend
NODE_ENV=production npm start

# 或使用 PM2
pm2 start src/app.js --name fate-novel-api
```

---

## 🎯 总结

### 开发环境推荐配置：
✅ 使用 mkcert 生成本地证书
✅ Vite 和 Express 都配置 HTTPS
✅ 更新 API_BASE_URL

### 生产环境推荐配置：
✅ 使用 Let's Encrypt 免费证书
✅ Nginx 作为反向代理处理 HTTPS
✅ 配置自动续期

### 安全检查清单：
- [ ] JWT_SECRET 使用强密钥
- [ ] 启用 HSTS
- [ ] 配置安全响应头
- [ ] 定期更新依赖
- [ ] 监控证书过期时间

---

**更新日期**: 2024-12-10
**版本**: 1.0

