export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Allow both 'admin' and 'teacher' roles (teachers are admins in this system)
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Admin or teacher access required' });
  }
  
  next();
}
