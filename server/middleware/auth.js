const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix
      
      if (!token) {
        return res.status(401).json({ message: 'No token, unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Token invalid' });
    }
  };
};

module.exports = authMiddleware;
