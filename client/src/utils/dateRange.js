// Mirrors server/src/utils/dateRange.js: whole UTC days (YYYY-MM-DD), both ends inclusive, at most a year.
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_DAYS = 366

export const toDayString = (date) => date.toISOString().slice(0, 10)

// The last `days` days ending today (UTC), e.g. lastDays(7) covers today and the six days before.
export const lastDays = (days) => {
  const to = new Date()
  return { from: toDayString(new Date(to.getTime() - (days - 1) * DAY_MS)), to: toDayString(to) }
}

// ISO day strings compare correctly as text.
export const validateDateRange = ({ from, to }) => {
  const errors = {}
  if (!from) errors.from = 'Choose a start date'
  if (!to) errors.to = 'Choose an end date'
  if (errors.from || errors.to) return errors
  if (from > to) errors.from = 'Start date must not be after the end date'
  else if ((new Date(to) - new Date(from)) / DAY_MS + 1 > MAX_DAYS) errors.to = `Choose at most ${MAX_DAYS} days`
  return errors
}
