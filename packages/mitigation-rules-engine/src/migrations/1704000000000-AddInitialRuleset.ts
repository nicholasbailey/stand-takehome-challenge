import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitialRuleset1704000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const result = await queryRunner.query(`
            INSERT INTO rule_sets (name, is_main)
            VALUES ('Main', true)
            RETURNING id
        `);
        const ruleSetId = result[0].id;
        
        await queryRunner.query(`
            INSERT INTO rule_set_versions 
                (rule_set_id, rule_data, effective_date)
            VALUES ($1, $$
            {
                "rules": []
            }$$::jsonb, Now()
            )
        `, [ruleSetId]);


        // TODO: Insert initial ruleset data here
        // Structure should match your RuleSetVersion:
        // - name: string
        // - status: 'draft' | 'published' 
        // - rule_data: jsonb (array of your rule objects)
        // - effective_date: date (optional)
        // - created_at, updated_at: timestamps
        
        // Example:
        // await queryRunner.query(`
        //     INSERT INTO rule_set_versions (version, status, rule_data, created_at, updated_at)
        //     VALUES (1, 'published', '[]'::jsonb, NOW(), NOW())
        // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TODO: Remove the initial ruleset data
        // Should reverse whatever was done in up()
        
        // Example:
        // await queryRunner.query(`
        //     DELETE FROM rule_set_versions WHERE version = 1
        // `);
    }
} 