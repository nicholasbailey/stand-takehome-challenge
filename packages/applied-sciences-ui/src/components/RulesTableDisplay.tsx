import React, { useState } from 'react';
import { MitigationRuleModel, MitigationType } from '@mitigation/shared/models/mitigation-rule';
import styles from './RulesPage.module.css';

interface RulesTableRowProps {
  rule: MitigationRuleModel;
  isPageInEditMode: boolean;
  onDelete: (ruleId: string) => void;
  onEdit: (ruleId: string) => void;
  onSave: (ruleId: string, updatedRule: MitigationRuleModel) => void;
  onCancel: (ruleId: string) => void;
  editingRuleId: string | null;
}

// When editing we work with raw strings which get deserialized on save
// this interface represents that raw string form state.
interface RulesRowEditState {
  ruleCondition: string;
  mitigations: string;
  name: string;
  plainTextDescription: string;
}

const RulesTableDisplay: React.FC<RulesTableRowProps> = ({
  rule,
  isPageInEditMode,
  onDelete,
  onEdit,
  onSave,
  onCancel,
  editingRuleId,
}) => {
  const transFormRuleModelToEditState = (rule: MitigationRuleModel): RulesRowEditState => ({
    ruleCondition: rule.check.condition,
    mitigations: rule.mitigations.map((m) => m.description).join('\n'),
    name: rule.name,
    plainTextDescription: rule.description,
  });

  const transformEditStateToRuleModel = (editState: RulesRowEditState): MitigationRuleModel => ({
    name: editState.name,
    check: {
      type: 'EXPRESSION',
      condition: editState.ruleCondition
    },
    description: editState.plainTextDescription,
    mitigations: editState.mitigations.split('\n').map((m) => ({ description: m, type: MitigationType.Full })),
  });

  const [editState, setEditState] = useState<RulesRowEditState>(transFormRuleModelToEditState(rule));
  const isEditing = editingRuleId === rule.id;

  const handleSave = () => {
    onSave(rule.id as string, transformEditStateToRuleModel(editState));
  };

  const handleCancel = () => {
    setEditState(transFormRuleModelToEditState(rule));
    onCancel(rule.id as string);
  };

  const handleInputChange = (field: keyof RulesRowEditState, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isEditing) {
    return (
      <tr key={rule.id}>
        <td>
          <input
            type="text"
            value={editState.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={styles.editInput}
          />
        </td>
        <td>
          <textarea
            value={editState.plainTextDescription}
            onChange={(e) => handleInputChange('plainTextDescription', e.target.value)}
            className={styles.editTextarea}
          />
        </td>
        <td>
          <div className={styles.ruleEditContainer}>
            <label className={styles.fieldLabel}>Expression:</label>
            <textarea
              value={editState.ruleCondition}
              onChange={(e) => handleInputChange('ruleCondition', e.target.value)}
              className={styles.editTextarea}
              placeholder="Enter expression (e.g., age > 25 && score < 600)"
            />
          </div>
        </td>
        <td>
          <textarea
            value={editState.mitigations}
            onChange={(e) => handleInputChange('mitigations', e.target.value)}
            className={styles.editTextarea}
          />
        </td>
        <td className={styles.actionsCell}>
          <button type="button" className={styles.smallActionButton} onClick={handleSave}>
            Save
          </button>
          <button type="button" className={styles.smallActionButton} onClick={handleCancel}>
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr key={rule.id}>
      <td>{rule.name}</td>
      <td>{rule.description}</td>
      <td>
        <div className={styles.ruleDisplay}>
          <div><strong>Expression:</strong> {rule.check.condition}</div>
        </div>
      </td>
      <td>
        <ul className={styles.mitigationsList}>
          {rule.mitigations.map((m, idx) => (
            <li key={idx}>{m.description}</li>
          ))}
        </ul>
      </td>
      {isPageInEditMode && (
        <td className={styles.actionsCell}>
          <button
            type="button"
            className={styles.smallActionButton}
            aria-label={`Edit ${rule.name}`}
            onClick={() => onEdit(rule.id as string)}
          >
            Edit
          </button>
          <button
            type="button"
            className={`${styles.smallActionButton} ${styles.delete}`}
            aria-label={`Delete ${rule.name}`}
            onClick={() => onDelete(rule.id as string)}
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
};

export default RulesTableDisplay; 