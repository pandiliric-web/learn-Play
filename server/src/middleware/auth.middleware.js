import { ACCESS_TOKEN_NAME, verifyUserToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_NAME];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = verifyUserToken(token);
    req.user = payload;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
