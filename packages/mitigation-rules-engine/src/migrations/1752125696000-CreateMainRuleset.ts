import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMainRuleset1752125696000 implements MigrationInterface {
    name = 'CreateMainRuleset1752125696000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert the main ruleset if it doesn't exist
        await queryRunner.query(`
            INSERT INTO rule_sets (name, is_main)
            SELECT 'main', true
            WHERE NOT EXISTS (
                SELECT 1 FROM rule_sets WHERE name = 'main' AND is_main = true
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the main ruleset
        await queryRunner.query(`
            DELETE FROM rule_sets WHERE name = 'main' AND is_main = true;
        `);
    }
} 