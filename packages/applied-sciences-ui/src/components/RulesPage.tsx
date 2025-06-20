import React, {useState, useEffect} from 'react';
import { MitigationRuleModel, MitigationType } from '@mitigation/shared/models/mitigation-rule';
import { RuleSetVersion } from '@mitigation/shared/models/rule-set';
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
    rule: string;
    mitigations: string;
    name: string;
    plainTextDescription: string;
}

// I really don't love the design of this component right now. 
// It feels like there's poor separation of concerns. Given a bit more
// time I'd like to refactor the display and edit modes into two separate sub-components
// since they are mostly functionally indpendent.

// The state management also feels a bit messy. The separation of concern between the row
// and the enclosing page feels quite blurry. This would be my first target for a refactor
// post spike.

const RulesTableDisplay: React.FC<RulesTableRowProps> = ({ 
    rule, 
    isPageInEditMode, 
    onDelete, 
    onEdit, 
    onSave, 
    onCancel, 
    editingRuleId 
}) => {
    const transFormRuleModelToEditState = (rule: MitigationRuleModel): RulesRowEditState => {
        return {
            rule: JSON.stringify(rule.check, null, 2),
            mitigations: rule.mitigations.map(m => m.description).join('\n'),
            name: rule.name,
            plainTextDescription: rule.description
        }
    }

    const transformEditStateToRuleModel = (editState: RulesRowEditState): MitigationRuleModel => {
        return {
            name: editState.name,
            check: JSON.parse(editState.rule),
            description: editState.plainTextDescription,
            // TODO: Support adding partial mitigations
            mitigations: editState.mitigations.split('\n').map(m => ({ description: m, type: MitigationType.Full })),
        }
    }

    const [editState, setEditState] = useState<RulesRowEditState>(transFormRuleModelToEditState(rule));
    const isEditing = editingRuleId === rule.id;

    const handleSave = () => {
        // See below aabout the typing hack
        onSave(rule.id as string, transformEditStateToRuleModel(editState));
    };

    const handleCancel = () => {
        setEditState(transFormRuleModelToEditState(rule));
        onCancel(rule.id as string);
    };

    const handleInputChange = (field: keyof RulesRowEditState, value: any) => {
        setEditState(prev => ({
            ...prev,
            [field]: value
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
                    <textarea
                        value={editState.rule}
                        onChange={(e) => handleInputChange('rule', e.target.value)}
                        className={styles.editTextarea}
                    />
                </td>
                <td>
                   <textarea
                        value={editState.mitigations}
                        onChange={(e) => handleInputChange('mitigations', e.target.value)}
                        className={styles.editTextarea}
                   />
                </td>
                <td className={styles.actionsCell}>
                    <button
                        type="button"
                        className={styles.smallActionButton}
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className={styles.smallActionButton}
                        onClick={handleCancel}
                    >
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
            <td>{JSON.stringify(rule.check)}</td>
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
                        // This is an unacceptable typing hack
                        // but the time it would take to set up the right multi
                        // layered model typing with distinct models for 
                        // different contexts is just more than is useful for a prototype
                        onClick={() => onEdit(rule.id as string)}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className={`${styles.smallActionButton} ${styles.delete}`}
                        aria-label={`Delete ${rule.name}`}
                         // This is an unacceptable typing hack
                        // but the time it would take to set up the right multi
                        // layered model typing with distinct models for 
                        // different contexts is just more than is useful for a prototype
                        onClick={() => onDelete(rule.id as string)}
                    >
                        Delete
                    </button>
                </td>
            )}
        </tr>
    );
};

const RulesPage: React.FC = () => {
    const [ruleSet, setRuleSet] = useState<RuleSetVersion | null>(null);
    const [draftRuleSet, setDraftRuleSet] = useState<RuleSetVersion | null>(null);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/rulesets/main')
        .then(response => response.json())
        .then(data => {
            setRuleSet(data);
        });
    }, []);

    const [isInEditMode, setIsInEditMode] = useState(false);


    // These API calls should probably be moved to a module wrapping them 
    const startDraft = async () => {
        await fetch('http://localhost:3001/api/rulesets/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rules: ruleSet?.rules || []
            })
        })
        .then(response => response.json())
        .then(data => {
            setDraftRuleSet(data);
            setIsInEditMode(true);
        });
    }

    const updateDraftRuleSet = async (model: RuleSetVersion) => {
        return await fetch(`http://localhost:3001/api/rulesets/${model.ruleSetId}/versions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rules: model.rules
                })
            }
        )
    }

    const addRule = () => {
        if (!draftRuleSet) return;
        
        const newRule: MitigationRuleModel = {
            // This might be the jankiest bit of jank in the whole dang codebase
            // This is where rule ids are generated! Why you might ask? Because of course
            // when I started on the multi-row edit form, I had a sudden flashback to 
            // dealing with  a similar use case years ago, and remembered that doing multi
            // row editing with a stable identifier is miserable. 

            // This ID should obviously be generated on the backend. 
            // but prototypes are going to prototype. 
            id: crypto.randomUUID(),
            name: "",
            description: "",
            check: {},
            mitigations: []
        };

        const newDraftRuleSet = {
            ...draftRuleSet,
            rules: [...draftRuleSet.rules, newRule]
        };

        setDraftRuleSet(newDraftRuleSet);
        setEditingRuleId(newRule.id as string);
    };

    const deleteRule = (ruleId: string) => {
        if (!draftRuleSet) return;
        const newDraftRuleSet = {
            ...draftRuleSet,
            rules: draftRuleSet.rules.filter(rule => rule.id !== ruleId)
        };
        
        // Save the updated ruleset to the database
        updateDraftRuleSet(newDraftRuleSet)
        .then(response => response.json())
        .then(data => {
            setDraftRuleSet(data);
        });
    };

    const editRule = (ruleId: string) => {
        setEditingRuleId(ruleId);
    };

    const saveRule = (ruleId: string, updatedRule: MitigationRuleModel) => {
        if (!draftRuleSet) return;
        const newDraftRuleSet = {
            ...draftRuleSet,
            rules: draftRuleSet.rules.map(rule => 
                rule.id === ruleId ? { ...updatedRule, id: ruleId } : rule
            )
        }
        updateDraftRuleSet(newDraftRuleSet)
        .then(response => response.json())
        .then(data => {
            setDraftRuleSet(data)
            setEditingRuleId(null);
        })
    };

    const cancelEdit = (ruleId: string) => {
        setEditingRuleId(null);
    };

    const publishChanges = () => {
        fetch(`http://localhost:3001/api/rulesets/${draftRuleSet!.ruleSetId}/publish`, {
            method: 'POST',
        }).then((response) => response.json()).then((data) => {
            setRuleSet(data);
            setDraftRuleSet(null);
            setIsInEditMode(false);
            setEditingRuleId(null);
        })
    }

    const cancel = () => {
        setDraftRuleSet(ruleSet);
        setIsInEditMode(false);
        setEditingRuleId(null);
    }

    const rulesToDisplay = isInEditMode ? (draftRuleSet?.rules || []) : (ruleSet?.rules || []);

    return (
    <div className={styles.container}>
        <h2 className={styles.title}>{isInEditMode ? `Draft Rules - Version: ${draftRuleSet?.ruleSetName}` : "Current Rules"}</h2>
        <table className={styles.rulesTable}>
        <thead>
            <tr>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Rule</th>
            <th scope="col">Mitigations</th>
            <th scope="col" aria-label="Actions" className={styles.actionsHeader}></th>
            </tr>
        </thead>
        <tbody>
            {rulesToDisplay.map((rule) => (
                <RulesTableDisplay 
                    key={rule.id} 
                    rule={rule} 
                    isPageInEditMode={isInEditMode}
                    onDelete={deleteRule}
                    onEdit={editRule}
                    onSave={saveRule}
                    onCancel={cancelEdit}
                    editingRuleId={editingRuleId}
                />
            ))}
        </tbody>
        </table>
        {isInEditMode ? (
            <>
                <div className={styles.buttonContainer}>
                    <button
                        type="button"
                        className={styles.actionButton}
                        onClick={addRule}
                    >
                        Add Rule
                    </button>
                </div>
                <div className={styles.buttonContainer}>
                    <button
                        type="button"
                        className={styles.actionButton}
                        onClick={cancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.actionButton}
                        onClick={publishChanges}
                    >
                        Publish Changes
                    </button>
                </div>
            </>
        ) : (
            <div className={styles.buttonContainer}>
                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={startDraft}
                >
                    Edit Rules
                </button>
            </div>
        )}
    </div>
    );
}

export default RulesPage;