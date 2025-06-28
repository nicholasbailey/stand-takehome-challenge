import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { RuleSetEntity } from '../entities/rule-set';
import { 
    getRuleSetVersion, 
    getMainRuleSet, 
    getMainRuleSetVersion, 
    createNewRuleSetVersion, 
    evaluateRuleSet, 
    listRuleSets, 
    createRuleSetDraft 
} from '../services/ruleset-service';
import { Inspection } from '@mitigation/shared-models/models/inspection';
import { MitigationRuleModel } from '@mitigation/shared-models/models/mitigation-rule';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

router.get("/", asyncHandler(async (req: Request, res: Response) => {
    const ruleSets = await listRuleSets();
    return res.json({
        ruleSets: ruleSets.map(ruleSet => ({
            id: ruleSet.id,
            name: ruleSet.name,
            isMain: ruleSet.isMain
        }))
    });
}));

router.get('/main', asyncHandler(async (req: Request, res: Response) => {
    const asOf = req.query.asOf ? new Date(req.query.asOf as string) : undefined;
    // Yes there's an extraneous database query here. Right now. It's a select on a tiny
    // table and we are prototyping. We can refactor later.
    const ruleSetVersion = await getMainRuleSetVersion(asOf);
    if (!ruleSetVersion) {
        return res.status(404).json({ error: 'No published rule set version found' });
    }

    return res.json(ruleSetVersion);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const ruleSetId = parseInt(req.params.id);
    const ruleSetVersion = await getRuleSetVersion(ruleSetId);
    if (!ruleSetVersion) {
        return res.status(404).json({ error: 'Rule set version not found' });
    }

    return res.json(ruleSetVersion);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const initialRules = req.body.rules as MitigationRuleModel[];
    const savedVersion = await createRuleSetDraft(initialRules);
    return res.json(savedVersion);
}));

router.post('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
    const ruleSetId = parseInt(req.params.id);
    const ruleData = req.body.rules;
    const newRuleSetVersion = await createNewRuleSetVersion(ruleSetId, ruleData);
    return res.json(newRuleSetVersion);
}));

router.post('/:id/publish', asyncHandler(async (req: Request, res: Response) => {
    // All uses of parse int need to be swapped out because
    // parseInt's behavior is, bluntly, insane. (parseInt("1istheloneliestnumber") === 1)

    const ruleSetId = parseInt(req.params.id);
    const ruleSetVersion = await getRuleSetVersion(ruleSetId);
    if (!ruleSetVersion) {
        return res.status(404).json({ error: 'Rule set version not found' });
    }

    const mainRuleSet = await getMainRuleSet();
    if (!mainRuleSet) {
        return res.status(404).json({ error: 'Main rule set not found' });
    }
    const newRuleSetVersion = await createNewRuleSetVersion(mainRuleSet.id, ruleSetVersion.rules);
    return res.json(newRuleSetVersion);
}));

router.post('/main/evaluate', asyncHandler(async (req: Request, res: Response) => {
    const asOf = req.body.asOf ? new Date(req.body.asOf as string) : undefined;
    const ruleSetVersion = await getMainRuleSetVersion(asOf);
    if (!ruleSetVersion) {
        return res.status(404).json({ error: 'No published rule set version found' });
    }
    const result = await evaluateRuleSet(ruleSetVersion, req.body.observations);
    return res.json(result);
}));

/*
 * POST /api/rulesets/:id/evaluate
 * Evaluate an arbitrary rule-set (draft or main) against a set of observations.
 * Optional body property `asOf` behaves the same as the main evaluate route –
 * if supplied the latest version *at or before* that timestamp is used.
 * Expects `{ observations: ObservationsModel, asOf?: string }` in the request body.
 */
router.post('/:id/evaluate', asyncHandler(async (req: Request, res: Response) => {
    const ruleSetId = parseInt(req.params.id);
    const asOf = req.body.asOf ? new Date(req.body.asOf as string) : undefined;

    const ruleSetVersion = await getRuleSetVersion(ruleSetId, asOf);
    if (!ruleSetVersion) {
        return res.status(404).json({ error: 'Rule set version not found' });
    }

    const result = await evaluateRuleSet(ruleSetVersion, req.body.observations as Inspection);
    return res.json(result);
}));

export default router;