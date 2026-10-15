import { useSearchParams } from 'react-router-dom'

const toPage = (value) => Math.max(1, Number.parseInt(value, 10) || 1)

// Current `?page=` (always a positive integer) and a setter that also scrolls back to the top.
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const setPage = (page) => {
    setSearchParams({ page })
    window.scrollTo({ top: 0 })
  }
  return [toPage(searchParams.get('page')), setPage]
}
