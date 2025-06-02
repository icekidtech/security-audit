const { GelatoRelay } = require("@gelatonetwork/relay-sdk");
const { ethers } = require("ethers");

const scheduleAudit = async (contractAddress) => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.LISK_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const auditContract = new ethers.Contract(
    process.env.AUDIT_CONTRACT_ADDRESS,
    ["function runAudit(address) external returns (uint256 score)"],
    signer
  );

  const relay = new GelatoRelay();
  const { data } = await auditContract.populateTransaction.runAudit(contractAddress);

  const request = {
    chainId: 1234, // Lisk L2 Testnet
    target: auditContract.address,
    data: data,
    feeToken: "0x...", // LSK token address
  };

  const taskId = await relay.sponsoredCall(request, process.env.GELATO_API_KEY);
  console.log(`Scheduled audit: Task ID ${taskId}`);
};

// Example: Audit a DeFi contract weekly
scheduleAudit("0x123...DEFI_CONTRACT");