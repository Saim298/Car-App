import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

const globalErrorHandaller = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || 'Something went wrong';
  let error = err;

  if (error instanceof Prisma.PrismaClientValidationError) {
    message = 'Validation Error';
    error = err.message;
    statusCode = HTTP_STATUS.BAD_REQUEST;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      message = 'Duplicate Key Error';
      error = error.meta;
      statusCode = HTTP_STATUS.CONFLICT;
    }
  }

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandaller;
