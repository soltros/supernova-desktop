import { useAppPodcasts } from '@/store/app.store'
import { Switch } from '@/app/components/ui/switch'
export function PodcastContent() {
  const { active, setActive } = useAppPodcasts()
  return (
    <section className="space-y-3">
      <h3>Podcasts</h3>
      <p className="text-sm text-muted-foreground">
        Uses the Podcasts plugin on your Supernova server. Configure Podcast
        Index credentials on the server.
      </p>
      <label className="flex items-center gap-3">
        <Switch checked={active} onCheckedChange={setActive} />
        Show podcasts
      </label>
    </section>
  )
}
