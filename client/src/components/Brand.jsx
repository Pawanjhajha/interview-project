import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark"><Icon name="logo" size={22} /></span>
      <span>SecureAuth</span>
    </Link>
  )
}
