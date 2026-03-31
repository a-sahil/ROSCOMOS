/**
 * Typed response schema builders for ROSCOMOS API.
 * Ensures all endpoints emit a consistent shape.
 */

function success(data, meta = {}) {
  return { success: true, data, meta, timestamp: new Date().toISOString() };
}

function failure(error, code = 'INTERNAL_ERROR', meta = {}) {
  return { success: false, error, code, meta, timestamp: new Date().toISOString() };
}

function paginated(data, { total, limit, offset }) {
  return success(data, { pagination: { total, limit, offset, hasMore: offset + limit < total } });
}

module.exports = { success, failure, paginated };
