import { useMutation } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { useFavoriteSongs } from '@/app/hooks/use-favorite-songs'
import { star } from '@/service/star'

export function ExternalFavoriteButton({
  id,
  kind,
  metadata,
}: {
  id: string
  kind: 'radio' | 'podcast'
  metadata: Record<string, unknown>
}) {
  const favorites = useFavoriteSongs()
  const items =
    kind === 'radio' ? favorites.data?.radio : favorites.data?.podcasts
  const starred = items?.some((item) => item.id === id) ?? false
  const mutation = useMutation({
    mutationFn: () =>
      star.handleStarItem({ id, starred, entityType: kind, metadata }),
    onError: (error) => toast.error(error.message),
  })

  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-11 shrink-0"
      aria-label={starred ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={starred}
      disabled={!items || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <Heart
        size={18}
        className={starred ? 'fill-primary text-primary' : undefined}
      />
    </Button>
  )
}
