import React, { useState } from 'react';
import axios from 'axios';
import { InspectionModel, ObservationsModel, RoofType, WindowType, WildFireRiskCategory, VegetationType, VegetationDescription } from '@mitigation/shared/models/inspection';
import { ExecutionResult } from '@mitigation/shared/models/execution-result';
import ExecutionResults from './ExecutionResults';
import styles from './InspectionForm.module.css';

const InspectionForm: React.FC = () => {
  const [formData, setFormData] = useState<InspectionModel>({
    observations: {},
    inputByUserId: ''
  });

  const [results, setResults] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('observations.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        observations: {
          ...prev.observations,
          [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/rulesets/current/evaluate', formData);
      setResults(response.data);
    } catch (err) {
      setError('Failed to execute ruleset');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Property Inspection</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            User ID
          </label>
          <input
            type="text"
            name="inputByUserId"
            value={formData.inputByUserId}
            onChange={handleInputChange}
            className={styles.input}
            required
          />
        </div>

        <h3 className={styles.sectionTitle}>Observations</h3>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="observations.atticVentHasScreens"
              checked={formData.observations.atticVentHasScreens || false}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
            Attic Vent Has Screens
          </label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Roof Type
          </label>
          <select
            name="observations.roofType"
            value={formData.observations.roofType || ''}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="">Select Roof Type</option>
            {Object.values(RoofType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Window Type
          </label>
          <select
            name="observations.widownType"
            value={formData.observations.widownType || ''}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="">Select Window Type</option>
            {Object.values(WindowType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Wildfire Risk Category
          </label>
          <select
            name="observations.wildFireRiskCategory"
            value={formData.observations.wildFireRiskCategory || ''}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="">Select Risk Category</option>
            {Object.values(WildFireRiskCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Executing...' : 'Execute Ruleset'}
        </button>
      </form>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {results && <ExecutionResults results={results} />}
    </div>
  );
};

export default InspectionForm; 