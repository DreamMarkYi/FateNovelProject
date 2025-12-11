// JWT 配置文件
module.exports = {
  // JWT 密钥（必须使用环境变量，生产环境不要使用默认值）
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // Token 过期时间
  expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Token 签发者（标识 Token 是哪个系统发的）
  issuer: process.env.JWT_ISSUER || 'fate-novel-api',
  
  // Token 受众（标识 Token 是给谁用的）
  audience: process.env.JWT_AUDIENCE || 'fate-novel-users'
};


