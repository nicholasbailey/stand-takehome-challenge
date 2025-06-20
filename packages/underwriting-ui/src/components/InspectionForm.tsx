import React, { useState } from 'react';
import axios from 'axios';
import { EvaluationRequest, Inspection, RoofType, WindowType, WildFireRiskCategory, VegetationType, VegetationDescription } from '@mitigation/shared/models/inspection';
import { ExecutionResult } from '@mitigation/shared/models/execution-result';
import ExecutionResults from './ExecutionResults';
import styles from './InspectionForm.module.css';

// Hard-coded labels for enum values
const roofTypeLabels: Record<RoofType, string> = {
  [RoofType.ClassA]: 'Class A',
  [RoofType.ClassB]: 'Class B',
  [RoofType.ClassC]: 'Class C',
};

const windowTypeLabels: Record<WindowType, string> = {
  [WindowType.SinglePane]: 'Single Pane',
  [WindowType.DoublePane]: 'Double Pane',
  [WindowType.TemperedGlass]: 'Tempered Glass',
};

const wildFireRiskCategoryLabels: Record<WildFireRiskCategory, string> = {
  [WildFireRiskCategory.A]: 'A',
  [WildFireRiskCategory.B]: 'B',
  [WildFireRiskCategory.C]: 'C',
  [WildFireRiskCategory.D]: 'D',
};

const InspectionForm: React.FC = () => {
  const [formData, setFormData] = useState<Inspection>({});

  const [results, setResults] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('observations.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
      const inspectionData: EvaluationRequest = {
        observations: formData,
      };

      if (asOf) {
        inspectionData.asOf = new Date(asOf);
      }

      const response = await axios.post('http://localhost:3001/api/rulesets/main/evaluate', inspectionData);
      setResults(response.data);
    } catch (err) {
      setError('Failed to execute ruleset');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Stand Insurance Mitigation Tool</h1>
      </div>
      <div className={styles.formBody}>
        <form onSubmit={handleSubmit}>
          {/* Evaluation options */}
          <div className={styles.field}>
            <label htmlFor="asOfDateTime" className={styles.label}>Evaluate As-Of (optional)</label>
            <input
              id="asOfDateTime"
              type="datetime-local"
              value={asOf}
              onChange={e => setAsOf(e.target.value)}
              className={styles.input}
            />
          </div>

          <h3 className={styles.sectionTitle}>Inspection Information</h3>

          <div className={styles.field}>
            <label htmlFor="atticVentCB" className={styles.checkboxLabel}>
              <input
                id="atticVentCB"
                type="checkbox"
                name="observations.atticVentHasScreens"
                checked={formData.atticVentHasScreens || false}
                onChange={handleInputChange}
                className={styles.checkboxInput}
              />
              Attic Vent Has Screens
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor="roofType" className={styles.label}>
              Roof Type
            </label>
            <select
              id="roofType"
              name="observations.roofType"
              value={formData.roofType || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Select Roof Type</option>
              {Object.values(RoofType).map(type => (
                <option key={type} value={type}>{roofTypeLabels[type]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="windowType" className={styles.label}>
              Window Type
            </label>
            <select
              id="windowType"
              name="observations.widownType"
              value={formData.widownType || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Select Window Type</option>
              {Object.values(WindowType).map(type => (
                <option key={type} value={type}>{windowTypeLabels[type]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="riskCategory" className={styles.label}>
              Wildfire Risk Category
            </label>
            <select
              id="riskCategory"
              name="observations.wildFireRiskCategory"
              value={formData.wildFireRiskCategory || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Select Risk Category</option>
              {Object.values(WildFireRiskCategory).map(category => (
                <option key={category} value={category}>{wildFireRiskCategoryLabels[category]}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {'Execute'}
          </button>
        </form>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {results && <ExecutionResults results={results} />}
      </div>
    </div>
  );
};

export default InspectionForm; 