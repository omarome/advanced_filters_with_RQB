import { filterData } from '../queryFilter';

const sampleData = [
  { id: 1, name: 'Alice', age: 30, email: 'alice@test.com', isOnline: true },
  { id: 2, name: 'Bob', age: 25, email: 'bob@test.com', isOnline: false },
  { id: 3, name: 'Charlie', age: 35, email: 'charlie@test.com', isOnline: true },
  { id: 4, name: 'Diana', age: 28, email: 'diana@test.com', isOnline: false },
];

describe('filterData', () => {
  describe('edge cases', () => {
    it('returns empty array for null data', () => {
      expect(filterData(null, { combinator: 'and', rules: [] })).toEqual([]);
    });

    it('returns empty array for non-array data', () => {
      expect(filterData('not-array', { combinator: 'and', rules: [] })).toEqual([]);
    });

    it('returns all data when query is null', () => {
      expect(filterData(sampleData, null)).toEqual(sampleData);
    });

    it('returns all data when query has no rules', () => {
      expect(filterData(sampleData, { combinator: 'and', rules: [] })).toEqual(sampleData);
    });

    it('passes through when rule has no field or operator', () => {
      const query = { combinator: 'and', rules: [{ field: '', operator: '' }] };
      expect(filterData(sampleData, query)).toEqual(sampleData);
    });
  });

  describe('equality operators', () => {
    it('filters with = operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: '=', value: 'Alice' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('filters with != operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: '!=', value: 'Alice' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(3);
    });
  });

  describe('numeric operators', () => {
    it('filters with < operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: '<', value: 30 }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.age < 30)).toBe(true);
    });

    it('filters with > operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: '>', value: 30 }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie');
    });

    it('filters with <= operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: '<=', value: 30 }],
      };
      expect(filterData(sampleData, query)).toHaveLength(3);
    });

    it('filters with >= operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: '>=', value: 30 }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });
  });

  describe('string operators', () => {
    it('filters with contains', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'contains', value: 'li' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2); // Alice, Charlie
    });

    it('filters with doesNotContain', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'doesNotContain', value: 'li' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });

    it('filters with beginsWith', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'beginsWith', value: 'A' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(1);
    });

    it('filters with doesNotBeginWith', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'doesNotBeginWith', value: 'A' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(3);
    });

    it('filters with endsWith', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'endsWith', value: 'e' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2); // Alice, Charlie
    });

    it('filters with doesNotEndWith', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'doesNotEndWith', value: 'e' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });

    it('string matching is case-insensitive', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'contains', value: 'ALICE' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(1);
    });
  });

  describe('null / notNull operators', () => {
    const dataWithNulls = [
      { id: 1, name: 'Alice', nickname: 'Ali' },
      { id: 2, name: 'Bob', nickname: null },
      { id: 3, name: 'Charlie', nickname: undefined },
    ];

    it('filters with null operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'nickname', operator: 'null' }],
      };
      expect(filterData(dataWithNulls, query)).toHaveLength(2);
    });

    it('filters with notNull operator', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'nickname', operator: 'notNull' }],
      };
      expect(filterData(dataWithNulls, query)).toHaveLength(1);
    });
  });

  describe('between / notBetween operators', () => {
    it('filters with between (comma-separated)', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: 'between', value: '26,32' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2); // Alice (30), Diana (28)
    });

    it('filters with notBetween', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'age', operator: 'notBetween', value: '26,32' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2); // Bob (25), Charlie (35)
    });
  });

  describe('in operator', () => {
    it('filters with in operator (comma-separated)', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'in', value: 'Alice,Bob' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2);
      expect(result.find(r => r.name === 'Alice')).toBeDefined();
      expect(result.find(r => r.name === 'Bob')).toBeDefined();
    });

    it('filters with in operator (case-insensitive mapping)', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'in', value: 'alice,Charlie' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2);
    });
  });

  describe('boolean fields', () => {
    it('filters boolean with = true', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'isOnline', operator: '=', value: 'true' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });

    it('filters boolean with = false', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'isOnline', operator: '=', value: 'false' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });

    it('filters boolean with != true', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'isOnline', operator: '!=', value: 'true' }],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });
  });

  describe('combinators', () => {
    it('AND combinator requires all rules to match', () => {
      const query = {
        combinator: 'and',
        rules: [
          { field: 'age', operator: '>', value: 27 },
          { field: 'isOnline', operator: '=', value: 'true' },
        ],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(2); // Alice (30, online), Charlie (35, online)
    });

    it('OR combinator requires any rule to match', () => {
      const query = {
        combinator: 'or',
        rules: [
          { field: 'name', operator: '=', value: 'Alice' },
          { field: 'name', operator: '=', value: 'Bob' },
        ],
      };
      expect(filterData(sampleData, query)).toHaveLength(2);
    });
  });

  describe('NOT toggle', () => {
    it('negates the result of the group', () => {
      const query = {
        combinator: 'and',
        not: true,
        rules: [{ field: 'name', operator: '=', value: 'Alice' }],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(3);
      expect(result.find((r) => r.name === 'Alice')).toBeUndefined();
    });
  });

  describe('nested groups', () => {
    it('evaluates nested rule groups', () => {
      const query = {
        combinator: 'and',
        rules: [
          { field: 'isOnline', operator: '=', value: 'true' },
          {
            combinator: 'or',
            rules: [
              { field: 'name', operator: '=', value: 'Alice' },
              { field: 'name', operator: '=', value: 'Diana' },
            ],
          },
        ],
      };
      const result = filterData(sampleData, query);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('empty / incomplete rules are no-ops', () => {
    it('passes through when value is empty string', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: '=', value: '' }],
      };
      expect(filterData(sampleData, query)).toEqual(sampleData);
    });

    it('passes through when value is null', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: '=', value: null }],
      };
      expect(filterData(sampleData, query)).toEqual(sampleData);
    });
  });

  describe('unknown operator', () => {
    it('passes through for unrecognized operators', () => {
      const query = {
        combinator: 'and',
        rules: [{ field: 'name', operator: 'unknownOp', value: 'test' }],
      };
      expect(filterData(sampleData, query)).toEqual(sampleData);
    });
  });
});
