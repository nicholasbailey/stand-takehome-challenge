import React from 'react';
import { ExecutionResult } from '@mitigation/shared/models/execution-result';
import styles from './ExecutionResults.module.css';

interface ExecutionResultsProps {
  results: ExecutionResult;
}

interface ResultDetailsProps {
  results: Array<{ contextItem: any; result: boolean }>;
}

const ResultDetails: React.FC<ResultDetailsProps> = ({ results }) => {
  const formatContextItem = (contextItem: any): string => {
    // Handle null/undefined
    if (!contextItem) return 'N/A';
    
    // Handle primitives
    if (typeof contextItem !== 'object') return String(contextItem);
    
    // Handle arrays
    if (Array.isArray(contextItem)) return `[${contextItem.length} items]`;
    
    const entries = Object.entries(contextItem);
    if (entries.length === 0) return '{}';
    
    // Helper function to convert camelCase to readable format
    const formatKey = (key: string): string => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };
    
    return entries
      .map(([key, value]) => `${formatKey(key)}: ${value}`)
      .join(', ');
  };

  if (results.length === 1) {
    // Single result - show pass/fail
    const singleResult = results[0];
    return (
      <span className={`${styles.statusIcon} ${
        singleResult.result ? styles.statusIconPassed : styles.statusIconFailed
      }`}>
        {singleResult.result ? '✓' : '✗'}
      </span>
    );
  } else {
    // Multiple results - show summary and details
    const passCount = results.filter(r => r.result).length;
    const totalCount = results.length;
    
    return (
      <div>
        <div className={styles.resultSummary}>
          {passCount}/{totalCount} passed
        </div>
        <div className={styles.resultDetails}>
          {results.map((result, index) => (
            <div key={index} className={styles.resultItem}>
              <span className={`${styles.statusIcon} ${
                result.result ? styles.statusIconPassed : styles.statusIconFailed
              }`}>
                {result.result ? '✓' : '✗'}
              </span>
              <span className={styles.contextInfo}>
                {formatContextItem(result.contextItem)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

const ExecutionResults: React.FC<ExecutionResultsProps> = ({ results }) => {
  return (
    <div className={styles.resultsContainer}>
      <h2 className={styles.resultsTitle}>Execution Results</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Rule Name</th>
              <th className={styles.tableHeaderCell}>Description</th>
              <th className={styles.tableHeaderCell}>Results</th>
              <th className={styles.tableHeaderCell}>Mitigations</th>
            </tr>
          </thead>
          <tbody>
            {results.ruleExecutions.map((execution, index) => {
              const hasFailures = execution.results.some(r => !r.result);
              const rowClass = `${styles.tableRow} ${
                hasFailures ? styles.tableRowFailed : styles.tableRowPassed
              }`;
              
              return (
                <tr key={index} className={rowClass}>
                  <td className={styles.tableCell}>
                    <div className={styles.ruleNameWithIcon}>
                      <span>{execution.rule.name}</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>{execution.rule.description}</td>
                  <td className={styles.tableCell}>
                    <ResultDetails results={execution.results} />
                  </td>
                  <td className={styles.tableCell}>
                    {execution.mitigations.length > 0 ? (
                      <ul className={styles.mitigationList}>
                        {execution.mitigations.map((mitigation, mIndex) => (
                          <li key={mIndex}>{mitigation.description}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.noMitigations}>No mitigations</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExecutionResults; 