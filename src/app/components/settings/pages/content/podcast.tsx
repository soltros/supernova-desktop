import { usePluginEnabled } from '@/app/hooks/use-server-plugins'

export function PodcastContent() {
  const enabled = usePluginEnabled('podcasts')
  return (
    <section className="space-y-3">
      <h3>Podcasts</h3>
      <p className="text-sm text-muted-foreground">
        {enabled
          ? 'The Podcasts plugin is enabled on this server.'
          : 'Enable the Podcasts plugin and configure Podcast Index credentials on your Supernova server.'}
      </p>
    </section>
  )
}
