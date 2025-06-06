import { Issue, IssueType, IssueSeverity } from '../analyzer/types';
import { ScoreResult, ScoreBreakdown, ScoreWeights, CategoryWeights } from './types';
import { logger } from '../utils/logger';

/**
 * Default weights for different issue severities
 * PRD Reference: Page 2, 6 (Trust Score Calculator)
 */
const DEFAULT_SEVERITY_WEIGHTS: ScoreWeights = {
  [IssueSeverity.HIGH]: 20,
  [IssueSeverity.MEDIUM]: 15,
  [IssueSeverity.LOW]: 10,
  [IssueSeverity.INFORMATIONAL]: 5
};

/**
 * Default weights for different issue categories
 * PRD Reference: Page 2, 6 (Trust Score Calculator deductions)
 */
const DEFAULT_CATEGORY_WEIGHTS: CategoryWeights = {
  [IssueType.REENTRANCY]: 20,
  [IssueType.ACCESS_CONTROL]: 15,
  [IssueType.GAS_INEFFICIENCY]: 10,
  [IssueType.LOGIC_ERROR]: 10,
  [IssueType.UNCHECKED_RETURN]: 10,
  [IssueType.ARITHMETIC_OVERFLOW]: 15,
  [IssueType.MISSING_INPUT_VALIDATION]: 10,
  [IssueType.UNSAFE_EXTERNAL_CALLS]: 15
};

/**
 * Standard disclaimer for all audit reports
 * PRD Reference: Page 2, 6 (Trust Score Calculator disclaimer)
 */
const AUDIT_DISCLAIMER = "This score reflects automatically detected vulnerabilities. " +
                         "Scores below 80 indicate potential security risks. " +
                         "This automated audit is not a guarantee of security; " +
                         "please consult security experts for critical dApps.";

/**
 * Calculates a trust score based on detected issues
 * PRD Reference: Page 2, 6 (Trust Score Calculator)
 * 
 * @param contractAddress The address of the analyzed contract
 * @param issues Array of detected issues
 * @returns Score result with breakdown and disclaimer
 */
export function calculateTrustScore(contractAddress: string, issues: Issue[]): ScoreResult {
  logger.info(`Calculating trust score for ${contractAddress} with ${issues.length} issues`);
  
  // Start with a perfect score
  let score = 100;
  
  // Initialize breakdown data
  const breakdown: ScoreBreakdown = {
    issuesByType: {},
    issuesBySeverity: {},
    categoryScores: {}
  };
  
  // Count issues by type and severity
  issues.forEach(issue => {
    // Count by type
    if (!breakdown.issuesByType[issue.type]) {
      breakdown.issuesByType[issue.type] = 0;
    }
    breakdown.issuesByType[issue.type]!++;
    
    // Count by severity
    if (!breakdown.issuesBySeverity[issue.severity]) {
      breakdown.issuesBySeverity[issue.severity] = 0;
    }
    breakdown.issuesBySeverity[issue.severity]!++;
  });
  
  // Calculate deductions for each category
  Object.keys(breakdown.issuesByType).forEach(type => {
    const issueType = type as IssueType;
    const count = breakdown.issuesByType[issueType] || 0;
    
    // Apply category weight
    const deduction = Math.min(DEFAULT_CATEGORY_WEIGHTS[issueType] * count, 50);
    breakdown.categoryScores[issueType] = -deduction;
    
    // Apply deduction to total score
    score -= deduction;
  });
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  logger.info(`Trust score for ${contractAddress}: ${score}`);
  
  return {
    contractAddress,
    overallScore: score,
    breakdown,
    issues,
    timestamp: Date.now(),
    disclaimer: AUDIT_DISCLAIMER
  };
}