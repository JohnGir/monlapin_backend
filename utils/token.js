const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      iat: Date.now() 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide');
  }
};

module.exports = {
  generateToken,
  verifyToken
};