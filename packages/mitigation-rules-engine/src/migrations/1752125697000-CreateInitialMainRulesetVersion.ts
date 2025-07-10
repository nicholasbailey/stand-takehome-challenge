import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialMainRulesetVersion1752125697000 implements MigrationInterface {
    name = 'CreateInitialMainRulesetVersion1752125697000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert the initial version for the main ruleset
        await queryRunner.query(`
            INSERT INTO rule_set_versions (rule_data, effective_date, rule_set_id)
            SELECT '{"rules": []}'::jsonb, NOW(), rs.id
            FROM rule_sets rs
            WHERE rs.name = 'main' AND rs.is_main = true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the initial version for the main ruleset
        await queryRunner.query(`
            DELETE FROM rule_set_versions 
            WHERE rule_set_id IN (
                SELECT id FROM rule_sets WHERE name = 'main' AND is_main = true
            );
        `);
    }
} 