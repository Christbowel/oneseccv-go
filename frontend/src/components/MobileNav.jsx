/**
 * Thumb-reachable bottom navigation (mobile only). Sits above the iOS home
 * indicator via env(safe-area-inset-bottom).
 */
export default function MobileNav({ items, active, onSelect }) {
  return (
    <nav
      className="lg:hidden shrink-0 grid"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        background: 'rgba(6,10,20,0.96)',
        borderTop: '1px solid #131A34',
        backdropFilter: 'blur(14px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Primary">
      {items.map(item => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex min-h-[56px] flex-col items-center justify-center gap-1 transition-colors duration-150 active:scale-[0.97]"
            style={{
              color: isActive ? '#FF6B1A' : '#7A83A0',
              opacity: item.disabled && !isActive ? 0.4 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {isActive && (
              <span className="absolute top-0 h-[2px] w-8 rounded-full"
                style={{ background: '#FF6B1A', boxShadow: '0 0 10px rgba(255,107,26,0.8)' }} />
            )}
            <span className="text-[17px] leading-none" aria-hidden="true">{item.icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute right-[22%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ background: '#FF6B1A' }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
