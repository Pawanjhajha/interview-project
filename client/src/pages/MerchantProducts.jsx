import { useState } from 'react'
import { createProduct, deleteProduct, fetchMyProducts, updateProduct } from '../api/products'
import Alert from '../components/Alert'
import Button from '../components/Button'
import DataState from '../components/DataState'
import EmptyState from '../components/EmptyState'
import PageLayout from '../components/PageLayout'
import ProductForm from '../components/ProductForm'
import { useFetch } from '../hooks/useFetch'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatPrice } from '../utils/formatPrice'

export default function MerchantProducts() {
  const { data: products, error, isLoading, reload } = useFetch(fetchMyProducts)
  const [editing, setEditing] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [feedback, setFeedback] = useState(null) // { type, message }

  // The form unmounts/remounts via `key`, which clears it after a successful save.
  const resetForm = () => {
    setEditing(null)
    setFormKey((key) => key + 1)
  }

  const handleSubmit = async (payload) => {
    if (editing) await updateProduct(editing._id, payload)
    else await createProduct(payload)
    setFeedback({ type: 'info', message: editing ? 'Product updated.' : 'Product published.' })
    resetForm()
    reload()
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.title}"? This can't be undone.`)) return
    try {
      await deleteProduct(product._id)
      setFeedback({ type: 'info', message: 'Product deleted.' })
      if (editing?._id === product._id) resetForm()
      reload()
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    }
  }

  const startEditing = (product) => {
    setFeedback(null)
    setEditing(product)
    setFormKey((key) => key + 1)
  }

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>My products</h1>
        <p className="subtitle">Publish and manage what you sell.</p>
      </section>

      {feedback && <Alert type={feedback.type}>{feedback.message}</Alert>}
      <ProductForm key={formKey} product={editing} onSubmit={handleSubmit} onCancel={editing ? resetForm : undefined} />

      <section aria-labelledby="inventory-heading">
        <h2 id="inventory-heading">Inventory</h2>
        <DataState isLoading={isLoading} error={error} onRetry={reload}>
          {products?.length ? (
            <ul className="inventory-list">
              {products.map((product) => (
                <li className="card inventory-item" key={product._id}>
                  <div className="inventory-info">
                    <h3>{product.title}</h3>
                    <p>
                      {formatPrice(product.price)} · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                  <div className="inventory-actions">
                    <Button variant="secondary" icon="edit" aria-label={`Edit ${product.title}`} onClick={() => startEditing(product)}>Edit</Button>
                    <Button variant="secondary" icon="trash" className="btn-danger" aria-label={`Delete ${product.title}`} onClick={() => handleDelete(product)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="box" title="No products yet">Use the form above to publish your first product.</EmptyState>
          )}
        </DataState>
      </section>
    </PageLayout>
  )
}
