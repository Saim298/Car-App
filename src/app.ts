import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import routes from './app/routes';
import globalErrorHandaller from './app/middlewares/globalErrorHandaller';
import httpStatus from 'http-status';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send({
    Message: ' Server is Running ..',
  });
});
app.use('/api', routes);
app.use(globalErrorHandaller);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND !',
    error: {
      path: req.originalUrl,
      message: 'Your Requested Path Not Found !',
    },
  });
});

// marketCheckApi({ type: 'active_listing' }).then((d) =>
//   console.log(JSON.stringify(d.listings[0]))
// );

export default app;
