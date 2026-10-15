import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `fetcher` (wrap it in useCallback so it only changes with its inputs) and returns
 * { data, error, isLoading }. A result only counts for the request that produced it, so a stale
 * response is ignored and `isLoading` is derived instead of set from inside the effect.
 * `reload` repeats the request, e.g. after a mutation or a failed attempt.
 */
export function useFetch(fetcher) {
  const [result, setResult] = useState({ fetcher: null, reloadCount: -1, data: null, error: null })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let isStale = false
    const done = (outcome) => !isStale && setResult({ fetcher, reloadCount, data: null, error: null, ...outcome })
    fetcher().then((data) => done({ data }), (error) => done({ error }))
    return () => {
      isStale = true
    }
  }, [fetcher, reloadCount])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  const isLoading = result.fetcher !== fetcher || result.reloadCount !== reloadCount
  return { data: isLoading ? null : result.data, error: isLoading ? null : result.error, isLoading, reload }
}
