import { Link } from 'react-router-dom'
import Alert from './Alert'
import AuthLayout from './AuthLayout'
import Button from './Button'
import FormField from './FormField'
import { useFormState } from '../hooks/useFormState'

/**
 * Shared form for login and register.
 * `fields` describes the inputs (`initialValues` overrides the empty default per field), `validate` returns { field: message }
 * before anything is sent, and `onSubmit` receives the collected values.
 */
export default function AuthForm({ title, subtitle, fields, initialValues = {}, submitLabel, validate, onSubmit, notice, footer }) {
  const { values, fieldErrors, formError, submitting, handleChange, handleSubmit } = useFormState({
    initialValues: Object.fromEntries(fields.map((f) => [f.name, initialValues[f.name] ?? ''])),
    validate,
    onSubmit,
  })

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={<>{footer.text} <Link to={footer.to}>{footer.linkLabel}</Link></>}
    >
      {notice && <Alert>{notice}</Alert>}
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        {fields.map((field) => (
          <FormField
            key={field.name}
            {...field}
            value={values[field.name]}
            onChange={handleChange}
            error={fieldErrors[field.name]}
            disabled={submitting}
          />
        ))}
        {formError && <Alert type="error">{formError}</Alert>}
        <Button type="submit" loading={submitting} className="btn-block">{submitLabel}</Button>
      </form>
    </AuthLayout>
  )
}
