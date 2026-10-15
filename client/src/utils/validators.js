// Client-side checks that mirror server/src/validators/auth.validator.js.
// The server stays the source of truth; these only give faster feedback.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 50
const MAX_EMAIL_LENGTH = 254
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_BYTES = 72 // bcrypt ignores everything after 72 bytes

const validateEmail = (email) => {
  const value = email.trim()
  if (!value) return 'Email is required'
  if (value.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(value)) return 'Enter a valid email address'
  return ''
}

const validateNewPassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return `Password must be at most ${MAX_PASSWORD_BYTES} bytes`
  return ''
}

// Drops empty messages so the result only contains fields that have a problem.
const compact = (errors) => Object.fromEntries(Object.entries(errors).filter(([, message]) => message))

export const validateRegister = ({ name, email, password, confirmPassword }) =>
  compact({
    name: !name.trim() ? 'Name is required' : name.trim().length > MAX_NAME_LENGTH ? `Name must be at most ${MAX_NAME_LENGTH} characters` : '',
    email: validateEmail(email),
    password: validateNewPassword(password),
    confirmPassword: !confirmPassword ? 'Please confirm your password' : confirmPassword !== password ? 'Passwords do not match' : '',
  })

export const validateLogin = ({ email, password }) =>
  compact({
    email: validateEmail(email),
    password: password ? '' : 'Password is required',
  })

// Mirrors server/src/validators/product.validator.js. Fields arrive as form strings.
const MAX_TITLE_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_PRICE = 1000000
const MAX_STOCK = 1000000

const validatePrice = (raw) => {
  const value = raw.trim()
  if (!value) return 'Price is required'
  const price = Number(value)
  if (!Number.isFinite(price)) return 'Price must be a number'
  if (price <= 0) return 'Price must be greater than 0'
  if (price > MAX_PRICE) return `Price must be at most ${MAX_PRICE}`
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Price can have at most 2 decimal places'
  return ''
}

const validateStock = (raw) => {
  const value = raw.trim()
  if (!value) return 'Stock is required'
  if (!/^\d+$/.test(value)) return 'Stock must be a whole number, 0 or more'
  if (Number(value) > MAX_STOCK) return `Stock must be at most ${MAX_STOCK}`
  return ''
}

export const validateProduct = ({ title, price, stock, description }) =>
  compact({
    title: !title.trim() ? 'Title is required' : title.trim().length > MAX_TITLE_LENGTH ? `Title must be at most ${MAX_TITLE_LENGTH} characters` : '',
    price: validatePrice(price),
    stock: validateStock(stock),
    description: description.trim().length > MAX_DESCRIPTION_LENGTH ? `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters` : '',
  })

// Turns validated form strings into the numbers the API expects.
export const toProductPayload = ({ title, price, stock, description }) => ({
  title: title.trim(),
  price: Number(price),
  stock: Number(stock),
  description: description.trim(),
})

const MAX_COMMENT_LENGTH = 1000

export const validateReview = ({ rating, comment }) =>
  compact({
    rating: !rating ? 'Choose a rating from 1 to 5 stars' : '',
    comment: comment.trim().length > MAX_COMMENT_LENGTH ? `Comment must be at most ${MAX_COMMENT_LENGTH} characters` : '',
  })
