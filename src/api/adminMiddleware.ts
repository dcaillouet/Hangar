import express from 'express';
import logger from '../logger';

const adminSecret = process.env.ADMIN_SECRET;
export const adminMiddleware = express.Router();

adminMiddleware.use((req, res, next) => {
  if (req.headers.authorization !== adminSecret) {
    res.sendStatus(401);
    logger.error(
      `Unauthorized request has been made to ${req.originalUrl} from ${req.ip} with authorization: ${
        req.headers.authorization
      }. Request Body: ${JSON.stringify(req.body, null, 2)}`,
    );
    return;
  }

  next();
});
