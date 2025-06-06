import { analyzeContract } from '../src/analyzer/static';
import { IssueType, IssueSeverity } from '../src/analyzer/types';

describe('Static Analysis', () => {
  // Test contract with reentrancy vulnerability
  const reentrancyContract = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract ReentrancyVulnerable {
        mapping(address => uint) public balances;
        
        function withdraw() public {
            uint bal = balances[msg.sender];
            require(bal > 0);
            
            // Vulnerable: external call before state update
            (bool sent, ) = msg.sender.call{value: bal}("");
            require(sent, "Failed to send Ether");
            
            // State update after external call
            balances[msg.sender] = 0;
        }
        
        function deposit() public payable {
            balances[msg.sender] += msg.value;
        }
    }
  `;
  
  // Test contract with access control vulnerability
  const accessControlContract = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract AccessControlVulnerable {
        address public owner;
        uint public fee = 100;
        
        constructor() {
            owner = msg.sender;
        }
        
        // Secure function with access control
        function secureFeeUpdate(uint newFee) public {
            require(msg.sender == owner, "Not owner");
            fee = newFee;
        }
        
        // Vulnerable: No access control
        function vulnerableFeeUpdate(uint newFee) public {
            fee = newFee;
        }
    }
  `;
  
  // Test contract with gas inefficiency
  const gasInefficientContract = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract GasInefficient {
        uint[] public values;
        
        constructor() {
            for (uint i = 0; i < 10; i++) {
                values.push(i);
            }
        }
        
        // Gas inefficient: unbounded loop
        function processAll(address[] memory users) public {
            for (uint i = 0; i < users.length; i++) {
                // Multiple state changes in a loop
                values.push(i);
                values.push(i * 2);
            }
        }
    }
  `;
  
  // Test contract with logic error
  const logicErrorContract = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    
    contract LogicErrorVulnerable {
        uint public threshold = 100;
        
        // Logic error: inconsistent boundary checks
        function processValue(uint value) public {
            if (value > threshold) {
                // Do something
            }
            
            if (value >= threshold) {
                // Do something else that might conflict
            }
        }
        
        // Function missing state updates
        function updateData() public {
            // No state changes but not marked as view/pure
        }
    }
  `;
  
  test('should detect reentrancy vulnerability', async () => {
    const result = await analyzeContract(reentrancyContract, '0x1234567890123456789012345678901234567890');
    
    expect(result.success).toBe(true);
    
    // Check if reentrancy issue was detected
    const reentrancyIssues = result.issues.filter(issue => issue.type === IssueType.REENTRANCY);
    expect(reentrancyIssues.length).toBeGreaterThan(0);
    expect(reentrancyIssues[0].severity).toBe(IssueSeverity.HIGH);
  });
  
  test('should detect access control vulnerability', async () => {
    const result = await analyzeContract(accessControlContract, '0x1234567890123456789012345678901234567890');
    
    expect(result.success).toBe(true);
    
    // Check if access control issue was detected
    const accessControlIssues = result.issues.filter(issue => issue.type === IssueType.ACCESS_CONTROL);
    expect(accessControlIssues.length).toBeGreaterThan(0);
    expect(accessControlIssues[0].severity).toBe(IssueSeverity.MEDIUM);
  });
  
  test('should detect gas inefficiency', async () => {
    const result = await analyzeContract(gasInefficientContract, '0x1234567890123456789012345678901234567890');
    
    expect(result.success).toBe(true);
    
    // Check if gas inefficiency issues were detected
    const gasIssues = result.issues.filter(issue => issue.type === IssueType.GAS_INEFFICIENCY);
    expect(gasIssues.length).toBeGreaterThan(0);
  });
  
  test('should detect logic errors', async () => {
    const result = await analyzeContract(logicErrorContract, '0x1234567890123456789012345678901234567890');
    
    expect(result.success).toBe(true);
    
    // Check if logic error issues were detected
    const logicIssues = result.issues.filter(issue => issue.type === IssueType.LOGIC_ERROR);
    expect(logicIssues.length).toBeGreaterThan(0);
  });
  
  test('should handle invalid Solidity code', async () => {
    const invalidCode = `
      // Invalid Solidity code
      contract Broken {
        function broken {
          // Missing parentheses
        }
      }
    `;
    
    const result = await analyzeContract(invalidCode, '0x1234567890123456789012345678901234567890');
    
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });
});