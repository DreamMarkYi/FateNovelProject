const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据
 * @returns {string} JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的数据
 * @throws {Error} Token 无效或过期
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token 已过期');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token 无效');
    }
    throw error;
  }
}

/**
 * 解码 Token（不验证签名）
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的数据
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};

