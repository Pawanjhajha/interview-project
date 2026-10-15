import AppHeader from './AppHeader'

// Header plus a centered content column for every page that is not an auth card.
export default function PageLayout({ children }) {
  return (
    <>
      <AppHeader />
      <main className="container page">{children}</main>
    </>
  )
}
