const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Optimization Tests", () => {
  let contract;

  before(async () => {
    const GasTest = await ethers.getContractFactory("GasTestContract");
    contract = await GasTest.deploy();
  });

  it("should optimize gas for critical functions", async () => {
    const tx = await contract.expensiveFunction();
    const receipt = await tx.wait();

    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    expect(receipt.gasUsed).to.be.lessThan(1000000);
  });
});