import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { RuleSetEntity } from '../entities/rule-set';
import { MitigationRule } from '../engine/mitigation-rule';
import { RuleExecutionResult } from '@mitigation/shared/models/execution-result';

const router = Router();

async function getCurrentRuleset(): Promise<RuleSetEntity | null> {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    return await ruleSetRepository.findOne({
        where: { status: 'published' },
        order: { createdAt: 'DESC' }
    });
}

async function createEmptyRuleSet(): Promise<RuleSetEntity> {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    const newRuleset = new RuleSetEntity();
    newRuleset.name = 'New Rule Set';
    newRuleset.status = 'draft';
    return await ruleSetRepository.save(newRuleset);
}

// GET /api/rulesets
router.get('/', async (req: Request, res: Response) => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    const ruleSets = await ruleSetRepository.find();
    res.json(ruleSets.map(ruleset => ruleset.toModel()));
});

// GET /api/ruleset/:id
router.get('/:id', (req: Request, res: Response) => {
    // TODO: Implement logic
});

/**
 * Copies the current active ruleset and creates a new draft ruleset.
 */
router.post('/new', async (req: Request, res: Response) => {
    const currentRuleset = await getCurrentRuleset();
    if (!currentRuleset) {
       const newRuleset = await createEmptyRuleSet();
       return res.json(newRuleset.toModel());
    }

    const currentRuleSetModel = currentRuleset.toModel();
    currentRuleSetModel.id = undefined;

    const newRuleSet = RuleSetEntity.fromModel(currentRuleSetModel);

    const savedRuleset = await AppDataSource.getRepository(RuleSetEntity).save(newRuleSet);
    res.json(savedRuleset.toModel());
});

// PUT /api/rulesets/:id
router.put('/:id', async (req: Request, res: Response) => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    
    const ruleSet = RuleSetEntity.fromModel(req.body);
    ruleSet.id = parseInt(req.params.id);
    
    const updatedRuleSet = await ruleSetRepository.save(ruleSet);
    res.json(updatedRuleSet.toModel());
});

router.post('/:id/publish', async (req: Request, res: Response) => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    const ruleSet = await ruleSetRepository.findOne({ where: { id: parseInt(req.params.id) } });
    if (!ruleSet) {
        return res.status(404).json({ error: 'Rule set not found' });
    }
    
    ruleSet.status = 'published';
    const updatedRuleSet = await ruleSetRepository.save(ruleSet);
    res.json(updatedRuleSet.toModel());
});

// POST /api/rulesets/:id/evaluate
router.post('/:id/evaluate', async (req: Request, res: Response) => {
    const ruleSetRepository = AppDataSource.getRepository(RuleSetEntity);
    const ruleSetEntity = await ruleSetRepository.findOne({ where: { id: parseInt(req.params.id) } });
    if (!ruleSetEntity) {
        return res.status(404).json({ error: 'Rule set not found' });
    }

    const ruleSetModel = ruleSetEntity.toModel();
    const ruleExecutions: RuleExecutionResult[] = []
    for (const rule of ruleSetModel.rules) {
        const executableRule = MitigationRule.fromPlainObject(rule);
        const mitigations = executableRule.evaluate(req.body);
        const ruleExecutionResult: RuleExecutionResult = {
            rule: rule,
            mitigations: mitigations
        }
        ruleExecutions.push(ruleExecutionResult);
    }    
    const executionResult = {
        ruleExecutions: ruleExecutions
    }
    res.json(executionResult);
});

router.post('/current/evaluate', async (req: Request, res: Response) => {
    const currentRuleset = await getCurrentRuleset();
    if (!currentRuleset) {
        return res.status(404).json({ error: 'No published ruleset found' });
    }

    const ruleSetModel = currentRuleset.toModel();
    const ruleExecutions: RuleExecutionResult[] = []
    for (const rule of ruleSetModel.rules) {
        const executableRule = MitigationRule.fromPlainObject(rule);
        const mitigations = executableRule.evaluate(req.body);
        const ruleExecutionResult: RuleExecutionResult = {
            rule: rule,
            mitigations: mitigations
        }
        ruleExecutions.push(ruleExecutionResult);
    }
    const executionResult = {
        ruleExecutions: ruleExecutions
    }
    res.json(executionResult);
});

export default router; 