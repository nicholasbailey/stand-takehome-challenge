import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInitialRuleset1704000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO rule_sets 
                (name, status, rule_data, created_at, updated_at, effective_date)
            VALUES ('V1', 'published', $$
            {
                "rules": [
                    {
                        "name": "Attic Vent",
                        "description": " Ensure all vents, chimneys, and screens can withstand embers (i.e., should be ember-rated)",
                        "rule": {
                            "operation": "EQUALS",
                            "operands": [
                                {
                                    "operation": "VARIABLE",
                                    "name": "atticVentHasScreens"
                                },
                                {
                                    "operation": "VALUE",
                                    "value": true
                                }
                            ]
                        },
                        "mitigations": [
                            {
                                "type": "Full",
                                "description": "Add Vents"
                            }
                        ]
                    }
                ]
            }$$::jsonb, NOW(), NOW(), '2025-01-01')
        `);


        // TODO: Insert initial ruleset data here
        // Structure should match your RuleSetEntity:
        // - name: string
        // - status: 'draft' | 'published' 
        // - rule_data: jsonb (array of your rule objects)
        // - effective_date: date (optional)
        // - created_at, updated_at: timestamps
        
        // Example:
        // await queryRunner.query(`
        //     INSERT INTO rule_sets (name, status, rule_data, created_at, updated_at)
        //     VALUES ('Your Initial Ruleset Name', 'published', '[]'::jsonb, NOW(), NOW())
        // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TODO: Remove the initial ruleset data
        // Should reverse whatever was done in up()
        
        // Example:
        // await queryRunner.query(`
        //     DELETE FROM rule_sets WHERE name = 'Your Initial Ruleset Name'
        // `);
    }
} 