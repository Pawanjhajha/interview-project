import { useRef, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../utils/getErrorMessage'

/**
 * State and submit flow shared by every form: controlled values, client validation first,
 * then server field/form errors. `onSubmit` receives the values and may throw an axios error.
 * By default the form stays "submitting" after success (the page is about to navigate away);
 * pass `resetOnSuccess` for forms that stay on screen.
 */
export function useFormState({ initialValues, validate, onSubmit, resetOnSuccess = false }) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // A ref blocks a second submit in the same tick, before the disabled button re-renders.
  const inFlight = useRef(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  const finish = () => {
    inFlight.current = false
    setSubmitting(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (inFlight.current) return

    setFormError('')
    const errors = validate ? validate(values) : {}
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    inFlight.current = true
    setSubmitting(true)
    try {
      await onSubmit(values)
      if (resetOnSuccess) finish()
    } catch (error) {
      setFieldErrors(getFieldErrors(error))
      setFormError(getErrorMessage(error))
      finish()
    }
  }

  return { values, fieldErrors, formError, submitting, handleChange, handleSubmit }
}
