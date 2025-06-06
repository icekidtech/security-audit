import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { setupRoutes } from './api/routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'DefyShield Security Audit API' });
});

// Setup API routes
setupRoutes(app);

// Start server
app.listen(PORT, () => {
  logger.info(`DefyShield Security Audit API running on port ${PORT}`);
});

export default app;