import { useCallback, useState } from 'react'
import { fetchSalesReport } from '../api/analytics'
import DataState from '../components/DataState'
import DateRangeFilter from '../components/DateRangeFilter'
import EmptyState from '../components/EmptyState'
import PageLayout from '../components/PageLayout'
import StatCard from '../components/StatCard'
import { useFetch } from '../hooks/useFetch'
import { lastDays } from '../utils/dateRange'
import { formatPrice } from '../utils/formatPrice'

export default function MerchantSales() {
  const [range, setRange] = useState(() => lastDays(30))
  const fetcher = useCallback(() => fetchSalesReport(range), [range])
  const { data: report, error, isLoading, reload } = useFetch(fetcher)

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>Sales</h1>
        <p className="subtitle">Completed orders for your products. Dates are UTC and both days are included.</p>
      </section>
      <DateRangeFilter key={`${range.from}_${range.to}`} range={range} onApply={setRange} disabled={isLoading} />
      <DataState isLoading={isLoading} error={error} onRetry={reload}>
        {report && report.orderCount === 0 ? (
          <EmptyState icon="chart" title="No sales in this range">
            Nothing was sold between {report.range.from} and {report.range.to}. Try a wider range.
          </EmptyState>
        ) : (
          report && (
            <>
              <dl className="stat-grid">
                <StatCard icon="receipt" label="Total sales" value={formatPrice(report.totalSales)} />
                <StatCard icon="box" label="Items sold" value={report.itemsSold} />
                <StatCard icon="cart" label="Orders" value={report.orderCount} />
              </dl>
              <section aria-labelledby="top-heading">
                <h2 id="top-heading">Top products</h2>
                <div className="card table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th scope="col">Product</th><th scope="col">Items sold</th><th scope="col">Sales</th></tr>
                    </thead>
                    <tbody>
                      {report.topProducts.map((product) => (
                        <tr key={product.productId}>
                          <th scope="row">{product.title}</th>
                          <td>{product.itemsSold}</td>
                          <td>{formatPrice(product.sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        )}
      </DataState>
    </PageLayout>
  )
}
