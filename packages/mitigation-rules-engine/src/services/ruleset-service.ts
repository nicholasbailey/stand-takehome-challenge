import { LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RuleSetVersionEntity } from '../entities/rule-set-version';
import { RuleSetEntity } from '../entities/rule-set';
import { MitigationRule } from '../engine/mitigation-rule';
import { MitigationRuleModel } from '@mitigation/shared/models/mitigation-rule';
import { RuleExecutionResult, RuleSetExecutionResult } from '@mitigation/shared/models/execution-result';
import { RuleSetVersion } from '@mitigation/shared/models/rule-set';
import { Inspection } from '@mitigation/shared/models/inspection';

// NOTE: This set of utiltiy functions is a lot messier than I would like
// I was moving fast after a  refactor of how the DB was structured and 
// didn't have time to really think through the PERFECT api design here
// there 


export const getRuleSetVersion = async (ruleSetId: number, asOf?: Date): Promise<RuleSetVersion | null> => {
    const ruleSetVersionRepository = AppDataSource.getRepository(RuleSetVersionEntity);

    let entity: RuleSetVersionEntity | null = null;
    // TODO: Consider if this should also filter on
    if (!!asOf) {
        entity = await ruleSetVersionRepository.findOne({
            where: { ruleSetId: ruleSetId, effectiveDate: LessThanOrEqual(asOf) },
            relations: ['ruleSet'],
            order: {
                effectiveDate: 'DESC'
            }
        });
    } else {
        entity = await ruleSetVersionRepository.findOne({
            where: { ruleSetId: ruleSetId },
            relations: ['ruleSet'],
            order: {
                effectiveDate: 'DESC'
            }
        });
    }
    return entity?.toModel() || null;
}

export const getMainRuleSet = async (): Promise<RuleSetEntity | null> => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    return await ruleSetRepository.findOne({ where: { isMain: true } });
}

export const getMainRuleSetVersion = async (asOf?: Date): Promise<RuleSetVersion | null> => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    const ruleSet = await ruleSetRepository.findOne({ where: { isMain: true } });
    if (!ruleSet) {
        return null;
    }
    return getRuleSetVersion(ruleSet.id, asOf);
}

export const createNewRuleSetVersion = async (ruleSetId: number, rules: MitigationRuleModel[]): Promise<RuleSetVersion> => {
    const initialVersionEntity = RuleSetVersionEntity.fromModel(
        {
            id: undefined,
            ruleSetId: ruleSetId,
            rules: rules,
            effectiveDate: new Date()
        }
    )
    const ruleSetVersionRepository = AppDataSource.getRepository(RuleSetVersionEntity);
    const savedModel = await ruleSetVersionRepository.save(initialVersionEntity);

    // This double query is to hydrate the rule set properties that are the RuleSetVersion model
    // there's likely a better way to do this, but again, prototyping.
    const updatedRuleSet = await ruleSetVersionRepository.findOne({ where: { id: savedModel.id }, relations: ['ruleSet'] });
    return updatedRuleSet!.toModel();
}

export const evaluateRuleSet = async (ruleSetVersion: RuleSetVersion, observations: Inspection): Promise<RuleSetExecutionResult> => {
    const ruleExecutions: RuleExecutionResult[] = []
    for (const mitigationRule of ruleSetVersion.rules) {
        const executableRule = MitigationRule.fromPlainObject(mitigationRule);
        const ruleExecutionResult = executableRule.evaluate(observations);
        ruleExecutions.push(ruleExecutionResult);
    }
    return {
        ruleExecutions: ruleExecutions
    }
}

/*
 * Returns all rule sets (draft and main) in the system. This is currently used
 * by the routes layer for the simple "list all rule sets" endpoint.
 * 
 * NOTE: Right now this directly returns entities. It should probably return
 * A viewmodel, similar to the RuleSetVersionModel, but right now we're moving 
 * fast and breaking things.
 */
export const listRuleSets = async (): Promise<RuleSetEntity[]> => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    return await ruleSetRepository.find();
};

/*
 * Creates a brand-new draft rule set and immediately adds an initial version
 * populated with the supplied rules.  The version is created with the helper
 * `createNewRuleSetVersion` so that the DB model ↔︎ plain-model translation
 * logic remains in a single place.
 */
export const createRuleSetDraft = async (initialRules: MitigationRuleModel[]): Promise<RuleSetVersion> => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);

    const newRuleSet = new RuleSetEntity();
    newRuleSet.name = `DRAFT ${Date.now().toString()}`;
    newRuleSet.isMain = false;

    const savedRuleSet = await ruleSetRepository.save(newRuleSet);

    return createNewRuleSetVersion(savedRuleSet.id, initialRules);
}; 