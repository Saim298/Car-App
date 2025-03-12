import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

const globalErrorHandaller = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || 'Something went wrong';
  let error = err;

  if (error instanceof Prisma.PrismaClientValidationError) {
    (message = 'Validation Error'), (error = err.message);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      message = 'Duplicate Key Error ';
      error = error.meta;
    }
  }

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandaller;