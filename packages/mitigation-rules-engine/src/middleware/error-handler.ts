import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Async wrapper to catch errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

// Global error handling middleware
export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default error values
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Don't send stack trace in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Send error response
  res.status(err.statusCode).json({
    error: {
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      ...(isDevelopment && { stack: err.stack })
    }
  });
};

// Handle uncaught exceptions and unhandled rejections
export const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });
}; 