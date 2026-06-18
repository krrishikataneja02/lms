import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aegis_lms_jwt_key_2026');

      // Fetch user from DB and attach to request context (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in system.' });
      }
      next();
    } catch (error) {
      console.error('JWT validation error:', error);
      res.status(401).json({ message: 'Not authorized, token validation failed.' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, token missing.' });
  }
};

// Admin gate guard
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: requires Super Admin privileges.' });
  }
};

// Faculty gate guard
export const faculty = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: requires Faculty privileges.' });
  }
};

// Student gate guard
export const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: requires Student privileges.' });
  }
};

// Faculty or Admin gate guard (e.g. for creating/viewing assignments)
export const facultyOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: requires Faculty or Admin privileges.' });
  }
};
