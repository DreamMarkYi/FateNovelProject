const { verifyToken } = require('../utils/jwt');

/**
 * JWT 认证中间件
 * 验证请求中的 JWT Token
 */
function authenticateToken(req, res, next) {
  // 从 Authorization header 获取 token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '缺少认证 Token'
    });
  }
  
  try {
    // 验证 token
    const decoded = verifyToken(token);
    
    // 将解码后的用户信息附加到 req
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message || 'Token 验证失败'
    });
  }
}

/**
 * 可选的 JWT 认证中间件
 * Token 存在时验证，不存在时也允许通过
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token 无效，但不阻止请求
      console.warn('Token 验证失败（可选认证）:', error.message);
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};

