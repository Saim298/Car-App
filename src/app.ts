import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import routes from './app/routes';
import globalErrorHandaller from './app/middlewares/globalErrorHandaller';
import cors from 'cors';
import path from 'path';
import QRCode from 'qrcode';

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

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../app/uploads')));

app.get('/', (req: Request, res: Response) => {
  res.send({
    Message: 'Server is Running ..',
  });
});

app.use('/api', routes);
app.use(globalErrorHandaller);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../app/uploads')));

// QR Code API
app.get('/api/qrcode', async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Filename is required and must be a string',
    });
    return;
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

  try {
    const qrCode = await QRCode.toDataURL(fileUrl);
    res.status(HTTP_STATUS.OK).json({ success: true, qrCode, fileUrl });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error generating QR code',
    });
  }
});



// Handle not found routes
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
