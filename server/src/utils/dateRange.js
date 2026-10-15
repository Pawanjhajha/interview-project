const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 366;

// Dates are whole UTC days written YYYY-MM-DD; both ends are inclusive. Using one timezone everywhere
// keeps the boundaries identical for every user and for the client's default range.
const parseDay = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  // Rejects impossible dates such as 2026-02-31, which Date would silently roll over.
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const startOfDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

// Fills in a missing end (today) and a missing start (the default window before the end).
// Assumes the values were validated; returns { from, to } as UTC midnights, both inclusive days.
const resolveDateRange = ({ from, to } = {}, now = new Date()) => {
  const end = to === undefined ? startOfDay(now) : parseDay(to);
  const start = from === undefined ? new Date(end.getTime() - (DEFAULT_DAYS - 1) * DAY_MS) : parseDay(from);
  return { from: start, to: end };
};

const toDayString = (date) => date.toISOString().slice(0, 10);

module.exports = { DAY_MS, MAX_DAYS, parseDay, resolveDateRange, toDayString };
