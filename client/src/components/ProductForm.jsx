import Alert from './Alert'
import Button from './Button'
import FormField from './FormField'
import { useFormState } from '../hooks/useFormState'
import { toProductPayload, validateProduct } from '../utils/validators'

const toFormValues = (product) => ({
  title: product?.title ?? '',
  price: product ? String(product.price) : '',
  stock: product ? String(product.stock) : '',
  description: product?.description ?? '',
})

/**
 * Create/edit form for a product. `product` switches it to edit mode; remount it (via `key`)
 * to load a different product. `onSubmit` receives the API payload (numbers already converted).
 */
export default function ProductForm({ product, onSubmit, onCancel }) {
  const { values, fieldErrors, formError, submitting, handleChange, handleSubmit } = useFormState({
    initialValues: toFormValues(product),
    validate: validateProduct,
    onSubmit: (formValues) => onSubmit(toProductPayload(formValues)),
    resetOnSuccess: true,
  })
  const common = { onChange: handleChange, disabled: submitting }

  return (
    <form className="card product-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <h2>{product ? 'Edit product' : 'Add a product'}</h2>
      <FormField label="Title" name="title" value={values.title} error={fieldErrors.title} maxLength={100} {...common} />
      <div className="form-row">
        <FormField label="Price (USD)" name="price" inputMode="decimal" placeholder="0.00" value={values.price} error={fieldErrors.price} {...common} />
        <FormField label="Stock" name="stock" inputMode="numeric" placeholder="0" value={values.stock} error={fieldErrors.stock} {...common} />
      </div>
      <FormField as="textarea" rows={4} label="Description" name="description" hint="Optional. Up to 2000 characters." value={values.description} error={fieldErrors.description} {...common} />
      {formError && <Alert type="error">{formError}</Alert>}
      <div className="form-actions">
        <Button type="submit" icon={product ? 'check' : 'plus'} loading={submitting} loadingLabel="Saving...">
          {product ? 'Save changes' : 'Publish product'}
        </Button>
        {onCancel && <Button variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  )
}
