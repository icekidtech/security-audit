import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to validate Ethereum contract addresses
 */
export function validateContractAddress(req: Request, res: Response, next: NextFunction) {
  const { address } = req.params;
  
  // Basic Ethereum address validation (0x followed by 40 hex characters)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!addressRegex.test(address)) {
    logger.warn(`Invalid address format: ${address}`);
    return res.status(400).json({ error: 'Invalid contract address format' });
  }
  
  next();
}