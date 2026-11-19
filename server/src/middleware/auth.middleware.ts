import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  admin?: {
    authenticated: boolean;
    role: string;
  };
}

export function generateAdminToken(): string {
  // 7 days in seconds
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  return jwt.sign({ authenticated: true, role: 'wedding_organizer' }, config.admin.jwtSecret, {
    expiresIn: sevenDaysInSeconds,
  });
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication token required.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.admin.jwtSecret) as { authenticated: boolean; role: string };
    if (!decoded || !decoded.authenticated) {
      res.status(401).json({ success: false, error: 'Invalid authentication credentials.' });
      return;
    }
    req.admin = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.name === 'TokenExpiredError' ? 'Admin session expired. Please log in again.' : 'Invalid token.',
    });
  }
}
