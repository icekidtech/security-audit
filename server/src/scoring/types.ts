import { Issue, IssueType, IssueSeverity } from '../analyzer/types';

export interface ScoreWeights {
  [IssueSeverity.HIGH]: number;
  [IssueSeverity.MEDIUM]: number;
  [IssueSeverity.LOW]: number;
  [IssueSeverity.INFORMATIONAL]: number;
}

export interface CategoryWeights {
  [IssueType.REENTRANCY]: number;
  [IssueType.ACCESS_CONTROL]: number;
  [IssueType.GAS_INEFFICIENCY]: number;
  [IssueType.LOGIC_ERROR]: number;
  [IssueType.UNCHECKED_RETURN]: number;
  [IssueType.ARITHMETIC_OVERFLOW]: number;
  [IssueType.MISSING_INPUT_VALIDATION]: number;
  [IssueType.UNSAFE_EXTERNAL_CALLS]: number;
}

export interface ScoreBreakdown {
  issuesByType: {
    [key in IssueType]?: number;
  };
  issuesBySeverity: {
    [key in IssueSeverity]?: number;
  };
  categoryScores: {
    [key in IssueType]?: number;
  };
}

export interface ScoreResult {
  contractAddress: string;
  overallScore: number; // 0-100, higher is better
  breakdown: ScoreBreakdown;
  issues: Issue[];
  timestamp: number;
}