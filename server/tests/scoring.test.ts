import { calculateTrustScore } from '../src/scoring/scorer';
import { IssueType, IssueSeverity, Issue } from '../src/analyzer/types';
import { v4 as uuidv4 } from 'uuid';

describe('Trust Score Calculator', () => {
  const contractAddress = '0x1234567890123456789012345678901234567890';
  
  // Helper function to create test issues
  function createIssue(type: IssueType, severity: IssueSeverity): Issue {
    return {
      id: uuidv4(),
      type,
      severity,
      title: `Test ${type}`,
      description: `Test issue of type ${type} and severity ${severity}`,
      location: { line: 1, column: 1 }
    };
  }
  
  test('should return a perfect score for contracts with no issues', () => {
    const result = calculateTrustScore(contractAddress, []);
    
    expect(result.overallScore).toBe(100);
    expect(result.issues.length).toBe(0);
    expect(result.disclaimer).toBeTruthy();
  });
  
  test('should apply correct deduction for reentrancy issue', () => {
    const issues = [
      createIssue(IssueType.REENTRANCY, IssueSeverity.HIGH)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // 100 - 20 (reentrancy) = 80
    expect(result.overallScore).toBe(80);
    expect(result.issues.length).toBe(1);
  });
  
  test('should apply correct deduction for access control issue', () => {
    const issues = [
      createIssue(IssueType.ACCESS_CONTROL, IssueSeverity.MEDIUM)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // 100 - 15 (access control) = 85
    expect(result.overallScore).toBe(85);
  });
  
  test('should apply correct deduction for gas inefficiency issue', () => {
    const issues = [
      createIssue(IssueType.GAS_INEFFICIENCY, IssueSeverity.LOW)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // 100 - 10 (gas inefficiency) = 90
    expect(result.overallScore).toBe(90);
  });
  
  test('should apply correct deduction for logic error issue', () => {
    const issues = [
      createIssue(IssueType.LOGIC_ERROR, IssueSeverity.MEDIUM)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // 100 - 10 (logic error) = 90
    expect(result.overallScore).toBe(90);
  });
  
  test('should apply correct deductions for multiple issues', () => {
    const issues = [
      createIssue(IssueType.REENTRANCY, IssueSeverity.HIGH),
      createIssue(IssueType.ACCESS_CONTROL, IssueSeverity.MEDIUM),
      createIssue(IssueType.GAS_INEFFICIENCY, IssueSeverity.LOW)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // 100 - 20 (reentrancy) - 15 (access control) - 10 (gas inefficiency) = 55
    expect(result.overallScore).toBe(55);
    expect(result.issues.length).toBe(3);
  });
  
  test('should not go below 0 for many issues', () => {
    const issues = Array(10).fill(null).map(() => 
      createIssue(IssueType.REENTRANCY, IssueSeverity.HIGH)
    );
    
    const result = calculateTrustScore(contractAddress, issues);
    
    // Score would be negative, but should be capped at 0
    expect(result.overallScore).toBe(0);
  });
  
  test('should include a detailed breakdown', () => {
    const issues = [
      createIssue(IssueType.REENTRANCY, IssueSeverity.HIGH),
      createIssue(IssueType.ACCESS_CONTROL, IssueSeverity.MEDIUM)
    ];
    
    const result = calculateTrustScore(contractAddress, issues);
    
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.issuesByType).toBeDefined();
    expect(result.breakdown.issuesByType[IssueType.REENTRANCY]).toBe(1);
    expect(result.breakdown.issuesByType[IssueType.ACCESS_CONTROL]).toBe(1);
    
    expect(result.breakdown.issuesBySeverity).toBeDefined();
    expect(result.breakdown.issuesBySeverity[IssueSeverity.HIGH]).toBe(1);
    expect(result.breakdown.issuesBySeverity[IssueSeverity.MEDIUM]).toBe(1);
    
    expect(result.breakdown.categoryScores).toBeDefined();
  });
});