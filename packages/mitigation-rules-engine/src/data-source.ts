import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RuleSetEntity } from './entities/rule-set';
import { RuleSetVersionEntity } from './entities/rule-set-version';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'mitigation_rules',
  synchronize: false,
  logging: false,
  entities: [RuleSetEntity, RuleSetVersionEntity],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  subscribers: [],
}); 