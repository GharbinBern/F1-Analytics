function Skeleton({ lines = 4 }) {
  return (
    <div className="grid" aria-hidden>
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="skeleton" style={{ height: 14 + (idx % 3) * 4 }} />
      ))}
    </div>
  )
}

export default Skeleton
