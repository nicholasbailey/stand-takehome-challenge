import React, { useState } from 'react';
import axios from 'axios';
import { EvaluationRequest, Inspection, RoofType, WindowType, WildFireRiskCategory, VegetationType, VegetationDescription } from '@mitigation/shared-models/models/inspection';
import { ExecutionResult } from '@mitigation/shared-models/models/execution-result';
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

const vegetationTypeLabels: Record<VegetationType, string> = {
  [VegetationType.Tree]: 'Tree',
  [VegetationType.Shrub]: 'Shrub',
  [VegetationType.Grass]: 'Grass',
};

interface InspectionFormProps {
  ruleSetId: number | 'main';
}

const InspectionForm: React.FC<InspectionFormProps> = ({ruleSetId}) => {
  const [formData, setFormData] = useState<Inspection>({
    atticVentHasScreens: false,
    roofType: RoofType.ClassA,
    widownType: WindowType.SinglePane,
    wildFireRiskCategory: WildFireRiskCategory.A,
    vegetation: []
  });

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
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleVegetationChange = (index: number, field: keyof VegetationDescription, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      vegetation: prev.vegetation?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const addVegetation = () => {
    setFormData(prev => ({
      ...prev,
      vegetation: [
        ...(prev.vegetation || []),
        { type: VegetationType.Tree, distanceToWindowInFeet: 0 }
      ]
    }));
  };

  const removeVegetation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vegetation: prev.vegetation?.filter((_, i) => i !== index) || []
    }));
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

      const response = await axios.post(`http://localhost:3001/api/rulesets/${ruleSetId}/evaluate`, inspectionData);
      setResults(response.data);
    } catch (err) {
      setError('Failed to execute ruleset');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (

      <div className={styles.formBody}>
        <form onSubmit={handleSubmit}>
          {/* Evaluation options */}
          <div className={styles.field}>
            <label htmlFor="asOfDateTime" className={styles.label}>Evaluate As-Of (optional)</label>
            <input
              name="asOfDateTime"
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
                name="atticVentHasScreens"
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

          <h3 className={styles.sectionTitle}>Vegetation</h3>
          
          <div className={styles.vegetationSection}>
            {formData.vegetation?.map((vegetation, index) => (
              <div key={index} className={styles.vegetationItem}>
                <div className={styles.vegetationFields}>
                  <div className={styles.field}>
                    <label className={styles.label}>Type</label>
                    <select
                      value={vegetation.type}
                      onChange={(e) => handleVegetationChange(index, 'type', e.target.value as VegetationType)}
                      className={styles.select}
                    >
                      {Object.values(VegetationType).map(type => (
                        <option key={type} value={type}>{vegetationTypeLabels[type]}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Distance to Window (feet)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={vegetation.distanceToWindowInFeet}
                      onChange={(e) => handleVegetationChange(index, 'distanceToWindowInFeet', parseFloat(e.target.value) || 0)}
                      className={styles.input}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeVegetation(index)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addVegetation}
              className={styles.addButton}
            >
              Add Vegetation
            </button>
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
  );
};

export default InspectionForm; 