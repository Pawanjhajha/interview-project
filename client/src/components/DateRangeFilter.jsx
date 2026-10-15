import Button from './Button'
import FormField from './FormField'
import { useFormState } from '../hooks/useFormState'
import { lastDays, validateDateRange } from '../utils/dateRange'

const PRESETS = [7, 30, 90]

/**
 * From/to date filter with quick presets. `range` is the applied { from, to }; remount it (via `key`)
 * when the range changes elsewhere so the inputs follow.
 */
export default function DateRangeFilter({ range, onApply, disabled }) {
  const { values, fieldErrors, submitting, handleChange, handleSubmit } = useFormState({
    initialValues: range,
    validate: validateDateRange,
    onSubmit: async (dates) => onApply(dates),
    resetOnSuccess: true,
  })
  const common = { type: 'date', onChange: handleChange, disabled: disabled || submitting }

  return (
    <form className="card date-filter" onSubmit={handleSubmit} noValidate>
      <FormField label="From" name="from" value={values.from} error={fieldErrors.from} {...common} />
      <FormField label="To" name="to" value={values.to} error={fieldErrors.to} {...common} />
      <Button type="submit" icon="check" disabled={disabled}>Apply</Button>
      <div className="date-presets" role="group" aria-label="Quick ranges">
        {PRESETS.map((days) => (
          <Button key={days} variant="secondary" disabled={disabled} onClick={() => onApply(lastDays(days))}>
            Last {days} days
          </Button>
        ))}
      </div>
    </form>
  )
}
