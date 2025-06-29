import { test, expect, APIRequestContext, Page, Locator } from '@playwright/test';

/** Escapes regex special characters in a string */
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the <tr> corresponding to the rule name (exact match in first cell) */
function ruleRow(page: Page, ruleName: string): Locator {
  const regex = new RegExp(`^${escapeRegex(ruleName)}$`, 'i'); // case-insensitive exact match
  return page.locator('tbody tr').filter({
    has: page.locator('td:first-child', { hasText: regex })
  });
}

async function expectRuleToPass(row: Locator) {
  await expect(row.locator('text="✗"')).toHaveCount(0);
}
async function expectRuleToFail(row: Locator) {
  await expect(row.locator('text="✗"')).toBeVisible();
}

async function resetMainRuleset(request: APIRequestContext) {
  const createResp = await request.post('http://localhost:3001/api/rulesets', {
    data: { rules: [] }
  });
  expect(createResp.ok()).toBeTruthy();
  const draftVersion = await createResp.json();
  const draftId = draftVersion.ruleSetId;

  const publishResp = await request.post(`http://localhost:3001/api/rulesets/${draftId}/publish`);
  expect(publishResp.ok()).toBeTruthy();
}

async function createRule(
  page: Page,
  ruleName: string,
  ruleDescription: string,
  ruleExpression: string,
  mitigations?: string
) {
  await page.click('button:has-text("Add Rule")');
  await page.fill('input[name="name"]', ruleName);
  await page.fill('textarea[name="plainTextDescription"]', ruleDescription);
  await page.fill('textarea[placeholder*="expression"]', ruleExpression);
  if (mitigations !== undefined) {
    await page.fill('textarea[name="mitigations"]', mitigations);
  }
  await page.click('button:has-text("Save")');
}

test.describe('Applied Sciences UI', () => {
  test('should create and publish roof type rule', async ({ page, request }) => {
    test.setTimeout(0);
    await resetMainRuleset(request);
   
    // Navigate to the applied sciences UI
    await page.goto('http://localhost:3002/');
    
    // Should be on the Edit Rules page by default
    await expect(page.locator('h1')).toContainText('Applied Sciences');
    await expect(page.locator('h2')).toContainText('Current Rules');
    
    // Enter edit mode by creating a new draft ruleset
    await page.click('button:has-text("Create New Draft Ruleset")');
    
    // Should now be in edit mode
    await expect(page.locator('h2')).toContainText('Draft Rules');
    // Add Roof rule
    await createRule(
      page,
      'Roof',
      'Ensure roof is Class A by assembly, free of gaps, and well maintained. In low wildfire areas(Category A) roofs can be Class B or Class A',
      'roofType == "ClassA" or (roofType == "ClassB" and wildFireRiskCategory == "A")'
    );

    // Add Attic Vent rule
    await createRule(
      page,
      'Attic Vent',
      'Ensure all vents, chimneys, and screens can withstand embers (i.e., should be ember-rated)',
      'atticVentHasScreens == true',
      'Add Vents'
    );
    
    // Publish the changes
    await page.click('button:has-text("Publish Changes")');
    
    // Should be back to current rules view
    await expect(page.locator('h2')).toContainText('Current Rules');
    
    // Verify the rule was created
    await expect(page.locator('table')).toContainText('Roof');
    await expect(page.locator('table')).toContainText('roofType == "ClassA" or (roofType == "ClassB" and wildFireRiskCategory == "A")');

    // Now navigate to underwriting UI to test the rule
    await page.goto('http://localhost:3003/');
    
    await page.check('input[name="atticVentHasScreens"]');
    await page.selectOption('select[name="observations.roofType"]', 'ClassA');
    await page.selectOption('select[name="observations.widownType"]', 'SinglePane');
    await page.selectOption('select[name="observations.wildFireRiskCategory"]', 'A');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify the evaluation passes
    const roofPassing = ruleRow(page, 'Roof');
    await expectRuleToPass(roofPassing);
    const atticVentPassing = ruleRow(page, 'Attic Vent');
    await expectRuleToPass(atticVentPassing);

    // Re-test the same rule with roofType that should fail (ClassC)
    // Reload to reset the form state
    await page.reload();

    // Fill the form with failing criteria
    await page.selectOption('select[name="observations.roofType"]', 'ClassC');
    await page.selectOption('select[name="observations.widownType"]', 'SinglePane');
    await page.selectOption('select[name="observations.wildFireRiskCategory"]', 'A');

    // Submit the form
    await page.click('button[type="submit"]');



    const roofFailing = ruleRow(page, 'Roof');
    await expect(roofFailing.locator('text="✗"')).toBeVisible();
    const atticVentFailing = ruleRow(page, 'Attic Vent');
    await expect(atticVentFailing.locator('text="✗"')).toBeVisible();

  });
}); 