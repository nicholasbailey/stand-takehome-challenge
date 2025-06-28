import React, {useState, useEffect} from 'react';
import { CheckType, MitigationRuleModel } from '@mitigation/shared-models/models/mitigation-rule';
import { RuleSetVersion } from '@mitigation/shared-models/models/rule-set';
import styles from './RulesForm.module.css';
import EditableRulesTableRow from './EditableRulesTableRow';

// I really don't love the design of this component right now. 
// It feels like there's poor separation of concerns. Given a bit more
// time I'd like to refactor the display and edit modes into two separate sub-components
// since they are mostly functionally indpendent.

// The state management also feels a bit messy. The separation of concern between the row
// and the enclosing page feels quite blurry. This would be my first target for a refactor
// post spike.

const RulesForm: React.FC = () => {
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
            check: {
                type: CheckType.MATHJS_EXPRESSION,
                expression: ""
            },
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
        <h2 className={styles.title}>{isInEditMode ? `Draft Rules: ${draftRuleSet?.ruleSetName}` : "Current Rules"}</h2>
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
                <EditableRulesTableRow 
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
                    Create New Draft Ruleset
                </button>
            </div>
        )}
    </div>
    );
}

export default RulesForm;