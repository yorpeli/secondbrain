import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripViewPrefix,
  calculateApprovalRate,
  calculateFtlRate,
  calculateAccountsApprovedGLPS,
  calculateGLPSApprovalRate,
  addCalculatedRates,
  groupBy,
  sortBy,
  filterByMinAccounts,
  aggregate,
} from '../data-utils.js';

// ─── stripViewPrefix ────────────────────────────────────────

describe('stripViewPrefix', () => {
  it('strips the default view prefix from field names', () => {
    const row = {
      'clm_population_main_dashboard.country_name': 'Brazil',
      'clm_population_main_dashboard.accounts_created_clm': 500,
    };
    const result = stripViewPrefix(row);
    assert.deepEqual(result, {
      country_name: 'Brazil',
      accounts_created_clm: 500,
    });
  });

  it('strips prefix from an array of rows', () => {
    const rows = [
      { 'clm_population_main_dashboard.country_name': 'Brazil' },
      { 'clm_population_main_dashboard.country_name': 'Argentina' },
    ];
    const result = stripViewPrefix(rows);
    assert.deepEqual(result, [
      { country_name: 'Brazil' },
      { country_name: 'Argentina' },
    ]);
  });

  it('uses a custom prefix when provided', () => {
    const row = { 'custom_view.field_a': 1 };
    const result = stripViewPrefix(row, 'custom_view.');
    assert.deepEqual(result, { field_a: 1 });
  });

  it('leaves keys without the prefix unchanged', () => {
    const row = {
      'clm_population_main_dashboard.country_name': 'Brazil',
      'other_field': 42,
    };
    const result = stripViewPrefix(row);
    assert.deepEqual(result, {
      country_name: 'Brazil',
      other_field: 42,
    });
  });

  it('handles empty object', () => {
    assert.deepEqual(stripViewPrefix({}), {});
  });

  it('handles empty array', () => {
    assert.deepEqual(stripViewPrefix([]), []);
  });
});

// ─── calculateApprovalRate ──────────────────────────────────

describe('calculateApprovalRate', () => {
  it('calculates approval rate correctly', () => {
    const row = { accounts_created_clm: 1000, accounts_approved: 350 };
    assert.equal(calculateApprovalRate(row), 0.35);
  });

  it('returns 0 when created is 0', () => {
    const row = { accounts_created_clm: 0, accounts_approved: 0 };
    assert.equal(calculateApprovalRate(row), 0);
  });

  it('returns 0 when created field is missing', () => {
    const row = { accounts_approved: 100 };
    assert.equal(calculateApprovalRate(row), 0);
  });

  it('uses custom field names', () => {
    const row = { my_created: 200, my_approved: 80 };
    assert.equal(calculateApprovalRate(row, 'my_created', 'my_approved'), 0.4);
  });
});

// ─── calculateFtlRate ───────────────────────────────────────

describe('calculateFtlRate', () => {
  it('calculates FTL rate correctly', () => {
    const row = { accounts_created_clm: 1000, fft_dynamic_measure: 200 };
    assert.equal(calculateFtlRate(row), 0.2);
  });

  it('returns 0 when created is 0', () => {
    const row = { accounts_created_clm: 0, fft_dynamic_measure: 0 };
    assert.equal(calculateFtlRate(row), 0);
  });

  it('returns 0 when fields are missing', () => {
    assert.equal(calculateFtlRate({}), 0);
  });
});

// ─── calculateAccountsApprovedGLPS ──────────────────────────

describe('calculateAccountsApprovedGLPS', () => {
  it('calculates GLPS-adjusted approved accounts correctly', () => {
    const row = {
      glps_qualification_approved: 100,
      glps_qualification_approved_auto: 20,
      glps_qualification_opened_not_approved_auto: 200,
      accounts_approved: 500,
    };
    // glpsWithoutAuto = 100 - 20 = 80
    // glpsParam = 80 / 200 = 0.4
    // result = round(0.4 * 500) = 200
    assert.equal(calculateAccountsApprovedGLPS(row), 200);
  });

  it('throws when glps_opened_not_approved_auto is 0 but accounts_approved > 0', () => {
    const row = {
      glps_qualification_approved: 100,
      glps_qualification_approved_auto: 20,
      glps_qualification_opened_not_approved_auto: 0,
      accounts_approved: 500,
    };
    assert.throws(() => calculateAccountsApprovedGLPS(row), {
      message: /Cannot calculate GLPS-adjusted approval/,
    });
  });

  it('returns 0 when glps_opened_not_approved_auto is 0 and accounts_approved is 0', () => {
    const row = {
      glps_qualification_approved: 0,
      glps_qualification_approved_auto: 0,
      glps_qualification_opened_not_approved_auto: 0,
      accounts_approved: 0,
    };
    assert.equal(calculateAccountsApprovedGLPS(row), 0);
  });

  it('returns 0 when all fields are missing', () => {
    assert.equal(calculateAccountsApprovedGLPS({}), 0);
  });

  it('returns 0 when all values are 0', () => {
    const row = {
      glps_qualification_approved: 0,
      glps_qualification_approved_auto: 0,
      glps_qualification_opened_not_approved_auto: 0,
      accounts_approved: 0,
    };
    assert.equal(calculateAccountsApprovedGLPS(row), 0);
  });

  it('rounds the result', () => {
    const row = {
      glps_qualification_approved: 7,
      glps_qualification_approved_auto: 2,
      glps_qualification_opened_not_approved_auto: 3,
      accounts_approved: 10,
    };
    // glpsWithoutAuto = 5
    // glpsParam = 5 / 3 ≈ 1.6667
    // result = round(1.6667 * 10) = round(16.667) = 17
    assert.equal(calculateAccountsApprovedGLPS(row), 17);
  });
});

// ─── calculateGLPSApprovalRate ──────────────────────────────

describe('calculateGLPSApprovalRate', () => {
  it('returns GLPS approval rate as glps_approved / created', () => {
    const row = {
      accounts_created: 1000,
      glps_qualification_approved: 100,
      glps_qualification_approved_auto: 20,
      glps_qualification_opened_not_approved_auto: 200,
      accounts_approved: 500,
    };
    // GLPS approved = 200 (from calculateAccountsApprovedGLPS)
    // Rate = 200 / 1000 = 0.2
    assert.equal(calculateGLPSApprovalRate(row), 0.2);
  });

  it('returns 0 when created is 0', () => {
    const row = {
      accounts_created: 0,
      glps_qualification_approved: 100,
      glps_qualification_approved_auto: 20,
      glps_qualification_opened_not_approved_auto: 200,
      accounts_approved: 500,
    };
    assert.equal(calculateGLPSApprovalRate(row), 0);
  });
});

// ─── addCalculatedRates ─────────────────────────────────────

describe('addCalculatedRates', () => {
  it('adds all calculated rate fields', () => {
    const data = [
      {
        accounts_created_clm: 1000,
        accounts_approved: 350,
        fft_dynamic_measure: 200,
        clm_finished_segmentation: 800,
        submitted_all_docs_step: 600,
      },
    ];
    const result = addCalculatedRates(data);
    assert.equal(result.length, 1);
    assert.equal(result[0].approval_rate, 0.35);
    assert.equal(result[0].ftl_rate, 0.2);
    assert.equal(result[0].segmentation_rate, 0.8);
    assert.equal(result[0].doc_completion_rate, 0.6);
  });

  it('handles zero accounts gracefully', () => {
    const data = [{ accounts_created_clm: 0 }];
    const result = addCalculatedRates(data);
    assert.equal(result[0].approval_rate, 0);
    assert.equal(result[0].ftl_rate, 0);
    assert.equal(result[0].segmentation_rate, 0);
    assert.equal(result[0].doc_completion_rate, 0);
  });

  it('preserves original fields', () => {
    const data = [{ accounts_created_clm: 100, country_name: 'Brazil' }];
    const result = addCalculatedRates(data);
    assert.equal(result[0].country_name, 'Brazil');
  });
});

// ─── groupBy ────────────────────────────────────────────────

describe('groupBy', () => {
  it('groups rows by a string field', () => {
    const data = [
      { country: 'Brazil', value: 1 },
      { country: 'Brazil', value: 2 },
      { country: 'Argentina', value: 3 },
    ];
    const result = groupBy(data, 'country');
    assert.equal(Object.keys(result).length, 2);
    assert.equal(result['Brazil'].length, 2);
    assert.equal(result['Argentina'].length, 1);
  });

  it('uses "unknown" for missing fields', () => {
    const data = [{ value: 1 }];
    const result = groupBy(data, 'country');
    assert.equal(result['unknown'].length, 1);
  });
});

// ─── sortBy ─────────────────────────────────────────────────

describe('sortBy', () => {
  it('sorts ascending by default', () => {
    const data = [{ v: 3 }, { v: 1 }, { v: 2 }];
    const result = sortBy(data, 'v');
    assert.deepEqual(result.map(r => r.v), [1, 2, 3]);
  });

  it('sorts descending', () => {
    const data = [{ v: 1 }, { v: 3 }, { v: 2 }];
    const result = sortBy(data, 'v', true);
    assert.deepEqual(result.map(r => r.v), [3, 2, 1]);
  });

  it('does not mutate original array', () => {
    const data = [{ v: 3 }, { v: 1 }];
    sortBy(data, 'v');
    assert.equal(data[0].v, 3);
  });
});

// ─── filterByMinAccounts ────────────────────────────────────

describe('filterByMinAccounts', () => {
  it('filters below threshold', () => {
    const data = [
      { accounts_created_clm: 100 },
      { accounts_created_clm: 5 },
      { accounts_created_clm: 50 },
    ];
    const result = filterByMinAccounts(data, 20);
    assert.equal(result.length, 2);
  });

  it('uses custom field name', () => {
    const data = [{ volume: 100 }, { volume: 5 }];
    const result = filterByMinAccounts(data, 10, 'volume');
    assert.equal(result.length, 1);
  });
});

// ─── aggregate ──────────────────────────────────────────────

describe('aggregate', () => {
  it('sums all numeric fields', () => {
    const data = [
      { a: 10, b: 20, name: 'x' },
      { a: 30, b: 40, name: 'y' },
    ];
    const result = aggregate(data) as Record<string, unknown>;
    assert.equal(result.a, 40);
    assert.equal(result.b, 60);
    assert.equal(result.row_count, 2);
  });

  it('groups by field when provided', () => {
    const data = [
      { group: 'A', value: 10 },
      { group: 'A', value: 20 },
      { group: 'B', value: 30 },
    ];
    const result = aggregate(data, 'group') as Record<string, unknown>[];
    assert.equal(result.length, 2);
    const groupA = result.find(r => r.group === 'A')!;
    assert.equal(groupA.value, 30);
  });

  it('returns empty object for empty array', () => {
    assert.deepEqual(aggregate([]), {});
  });
});
