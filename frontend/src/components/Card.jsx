function Card({ title, subtitle, action, children }) {
  return (
    <div className="card">
      {(title || subtitle || action) && (
        <div className="section-header">
          <div>
            {title ? <h3 className="section-title">{title}</h3> : null}
            {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
