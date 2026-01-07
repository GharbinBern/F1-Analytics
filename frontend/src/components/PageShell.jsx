import NavBar from './NavBar'

function PageShell({ children }) {
  return (
    <div className="page-shell">
      <NavBar />
      <div className="page-inner">
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}

export default PageShell
