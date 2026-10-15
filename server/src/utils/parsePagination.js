const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

const toPositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

// Query values are untrusted strings; anything invalid falls back to a safe default.
const parsePagination = ({ page, limit } = {}) => ({
  page: toPositiveInt(page, 1),
  limit: Math.min(toPositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT),
});

module.exports = parsePagination;
