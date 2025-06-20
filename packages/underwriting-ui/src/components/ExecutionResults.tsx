import React from 'react';
import { ExecutionResult } from '@mitigation/shared/models/execution-result';
import styles from './ExecutionResults.module.css';

interface ExecutionResultsProps {
  results: ExecutionResult;
}

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
              <th className={styles.tableHeaderCell}>Mitigations</th>
            </tr>
          </thead>
          <tbody>
            {results.ruleExecutions.map((execution, index) => {
              const rowClass = `${styles.tableRow} ${
                execution.passed ? styles.tableRowPassed : styles.tableRowFailed
              }`;
              
              return (
                <tr key={index} className={rowClass}>
                  <td className={styles.tableCell}>
                    <div className={styles.ruleNameWithIcon}>
                      <span className={`${styles.statusIcon} ${
                        execution.passed ? styles.statusIconPassed : styles.statusIconFailed
                      }`}>
                        {execution.passed ? '✓' : '✗'}
                      </span>
                      <span>{execution.rule.name}</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>{execution.rule.description}</td>
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