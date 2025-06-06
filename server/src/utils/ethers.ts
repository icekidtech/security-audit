import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

// Initialize provider for Lisk L2 Testnet
const LISK_L2_RPC_URL = process.env.LISK_L2_RPC_URL || 'https://documentation.lisk.com/docs/lisk-l2-testnet';

let provider: ethers.JsonRpcProvider;

/**
 * Get or initialize the Ethers provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    try {
      provider = new ethers.JsonRpcProvider(LISK_L2_RPC_URL);
      logger.info('Ethers provider initialized for Lisk L2 Testnet');
    } catch (error) {
      logger.error('Failed to initialize Ethers provider', error);
      throw new Error('Failed to initialize Ethers provider');
    }
  }
  return provider;
}

/**
 * Get contract bytecode from Lisk L2 Testnet
 */
export async function getContractBytecode(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const bytecode = await provider.getCode(address);
    
    if (bytecode === '0x') {
      throw new Error(`No contract found at address ${address}`);
    }
    
    return bytecode;
  } catch (error) {
    logger.error(`Failed to get bytecode for ${address}`, error);
    throw error;
  }
}

/**
 * Get contract ABI (if verified) from Lisk L2 Testnet explorer
 * Note: This would need to be implemented based on Lisk's specific explorer API
 */
export async function getContractABI(address: string): Promise<string | null> {
  // This is a placeholder. In reality, you would call the block explorer API
  // to get the ABI if the contract is verified
  logger.info(`Attempting to get ABI for ${address}`);
  return null;
}