// test/integration/dashboard.test.js
const { expect } = require('chai');
const axios = require('axios');
const { ethers } = require('hardhat');

// Mock contract data for testing
const TEST_CONTRACT = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Replace with actual test contract
  network: "liskTestnet",
  expectedVulnerabilities: ["reentrancy"]
};

describe("DefyShield Dashboard Integration", function() {
  this.timeout(30000); // Increased timeout for API calls

  let auditContract;
  let owner;

  before(async () => {
    [owner] = await ethers.getSigners();
    
    // Deploy a sample audit contract (mock)
    const AuditContract = await ethers.getContractFactory("DefyShieldAudit");
    auditContract = await AuditContract.deploy();
  });

  it("should successfully submit contract for audit", async () => {
    const response = await axios.post('http://localhost:3000/api/audit', {
      contractAddress: TEST_CONTRACT.address,
      network: TEST_CONTRACT.network,
      userId: owner.address
    });

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('auditId');
  });

  it("should return audit results with trust score", async () => {
    // First submit the audit
    await axios.post('http://localhost:3000/api/audit', {
      contractAddress: TEST_CONTRACT.address,
      network: TEST_CONTRACT.network
    });

    // Then fetch results
    const response = await axios.get(
      `http://localhost:3000/api/audit/${TEST_CONTRACT.address}`
    );

    expect(response.data).to.include.all.keys(
      'score',
      'vulnerabilities',
      'gasReport',
      'disclaimer'
    );
    expect(response.data.score).to.be.a('number');
    expect(response.data.score).to.be.within(0, 100);
  });

  it("should detect known vulnerabilities", async () => {
    const response = await axios.post('http://localhost:3000/api/audit', {
      contractAddress: TEST_CONTRACT.address,
      network: TEST_CONTRACT.network
    });

    TEST_CONTRACT.expectedVulnerabilities.forEach(vuln => {
      expect(response.data.vulnerabilities).to.include(vuln);
    });
  });

  it("should return gas efficiency metrics", async () => {
    const response = await axios.get(
      `http://localhost:3000/api/audit/${TEST_CONTRACT.address}`
    );

    expect(response.data.gasReport).to.include.all.keys(
      'average',
      'max',
      'min',
      'optimizationSuggestions'
    );
  });

  it("should handle Gelato automation webhooks", async () => {
    // Mock Gelato webhook call
    const response = await axios.post(
      'http://localhost:3000/api/gelato/webhook',
      {
        taskId: "test_task_123",
        contractAddress: TEST_CONTRACT.address,
        event: "scheduledAudit"
      }
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('success', true);
  });
});