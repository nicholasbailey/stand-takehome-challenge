import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RuleSetVersionEntity } from './rule-set-version';

@Entity('rule_sets')
export class RuleSetEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'text' })
    name: string;

    @Column({ name: 'is_main', type: 'boolean', default: false })
    isMain: boolean;

    @OneToMany(() => RuleSetVersionEntity, ruleSetVersion => ruleSetVersion.ruleSet)
    versions: RuleSetVersionEntity[];
} 