function ErrorBanner({ message, onRetry, actionLabel = 'Retry' }) {
  return (
    <div className="error-banner" role="alert">
      <p className="error-text">{message ?? 'Something went wrong.'}</p>
      <div className="error-actions">
        {onRetry ? (
          <button className="button" type="button" onClick={onRetry}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ErrorBanner
