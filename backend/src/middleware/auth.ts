import { Request, Response, NextFunction } from 'express';

/**
 * Simple middleware to check for user ID in headers
 * This is a placeholder for proper authentication which should be implemented
 * using Supabase Auth or another authentication system
 */

// TODO - Implement Supabase Auth

export const requireUserId = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['user-id'];

    if (!userId) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please provide a user-id in the request headers'
        });
    }

    next();
};