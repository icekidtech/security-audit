const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy Attack Simulation", () => {
  let vulnerableContract, attackerContract;
  let owner, attacker;

  before(async () => {
    [owner, attacker] = await ethers.getSigners();

    // Deploy vulnerable contract
    const Vulnerable = await ethers.getContractFactory("Vault");
    vulnerableContract = await Vulnerable.deploy();
    await vulnerableContract.deposit({ value: ethers.utils.parseEther("1") });

    // Deploy attacker contract
    const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
    attackerContract = await Attacker.deploy(vulnerableContract.address);
  });

  it("should prevent reentrancy attack", async () => {
    await expect(
      attackerContract.connect(attacker).attack({
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });
});