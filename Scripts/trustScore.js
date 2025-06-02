const calculateTrustScore = (auditResults) => {
    const { vulnerabilities, gasEfficiency, testCoverage } = auditResults;
    let score = 100;
  
    // Deduct for vulnerabilities
    if (vulnerabilities.critical) score -= 50;
    if (vulnerabilities.high) score -= 30;
    if (vulnerabilities.medium) score -= 15;
  
    // Adjust for gas efficiency (0-20 points)
    score += gasEfficiency * 0.2;
  
    // Adjust for test coverage (0-10 points)
    score += (testCoverage / 100) * 10;
  
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  
  module.exports = { calculateTrustScore };