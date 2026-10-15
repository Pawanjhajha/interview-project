import { useCallback } from 'react'
import { fetchProducts } from '../api/products'
import DataState from '../components/DataState'
import EmptyState from '../components/EmptyState'
import PageLayout from '../components/PageLayout'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import { useFetch } from '../hooks/useFetch'
import { usePageParam } from '../hooks/usePageParam'

export default function Marketplace() {
  const [page, changePage] = usePageParam()
  const fetcher = useCallback(() => fetchProducts({ page }), [page])
  const { data, error, isLoading, reload } = useFetch(fetcher)

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>Marketplace</h1>
        <p className="subtitle">Browse products from independent merchants.</p>
      </section>
      <DataState isLoading={isLoading} error={error} onRetry={reload}>
        {data?.products.length ? (
          <>
            <ul className="product-grid">
              {data.products.map((product) => (
                <li key={product._id}><ProductCard product={product} /></li>
              ))}
            </ul>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={changePage} />
          </>
        ) : (
          <EmptyState icon="store" title="No products yet">
            {page > 1 ? 'There is nothing on this page.' : 'Check back soon, merchants are still setting up their shops.'}
          </EmptyState>
        )}
      </DataState>
    </PageLayout>
  )
}
