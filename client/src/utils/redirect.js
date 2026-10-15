export const DEFAULT_AUTHENTICATED_PATH = '/dashboard'

// Where to send a user who just authenticated: the page they were originally headed to
// (path, query string and hash), or the default page.
export const getPostLoginPath = (location) => {
  const from = location.state?.from
  return from ? `${from.pathname}${from.search}${from.hash}` : DEFAULT_AUTHENTICATED_PATH
}
