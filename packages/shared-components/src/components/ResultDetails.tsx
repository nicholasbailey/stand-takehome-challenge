import React from 'react';
import { CheckResult } from "@mitigation/shared-models/models/execution-result";
import styles from './ResultDetails.module.css';


interface ResultDetailsProps {
    results: CheckResult[];
  }



interface ResultCheckmarkProps {

    passed: boolean;
}


const formatKey = (key: string): string => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

const contextToDisplayString = (context: Record<string, any>): string => {
    return Object.entries(context)
        .map(([key, value]) => `${formatKey(key)}: ${value}`)
        .join(', ');
}

export const ResultCheckmark: React.FC<ResultCheckmarkProps> = ({ passed }: ResultCheckmarkProps) => {
    return (
        <span className={`${styles.statusIcon} ${
            passed ? styles.statusIconPassed : styles.statusIconFailed
        }`}>
            {passed ? '✓' : '✗'}
        </span>
    )
}


export const MultiResultDetails: React.FC<ResultDetailsProps> = ({ results }: ResultDetailsProps) => {
    return (
        <>
          <div className={styles.resultDetails}>
            {results.map((result, index) => (
              <div key={index} className={styles.resultItem}>
                <ResultCheckmark passed={result.value} />
                <span className={styles.contextInfo}>
                  {contextToDisplayString(result.context)}
                </span>
              </div>
            ))}
          </div>
        </>
    )
}
  
export const ResultDetails: React.FC<ResultDetailsProps> = ({ results }) => {
    if (results.length === 1) {
      // Single result - show pass/fail
      const singleResult = results[0];
      return (
        <ResultCheckmark passed={singleResult.value} />
      );
    } else {
      return <MultiResultDetails results={results} />
    }
  }; 