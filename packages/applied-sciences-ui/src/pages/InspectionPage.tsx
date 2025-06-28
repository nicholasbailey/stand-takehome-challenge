import { InspectionForm } from '@mitigation/shared-components';
import React, { useState, useEffect } from 'react';
import { RuleSet } from '@mitigation/shared-models/models/rule-set';
import styles from './InspectionPage.module.css';

const InspectionPage: React.FC = () => {
  const [availableRuleSets, setAvailableRuleSets] = useState<RuleSet[]>([]);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<number | 'main'>('main');

  useEffect(() => {
    fetch('http://localhost:3001/api/rulesets')
      .then(response => response.json())
      .then(data => {
        setAvailableRuleSets(data.ruleSets);
      });
  }, []);

  const handleRuleSetChange = (value: string) => {
    if (value === 'main') {
      setSelectedRuleSetId('main');
    } else {
      const numericId = parseInt(value);
      if (!isNaN(numericId)) {
        setSelectedRuleSetId(numericId);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Test Rules</h1>
      
      <div className={styles.dropdownContainer}>
        <label htmlFor="ruleset-select" className={styles.label}>
          Select Ruleset to Test:
        </label>
        <select 
          id="ruleset-select"
          value={selectedRuleSetId.toString()} 
          onChange={(e) => handleRuleSetChange(e.target.value)}
          className={styles.select}
        >
          {availableRuleSets.map((ruleSet, index) => (
            <option key={ruleSet.id} value={ruleSet.id}>
              {ruleSet.name}
            </option>
          ))}
        </select>
      </div>

      <InspectionForm ruleSetId={selectedRuleSetId} />
    </div>
  );
};

export default InspectionPage; 