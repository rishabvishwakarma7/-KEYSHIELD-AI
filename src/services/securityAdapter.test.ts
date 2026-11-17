import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_ALERTS,
  DEMO_EVENTS,
  DEMO_INCIDENTS,
  DEMO_MITRE_TECHNIQUES,
  DEMO_PROCESSES,
  DEMO_RULES,
} from '../mock-data/telemetryData';
import {
  buildProcessTree,
  filterAndSortEvents,
  paginateItems,
  runGlobalSearch,
  synthesizeDemoAIResponse,
  testDetectionRuleAgainstEvents,
  updateAlertStatusInList,
  validateDetectionRuleSyntax,
} from './securityAdapter';

test('filterAndSortEvents filters by severity, category, and search query', () => {
  const highOrCrit = filterAndSortEvents(DEMO_EVENTS, {
    search: 'AudioSrvHelper',
    category: 'All',
    severity: 'Critical',
  });
  assert.equal(highOrCrit.length, 1);
  assert.equal(highOrCrit[0].id, 'EVT-90418');

  const regEvents = filterAndSortEvents(DEMO_EVENTS, {
    search: '',
    category: 'Unexpected Registry Modification',
    severity: 'All',
  });
  assert.equal(regEvents.length, 1);
  assert.equal(regEvents[0].id, 'EVT-90417');
});

test('paginateItems clamps out-of-range pages cleanly', () => {
  const page1 = paginateItems(DEMO_EVENTS, 1, 5);
  assert.equal(page1.rows.length, 5);
  assert.equal(page1.totalPages, 3);

  const clamped = paginateItems(DEMO_EVENTS, 99, 5);
  assert.equal(clamped.currentPage, 3);
  assert.equal(clamped.rows.length, 2);
});

test('updateAlertStatusInList updates matching alert immutably', () => {
  const updated = updateAlertStatusInList(DEMO_ALERTS, 'ALT-2041', 'Investigating');
  assert.equal(updated.find((a) => a.id === 'ALT-2041')?.status, 'Investigating');
  assert.equal(DEMO_ALERTS.find((a) => a.id === 'ALT-2041')?.status, 'New');
});

test('buildProcessTree constructs parent-child hierarchy with depths', () => {
  const tree = buildProcessTree(DEMO_PROCESSES);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].process.name, 'System');
  assert.equal(tree[0].depth, 0);

  const explorer = tree[0].children.find((c) => c.process.name === 'explorer.exe');
  assert.ok(explorer);
  const winword = explorer.children.find((c) => c.process.name === 'winword.exe');
  assert.ok(winword);
  assert.equal(winword.depth, 2);
  const ps = winword.children.find((c) => c.process.name === 'powershell.exe');
  assert.ok(ps);
  const helper = ps.children.find((c) => c.process.name === 'AudioSrvHelper.exe');
  assert.ok(helper);
  assert.equal(helper.depth, 4);
});

test('validateDetectionRuleSyntax catches invalid syntax and testDetectionRuleAgainstEvents matches telemetry', () => {
  const validResult = validateDetectionRuleSyntax(DEMO_RULES[0]);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);

  const invalidResult = validateDetectionRuleSyntax({
    name: '',
    queryText: 'broken rule',
    matchPattern: '[unclosed',
    mitreId: 'BAD-ID',
  });
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.length >= 3);

  const matches = testDetectionRuleAgainstEvents(DEMO_RULES[0], DEMO_EVENTS);
  assert.ok(matches.some((e) => e.id === 'EVT-90418'));
});

test('runGlobalSearch finds T1056.001 across alerts and MITRE techniques', () => {
  const results = runGlobalSearch('T1056.001', {
    events: DEMO_EVENTS,
    alerts: DEMO_ALERTS,
    processes: DEMO_PROCESSES,
    incidents: DEMO_INCIDENTS,
    mitre: DEMO_MITRE_TECHNIQUES,
  });
  assert.ok(results.mitre.some((m) => m.id === 'T1056.001'));
  assert.ok(results.alerts.some((a) => a.id === 'ALT-2041'));
});

test('synthesizeDemoAIResponse always marks output as DEMO mode with structured fields', () => {
  const res = synthesizeDemoAIResponse('Why was this process flagged?', {
    alerts: DEMO_ALERTS,
    processes: DEMO_PROCESSES,
    events: DEMO_EVENTS,
  });
  assert.equal(res.mode, 'DEMO');
  assert.ok(res.summary.includes('DEMO OUTPUT'));
  assert.ok(res.observedEvidence.length >= 2);
  assert.ok(res.recommendedSteps.length >= 3);
});
