import { AppIcon } from '@/app/components/app-icon'

export function AppTitle({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex gap-2 items-center">
      <AppIcon size={24} />
      <span className="leading-7 text-sm font-medium text-muted-foreground">
        {mobile ? 'Supernova' : 'Supernova Desktop'}
      </span>
    </div>
  )
}
