import React from 'react';
import { ExecutionResult } from '@mitigation/shared-models/models/execution-result';
import styles from './ExecutionResults.module.css';
import { ResultDetails } from './ResultDetails';

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
              <th className={styles.tableHeaderCell}>Results</th>
              <th className={styles.tableHeaderCell}>Mitigations</th>
            </tr>
          </thead>
          <tbody>
            {results.ruleExecutions.map((execution, index) => {
              const hasFailures = execution.results.some(r => !r.value);
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