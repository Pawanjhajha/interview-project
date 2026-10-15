import Alert from './Alert'
import Button from './Button'
import FormField from './FormField'
import StarInput from './StarInput'
import { createReview } from '../api/reviews'
import { useFormState } from '../hooks/useFormState'
import { validateReview } from '../utils/validators'

export default function ReviewForm({ productId, onSubmitted }) {
  const { values, fieldErrors, formError, submitting, handleChange, handleSubmit } = useFormState({
    initialValues: { rating: '', comment: '' },
    validate: validateReview,
    resetOnSuccess: true,
    onSubmit: async ({ rating, comment }) => {
      await createReview(productId, { rating: Number(rating), comment: comment.trim() })
      onSubmitted()
    },
  })

  return (
    <form className="card review-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <h3>Write a review</h3>
      <StarInput value={values.rating} onChange={handleChange} error={fieldErrors.rating} disabled={submitting} />
      <FormField
        as="textarea"
        rows={3}
        label="Comment"
        name="comment"
        hint="Optional. Up to 1000 characters."
        value={values.comment}
        error={fieldErrors.comment}
        onChange={handleChange}
        disabled={submitting}
      />
      {formError && <Alert type="error">{formError}</Alert>}
      <Button type="submit" icon="check" loading={submitting} loadingLabel="Posting...">Post review</Button>
    </form>
  )
}
