const { DAY_MS, MAX_DAYS, parseDay, resolveDateRange } = require('../utils/dateRange');

// Validates the ?from=&to= query (YYYY-MM-DD, inclusive, UTC). Either may be omitted.
const analyticsQuerySchema = (query = {}) => {
  const errors = {};
  for (const field of ['from', 'to']) {
    if (query[field] !== undefined && !parseDay(query[field])) errors[field] = `${field} must be a date like 2026-03-31`;
  }
  if (Object.keys(errors).length) return errors;

  const { from, to } = resolveDateRange(query);
  if (from > to) errors.from = 'from must not be after to';
  else if ((to - from) / DAY_MS + 1 > MAX_DAYS) errors.to = `The range can cover at most ${MAX_DAYS} days`;
  return errors;
};

module.exports = { analyticsQuerySchema };
