import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1752125072301 implements MigrationInterface {
    name = 'InitialSchema1752125072301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rule_set_versions" ("id" SERIAL NOT NULL, "rule_data" jsonb NOT NULL, "effective_date" TIMESTAMP NOT NULL, "rule_set_id" integer NOT NULL, CONSTRAINT "PK_4ec3f2694dd606493ad83e4de03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a58f37aa54f09cba01b040dbb0" ON "rule_set_versions" ("effective_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_0620d582afe0716138a4ba8933" ON "rule_set_versions" ("rule_set_id") `);
        await queryRunner.query(`CREATE TABLE "rule_sets" ("id" SERIAL NOT NULL, "name" text NOT NULL, "is_main" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_5fe503c220e68f5cd03bf887677" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rule_set_versions" ADD CONSTRAINT "FK_0620d582afe0716138a4ba8933b" FOREIGN KEY ("rule_set_id") REFERENCES "rule_sets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rule_set_versions" DROP CONSTRAINT "FK_0620d582afe0716138a4ba8933b"`);
        await queryRunner.query(`DROP TABLE "rule_sets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0620d582afe0716138a4ba8933"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a58f37aa54f09cba01b040dbb0"`);
        await queryRunner.query(`DROP TABLE "rule_set_versions"`);
    }

}
