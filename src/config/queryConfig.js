import { defaultOperators as rqbDefaultOperators, toFullOption } from 'react-querybuilder';

// ---------------------------------------------------------------------------
// Operator names allowed per data type
// ---------------------------------------------------------------------------
const stringTypeOperators = [
  '=',
  '!=',
  'contains',
  'doesNotContain',
  'beginsWith',
  'doesNotBeginWith',
  'endsWith',
  'doesNotEndWith',
  'null',
  'notNull',
];

const numberTypeOperators = [
  '=',
  '!=',
  '<',
  '>',
  '<=',
  '>=',
  'between',
  'notBetween',
  'null',
  'notNull',
];

const booleanTypeOperators = ['='];

const stringOperators = rqbDefaultOperators.filter((op) => stringTypeOperators.includes(op.name));
const numberOperators = rqbDefaultOperators.filter((op) => numberTypeOperators.includes(op.name));
const booleanOperators = rqbDefaultOperators.filter((op) => booleanTypeOperators.includes(op.name));

// ---------------------------------------------------------------------------
// Maps backend variable types (PLC-style) to internal field types
// ---------------------------------------------------------------------------
const variableTypeMap = {
  STRING: 'string',
  EMAIL: 'email',
  BOOL: 'boolean',
  UDINT: 'number',
  UINT: 'number',
  INT: 'number',
  DINT: 'number',
  REAL: 'number',
  LREAL: 'number',
};

/** Signed PLC types — negative values are valid for these. */
const signedTypes = new Set(['INT', 'DINT', 'REAL', 'LREAL']);

const operatorsByType = {
  string: stringOperators,
  email: stringOperators,
  number: numberOperators,
  boolean: booleanOperators,
};

// ---------------------------------------------------------------------------
// Per-field UI overrides
//
// The backend provides the data type; the frontend decides the best widget.
// Only fields that need a non-default editor belong here.
// ---------------------------------------------------------------------------
const selectOperators = rqbDefaultOperators.filter((op) => ['=', '!=', 'null', 'notNull'].includes(op.name));

const fieldEditorOverrides = {
  status: {
    valueEditorType: 'select',
    values: [
      { name: 'Active', label: 'Active' },
      { name: 'Inactive', label: 'Inactive' },
      { name: 'Pending', label: 'Pending' },
    ],
    operators: selectOperators,
  },
  userType: {
    valueEditorType: 'select',
    values: [
      { name: 'student', label: 'Student' },
      { name: 'employee', label: 'Employee' },
      { name: 'unemployed', label: 'Unemployed' },
      { name: 'retired', label: 'Retired' },
    ],
    operators: selectOperators,
  },
  isOnline: {
    valueEditorType: 'select',
    chipPlaceholder: 'All Statuses',
    values: [
      { name: 'true', label: 'Online', dot: '#10b981' },
      { name: 'false', label: 'Offline', dot: '#ef4444' },
    ],
    operators: selectOperators,
  },
  probability: {
    chipType: 'probability-heat',
    chipPlaceholder: 'Any Probability',
  },
  lifecycleStage: {
    valueEditorType: 'select',
    chipPlaceholder: 'All Stages',
    operators: selectOperators,
    values: [
      { name: 'Lead', label: 'Lead' },
      { name: 'Prospect', label: 'Prospect' },
      { name: 'Customer', label: 'Customer' },
      { name: 'Churned', label: 'Churned' },
    ],
  },
};


/**
 * Builds the full field list for react-querybuilder from the /api/variables
 * endpoint response.  Labels, names, and types come directly from the backend.
 *
 * @param {Object[]} variables — array from /api/variables
 * @returns {FullField[]} — fields ready for <QueryBuilder>
 */
export const buildFieldsFromVariables = (variables) => {
  if (!variables || variables.length === 0) return [];

  return variables.map((variable) => {
    const { name, label, type: backendType } = variable;
    const type = variableTypeMap[backendType] || 'string';
    const operators = operatorsByType[type] || stringOperators;

    // Apply any UI-level overrides (e.g. select menus)
    const overrides = fieldEditorOverrides[name] || {};

    const baseField = {
      name,
      label,
      type,
      operators,
      ...overrides,
    };

    // Boolean fields → radio buttons with True / False (overrides win if present)
    if (type === 'boolean') {
      return toFullOption({
        valueEditorType: 'radio',
        values: [
          { name: 'true', label: 'True' },
          { name: 'false', label: 'False' },
        ],
        defaultValue: 'true',
        ...baseField,
      });
    }

    // Number fields → number input; unsigned types reject negatives
    if (type === 'number') {
      return toFullOption({
        ...baseField,
        inputType: 'number',
        allowNegative: signedTypes.has(backendType),
      });
    }

    return toFullOption(baseField);
  });
};

