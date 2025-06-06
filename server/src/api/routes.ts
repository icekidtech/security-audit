import { Express, Request, Response } from 'express';
import { validateContractAddress } from './middleware';
import { logger } from '../utils/logger';
import { getContractBytecode, getContractSourceCode } from '../utils/ethers';
import { analyzeContract } from '../analyzer/static';
import { calculateTrustScore } from '../scoring/scorer';
import { analysisCache, scoreCache } from '../utils/cache';

/**
 * Sets up API routes for the Express application
 * PRD Reference: Page 2, 5 (API Endpoint)
 */
export function setupRoutes(app: Express) {
  // Audit endpoint for a specific contract address
  app.get('/api/audit/:address', validateContractAddress, async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      logger.info(`Audit requested for contract: ${address}`);
      
      // Check cache first
      const cachedResult = scoreCache.get(address);
      if (cachedResult) {
        logger.info(`Returning cached result for ${address}`);
        return res.status(200).json(cachedResult);
      }
      
      // Step 1: Fetch contract source code (decompiled or from explorer)
      const sourceCode = await getContractSourceCode(address);
      if (!sourceCode) {
        return res.status(404).json({ 
          error: 'Contract source code not found or could not be decompiled',
          address 
        });
      }
      
      // Step 2: Perform static analysis
      logger.info(`Running static analysis for ${address}`);
      const analysisResult = await analyzeContract(sourceCode, address);
      
      if (!analysisResult.success) {
        return res.status(500).json({ 
          error: analysisResult.errorMessage || 'Static analysis failed',
          address 
        });
      }
      
      // Step 3: Calculate trust score
      logger.info(`Calculating trust score for ${address}`);
      const scoreResult = calculateTrustScore(address, analysisResult.issues);
      
      // Cache the result (TTL: 1 hour)
      scoreCache.set(address, scoreResult, 60 * 60 * 1000);
      
      // Return the combined result
      res.status(200).json({
        contractAddress: address,
        contractName: analysisResult.contractName,
        score: scoreResult.overallScore,
        issues: scoreResult.issues,
        breakdown: scoreResult.breakdown,
        disclaimer: scoreResult.disclaimer,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Error in audit endpoint', error);
      res.status(500).json({ error: 'Internal server error', message: (error as Error).message });
    }
  });

  // Gelato automation endpoint (placeholder for Week 3)
  app.post('/api/gelato/audit', async (req: Request, res: Response) => {
    try {
      logger.info('Gelato automation audit requested');
      
      // This is a placeholder - real implementation in Week 3
      res.status(200).json({
        message: 'Gelato automation endpoint setup successfully',
        status: 'pending implementation'
      });
    } catch (error) {
      logger.error('Error in Gelato endpoint', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}