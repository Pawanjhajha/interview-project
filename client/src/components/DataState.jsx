import Alert from './Alert'
import Button from './Button'
import { getErrorMessage } from '../utils/getErrorMessage'

// Shows a loading indicator, or an error with a retry button, until `children` (the data view) can render.
export default function DataState({ isLoading, error, onRetry, children }) {
  if (isLoading) {
    return (
      <div className="data-loading" role="status">
        <span className="spinner spinner-lg" aria-hidden="true" />
        <p>Loading...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="data-error">
        <Alert type="error">{getErrorMessage(error)}</Alert>
        <Button variant="secondary" onClick={onRetry}>Try again</Button>
      </div>
    )
  }
  return children
}
