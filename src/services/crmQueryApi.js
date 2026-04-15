import { apiJson } from './apiClient';

/**
 * Execute a CRM segment query.
 * @param {object} req - { entityType, combinator, rules, page, size }
 */
export const executeCrmQuery = async (req) => {
  return apiJson('/query', {
    method: 'POST',
    body: JSON.stringify(req),
  });
};

/**
 * Fetch field metadata for all entity types.
 * Returns: { CONTACT: [...], ORGANIZATION: [...], ... }
 */
export const fetchAllFields = async () => {
  return apiJson('/query/fields');
};

/**
 * Fetch field metadata for a single entity type.
 */
export const fetchFieldsForEntity = async (entityType) => {
  return apiJson(`/query/fields/${entityType}`);
};
