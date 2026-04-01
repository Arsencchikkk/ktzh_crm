export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-2 border-surface-600 border-t-primary-500`}
      role="status"
    />
  )
}
