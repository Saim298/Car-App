import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import routes from './app/routes';
import globalErrorHandaller from './app/middlewares/globalErrorHandaller';
import cors from 'cors';

dotenv.config();

const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send({
    Message: 'Server is Running ..',
  });
});

app.use('/api', routes);
app.use(globalErrorHandaller);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your Requested Path Not Found!',
    },
  });
});

export default app;
