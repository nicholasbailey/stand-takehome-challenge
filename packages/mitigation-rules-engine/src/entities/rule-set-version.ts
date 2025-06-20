import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RuleSetVersion } from '@mitigation/shared/models/rule-set';
import { RuleSetEntity } from './rule-set';

// The 'Entity' naming convention here is a bit unconventional,
// but given the choice between the database entity which doesn't leak out of the 
// persistence layer having a suffix and the domain model we use everywhere having a suffix
// I would gladly have the less used class have a suffix. 
@Entity('rule_set_versions')
export class RuleSetVersionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'rule_data', type: 'jsonb' })
    ruleData: any;

    // This probably could be DB generated if we wanted. Right now just 
    // doing it in app code
    @Column({ name: 'effective_date', type: 'timestamp' })
    effectiveDate: Date;

    @ManyToOne(() => RuleSetEntity, ruleSet => ruleSet.versions)
    @JoinColumn({ name: 'rule_set_id' })
    ruleSet: RuleSetEntity;

    @Column({ name: 'rule_set_id' })
    ruleSetId: number;

    toModel(): RuleSetVersion {
        return {
            id: this.id,
            ruleSetId: this.ruleSetId,
            isMain: this.ruleSet.isMain,
            ruleSetName: this.ruleSet.name,
            rules: this.ruleData.rules,
            effectiveDate: this.effectiveDate
        }
    }

    static fromModel(model: RuleSetVersion): RuleSetVersionEntity {
        const ruleSet = new RuleSetVersionEntity();
        if (model.id) {
            ruleSet.id = model.id;
        }
        if (!model.ruleSetId) {
            throw new Error('Rule set ID is required');
        }
        ruleSet.ruleSetId = model.ruleSetId;
        ruleSet.ruleData = {rules: model.rules};
        ruleSet.effectiveDate = model.effectiveDate;
        return ruleSet;
    }
} 