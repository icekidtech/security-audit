export enum IssueType {
  REENTRANCY = 'reentrancy',
  ACCESS_CONTROL = 'access_control',
  GAS_INEFFICIENCY = 'gas_inefficiency',
  LOGIC_ERROR = 'logic_error',
  UNCHECKED_RETURN = 'unchecked_return',
  ARITHMETIC_OVERFLOW = 'arithmetic_overflow',
  MISSING_INPUT_VALIDATION = 'missing_input_validation',
  UNSAFE_EXTERNAL_CALLS = 'unsafe_external_calls'
}

export enum IssueSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational'
}

export interface CodeLocation {
  line: number;
  column: number;
  file?: string;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  location?: CodeLocation;
  function?: string;
  codeSnippet?: string;
  recommendation?: string;
}

export interface AnalysisResult {
  contractAddress: string;
  contractName?: string;
  issues: Issue[];
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}