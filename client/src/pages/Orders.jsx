import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../api/orders'
import DataState from '../components/DataState'
import EmptyState from '../components/EmptyState'
import OrderCard from '../components/OrderCard'
import PageLayout from '../components/PageLayout'
import Pagination from '../components/Pagination'
import { useFetch } from '../hooks/useFetch'
import { usePageParam } from '../hooks/usePageParam'

export default function Orders() {
  const [page, changePage] = usePageParam()
  const fetcher = useCallback(() => fetchOrders({ page }), [page])
  const { data, error, isLoading, reload } = useFetch(fetcher)

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>My orders</h1>
        <p className="subtitle">Prices shown are what you paid at the time of purchase.</p>
      </section>
      <DataState isLoading={isLoading} error={error} onRetry={reload}>
        {data?.orders.length ? (
          <>
            <ul className="order-list">
              {data.orders.map((order) => (
                <li key={order._id}><OrderCard order={order} /></li>
              ))}
            </ul>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={changePage} />
          </>
        ) : (
          <EmptyState icon="receipt" title="No orders yet" action={<Link to="/" className="btn btn-primary">Browse products</Link>}>
            {page > 1 ? 'There is nothing on this page.' : 'Orders you place will show up here.'}
          </EmptyState>
        )}
      </DataState>
    </PageLayout>
  )
}
