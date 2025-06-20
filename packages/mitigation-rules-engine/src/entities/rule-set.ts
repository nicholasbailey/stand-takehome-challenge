import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RuleSetModel } from '@mitigation/shared/models/rule-set';


@Entity('rule_sets')
export class RuleSetEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'text' })
    name: string;

    @Column({ type: 'enum', enum: ['draft', 'published'], default: 'draft' })
    status: 'draft' | 'published';

    @Column({ name: 'rule_data', type: 'jsonb' })
    ruleData: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'effective_date', type: 'date', nullable: true })
    effectiveDate: Date;

    toModel(): RuleSetModel {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            rules: this.ruleData.rules,
            effectiveDate: this.effectiveDate
        }
    }

    static fromModel(model: RuleSetModel): RuleSetEntity {
        const ruleSet = new RuleSetEntity();
        if (model.id) {
            ruleSet.id = model.id;
        }
        ruleSet.name = model.name;
        ruleSet.status = model.status;
        ruleSet.ruleData = {rules: model.rules};
        ruleSet.effectiveDate = model.effectiveDate;
        return ruleSet;
    }
} 