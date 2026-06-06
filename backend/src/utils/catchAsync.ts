/**
 * Async Error Wrapper Utility
 * Wraps async route handlers to catch errors and pass to error middleware
 */

import { Request, Response, NextFunction } from "express";

export function catchAsync(
  fn: (req: Request | any, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request | any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
