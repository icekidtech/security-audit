import * as parser from '@solidity-parser/parser';
import { Issue, IssueType, IssueSeverity, AnalysisResult, CodeLocation } from './types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyzes Solidity contract source code for vulnerabilities.
 * PRD Reference: Page 2, 5 (Static Analysis Module)
 * 
 * @param source Solidity contract source code
 * @param contractAddress Contract address on Lisk L2
 * @returns Analysis result with detected issues
 */
export async function analyzeContract(source: string, contractAddress: string): Promise<AnalysisResult> {
  const issues: Issue[] = [];
  let contractName = "Unknown";
  
  try {
    // Parse the Solidity code into an AST
    const ast = parser.parse(source, { loc: true });
    
    // Extract contract name if available
    parser.visit(ast, {
      ContractDefinition: (node) => {
        if (node.name) {
          contractName = node.name;
        }
      }
    });
    
    // Run vulnerability detection functions
    const reentrancyIssues = detectReentrancy(ast);
    const accessControlIssues = detectAccessControlFlaws(ast);
    const gasIssues = detectGasInefficiencies(ast);
    const logicIssues = detectLogicErrors(ast);
    
    // Combine all issues
    issues.push(...reentrancyIssues, ...accessControlIssues, ...gasIssues, ...logicIssues);
    
    logger.info(`Analysis completed for ${contractAddress}: ${issues.length} issues found`);
    
    return {
      contractAddress,
      contractName,
      issues,
      timestamp: Date.now(),
      success: true
    };
  } catch (error) {
    logger.error(`Error analyzing contract ${contractAddress}:`, error);
    return {
      contractAddress,
      issues: [],
      timestamp: Date.now(),
      success: false,
      errorMessage: `Failed to analyze contract: ${(error as Error).message}`
    };
  }
}

// Define a type for the AST returned by the parser
type SolidityAST = ReturnType<typeof parser.parse>;

/**
 * Detects reentrancy vulnerabilities by finding external calls before state changes.
 * SWC-107: https://swcregistry.io/docs/SWC-107
 * PRD Reference: Page 5 (Reentrancy detection)
 */
function detectReentrancy(ast: SolidityAST): Issue[] {
  const issues: Issue[] = [];
  const externalCalls: Map<string, CodeLocation> = new Map();
  const stateChanges: Map<string, CodeLocation> = new Map();
  
  // First pass: identify external calls and state changes
  parser.visit(ast, {
    FunctionDefinition: (node) => {
      const functionName = node.name || 'anonymous';
      
      // Track function body for external calls and state changes
      parser.visit(node, {
        FunctionCall: (callNode) => {
          if (callNode.expression && 'memberName' in callNode.expression) {
            const memberName = callNode.expression.memberName;
            
            // Check for external calls (.call, .send, .transfer)
            if (['call', 'send', 'transfer'].includes(memberName)) {
              externalCalls.set(functionName, callNode.loc!.start);
            }
          }
        },
        
        // Use the correct node type for assignment expressions in Solidity
        Assignment: (assignNode) => {
          // Track state changes (assignments)
          if (assignNode.loc) {
            stateChanges.set(functionName, assignNode.loc.start);
          }
        }
      });
    }
  });
  
  // Identify functions with external calls before state changes
  for (const [functionName, callLoc] of externalCalls.entries()) {
    if (stateChanges.has(functionName)) {
      const changeLoc = stateChanges.get(functionName)!;
      
      // Check if the call happens before the state change (by line number)
      if (callLoc.line < changeLoc.line) {
        issues.push({
          id: uuidv4(),
          type: IssueType.REENTRANCY,
          severity: IssueSeverity.HIGH,
          title: "Reentrancy Vulnerability",
          description: `Function '${functionName}' contains an external call before a state change, which can lead to reentrancy attacks.`,
          location: {
            line: callLoc.line,
            column: callLoc.column
          },
          function: functionName,
          recommendation: "Implement the checks-effects-interactions pattern by moving state changes before external calls, or use a reentrancy guard."
        });
      }
    }
  }
  
  return issues;
}

/**
 * Detects access control flaws by finding public functions without access controls.
 * SWC-105: https://swcregistry.io/docs/SWC-105
 * PRD Reference: Page 5 (Access Control Flaws detection)
 */
function detectAccessControlFlaws(ast: SolidityAST): Issue[] {
  const issues: Issue[] = [];
  
  parser.visit(ast, {
    FunctionDefinition: (node) => {
      // Skip constructor, view, and pure functions
      if (node.isConstructor || node.stateMutability === 'view' || node.stateMutability === 'pure') {
        return;
      }
      
      // Check for public or external functions that might need access control
      if ((node.visibility === 'public' || node.visibility === 'external') && node.body) {
        let hasAccessControl = false;
        
        // Look for access control patterns
        parser.visit(node.body, {
          IfStatement: () => {
            hasAccessControl = true;
          },
          FunctionCall: (callNode) => {
            if (callNode.expression && 'memberName' in callNode.expression) {
              // Check for common modifiers or access control functions
              const memberName = callNode.expression.memberName;
              if (['require', 'onlyOwner', 'isAdmin', 'onlyRole'].includes(memberName)) {
                hasAccessControl = true;
              }
            }
          }
        });
        
        // If no access control is found, flag it
        if (!hasAccessControl && node.name) {
          issues.push({
            id: uuidv4(),
            type: IssueType.ACCESS_CONTROL,
            severity: IssueSeverity.MEDIUM,
            title: "Missing Access Control",
            description: `Function '${node.name}' is ${node.visibility} but lacks access control checks.`,
            location: node.loc ? {
              line: node.loc.start.line,
              column: node.loc.start.column
            } : undefined,
            function: node.name,
            recommendation: "Add access control checks (require statements, modifiers like onlyOwner) to restrict who can call this function."
          });
        }
      }
    }
  });
  
  return issues;
}

/**
 * Detects gas inefficiencies by finding unbounded loops or excessive state changes.
 * SWC-128: https://swcregistry.io/docs/SWC-128
 * PRD Reference: Page 5 (Gas Inefficiencies detection)
 */
function detectGasInefficiencies(ast: SolidityAST): Issue[] {
  const issues: Issue[] = [];
  
  parser.visit(ast, {
    ForStatement: (node) => {
      let hasDynamicBound = false;
      let hasMultipleAssignments = false;
      let assignmentCount = 0;
      
      // Check if loop condition uses a dynamic bound (like array.length)
      if (node.conditionExpression && 'memberName' in node.conditionExpression) {
        if (node.conditionExpression.memberName === 'length') {
          hasDynamicBound = true;
        }
      }
      
      // Check for multiple state changes within the loop
      parser.visit(node.body, {
        AssignmentExpression: () => {
          assignmentCount++;
          if (assignmentCount > 1) {
            hasMultipleAssignments = true;
          }
        }
      });
      
      if (hasDynamicBound) {
        issues.push({
          id: uuidv4(),
          type: IssueType.GAS_INEFFICIENCY,
          severity: IssueSeverity.LOW,
          title: "Unbounded Loop",
          description: "Loop uses a dynamic bound (like array.length) which can lead to gas limit issues with large arrays.",
          location: node.loc ? {
            line: node.loc.start.line,
            column: node.loc.start.column
          } : undefined,
          recommendation: "Cache the array length outside the loop or implement pagination for large data sets."
        });
      }
      
      if (hasMultipleAssignments) {
        issues.push({
          id: uuidv4(),
          type: IssueType.GAS_INEFFICIENCY,
          severity: IssueSeverity.LOW,
          title: "Multiple State Changes in Loop",
          description: "Multiple state changes in a loop can be gas inefficient.",
          location: node.loc ? {
            line: node.loc.start.line,
            column: node.loc.start.column
          } : undefined,
          recommendation: "Batch operations or restructure the code to minimize state changes inside loops."
        });
      }
    }
  });
  
  return issues;
}

/**
 * Detects logic errors such as inconsistent conditions or missing state updates.
 * SWC-104: https://swcregistry.io/docs/SWC-104
 * PRD Reference: Page 5 (Logic Errors detection)
 */
function detectLogicErrors(ast: SolidityAST): Issue[] {
  const issues: Issue[] = [];
  const conditionPatterns: Map<string, Set<string>> = new Map();
  
  // Collect condition patterns in the contract
  parser.visit(ast, {
    IfStatement: (node) => {
      if (node.condition && 'left' in node.condition && 'right' in node.condition && 'operator' in node.condition) {
        const leftStr = JSON.stringify(node.condition.left);
        const rightStr = JSON.stringify(node.condition.right);
        const operator = node.condition.operator;
        
        // Store patterns of variable comparisons
        if (!conditionPatterns.has(leftStr)) {
          conditionPatterns.set(leftStr, new Set());
        }
        conditionPatterns.get(leftStr)!.add(operator);
      }
    }
  });
  
  // Check for inconsistent conditions
  for (const [variable, operators] of conditionPatterns.entries()) {
    // If the same variable is compared with different boundary operators, it might be a logic error
    if (operators.size > 1) {
      const boundaryOperators = new Set(['<', '<=', '>', '>=']);
      const usedBoundaryOps = Array.from(operators).filter(op => boundaryOperators.has(op));
      
      if (usedBoundaryOps.length > 1) {
        issues.push({
          id: uuidv4(),
          type: IssueType.LOGIC_ERROR,
          severity: IssueSeverity.MEDIUM,
          title: "Inconsistent Comparison Operators",
          description: `Variable is compared with inconsistent boundary operators: ${usedBoundaryOps.join(', ')}. This may indicate a logic error.`,
          recommendation: "Review the conditions to ensure consistent boundary checks."
        });
      }
    }
  }
  
  // Check for functions that might be missing state updates
  parser.visit(ast, {
    FunctionDefinition: (node) => {
      if (node.stateMutability !== 'view' && node.stateMutability !== 'pure' && !node.isConstructor) {
        let hasStateChange = false;
        
        parser.visit(node.body, {
          AssignmentExpression: () => {
            hasStateChange = true;
          },
          FunctionCall: (callNode) => {
            if (callNode.expression && 'memberName' in callNode.expression) {
              // Check for functions that typically modify state
              const memberName = callNode.expression.memberName;
              if (['push', 'pop', 'transfer', 'send', 'mint', 'burn'].includes(memberName)) {
                hasStateChange = true;
              }
            }
          }
        });
        
        // If the function doesn't update state, but isn't marked as view/pure, flag it
        if (!hasStateChange && node.name && node.visibility !== 'private' && node.visibility !== 'internal') {
          issues.push({
            id: uuidv4(),
            type: IssueType.LOGIC_ERROR,
            severity: IssueSeverity.LOW,
            title: "Function Might Miss State Updates",
            description: `Function '${node.name}' doesn't appear to update state but isn't marked as view or pure.`,
            location: node.loc ? {
              line: node.loc.start.line,
              column: node.loc.start.column
            } : undefined,
            function: node.name,
            recommendation: "Either add missing state updates or mark the function as view/pure if it only reads state."
          });
        }
      }
    }
  });
  
  return issues;
}