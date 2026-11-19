import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { invalidateFavorites } from '@/api/favorites'
import { request } from '@/api/httpClient'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { useServerPlugins } from '@/app/hooks/use-server-plugins'
import {
  type BackupKind,
  backups,
  exportBackup,
  importBackup,
} from '@/service/backups'
import { authorizeLastFm, connectLastFm } from '@/service/lastfm'
import {
  previewPlugin,
  type PreviewPlugin,
  runAutoTagger,
} from '@/service/plugins'
import { useAppStore } from '@/store/app.store'

const previewLabels: Record<PreviewPlugin, string> = {
  artistmerger: 'Preview artist merges',
  albummerger: 'Preview album merges',
  deduper: 'Preview duplicate tracks',
}

export function ServerSettings() {
  const { isAdmin, lastFmSession, token } = useAppStore((state) => state.data)
  const plugins = useServerPlugins()
  const client = useQueryClient()
  const [pending, setPending] = useState(false)
  const [lastFmUrl, setLastFmUrl] = useState('')
  const [callback, setCallback] = useState('')
  const [preview, setPreview] = useState<{
    label: string
    count: number
    warning?: string
  }>()
  const enabled = (id: string) =>
    plugins.data?.some((plugin) => plugin.id === id && plugin.enabled)
  const scan = useQuery({
    queryKey: ['supernova-scan'],
    queryFn: () =>
      request<{ status: string; files_scanned: number }>('/api/scan/progress'),
    enabled: Boolean(token && isAdmin),
    refetchInterval: (query) =>
      query.state.data?.status === 'scanning' ? 2000 : false,
  })

  async function run(task: () => Promise<unknown>, success?: string) {
    setPending(true)
    try {
      await task()
      if (success) toast.success(success)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Supernova request failed.',
      )
    } finally {
      setPending(false)
    }
  }

  async function download(kind: BackupKind) {
    const content = await exportBackup(kind)
    const file = new File([content], backups[kind].filename, {
      type: kind === 'podcasts' ? 'application/xml' : 'application/json',
    })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      return
    }
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = backups[kind].filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <div className="space-y-6 pb-4">
      <section className="space-y-2">
        <h3 className="font-semibold">Server plugins</h3>
        {plugins.isPending && <p>Loading plugins…</p>}
        {plugins.isError && (
          <Button variant="outline" onClick={() => plugins.refetch()}>
            Retry loading plugins
          </Button>
        )}
        {plugins.data?.length === 0 && (
          <p>No plugins registered on this server.</p>
        )}
        {plugins.data?.map((plugin) => (
          <div key={plugin.id} className="rounded-xl border p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{plugin.name}</strong>
              <span
                className={
                  plugin.enabled ? 'text-primary' : 'text-muted-foreground'
                }
              >
                {plugin.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {plugin.description}
            </p>
          </div>
        ))}
      </section>
      {enabled('lastfm') && (
        <section className="space-y-2">
          <h3 className="font-semibold">Last.fm</h3>
          {lastFmSession ? (
            <Button
              variant="outline"
              onClick={() =>
                useAppStore.setState((state) => {
                  state.data.lastFmSession = undefined
                })
              }
            >
              Disconnect Last.fm
            </Button>
          ) : (
            <>
              <Button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const { url } = await authorizeLastFm()
                    const target = new URL(url)
                    if (target.origin !== 'https://www.last.fm')
                      throw new Error(
                        'Unexpected Last.fm authorization address.',
                      )
                    setLastFmUrl(target.href)
                  })
                }
              >
                Start Last.fm setup
              </Button>
              {lastFmUrl && (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    run(async () => {
                      await connectLastFm(callback)
                      setCallback('')
                      setLastFmUrl('')
                    }, 'Connected to Last.fm.')
                  }}
                >
                  <a
                    href={lastFmUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-primary underline"
                  >
                    Authorize on Last.fm
                  </a>
                  <label className="block text-sm" htmlFor="lastfm-callback">
                    After approving access, copy the address from your browser
                    and paste it here.
                  </label>
                  <Input
                    id="lastfm-callback"
                    value={callback}
                    onChange={(event) => setCallback(event.target.value)}
                    autoCapitalize="off"
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={pending || !callback.trim()}>
                    Finish connection
                  </Button>
                </form>
              )}
            </>
          )}
        </section>
      )}
      <section className="space-y-3">
        <h3 className="font-semibold">Backups</h3>
        {(Object.keys(backups) as BackupKind[])
          .filter((kind) => kind !== 'podcasts' || enabled('podcasts'))
          .map((kind) => (
            <div className="space-y-2 rounded-xl border p-3" key={kind}>
              <div className="capitalize">{kind}</div>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(() => download(kind))}
              >
                Export
              </Button>
              <label className="block text-sm" htmlFor={`backup-${kind}`}>
                Import {kind}
              </label>
              <Input
                id={`backup-${kind}`}
                type="file"
                accept={
                  kind === 'podcasts' ? '.opml,.xml' : '.json,application/json'
                }
                disabled={pending}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  run(
                    async () => {
                      await importBackup(kind, file)
                      invalidateFavorites()
                      await client.invalidateQueries()
                    },
                    kind === 'podcasts'
                      ? 'Podcast import started on the server.'
                      : 'Backup imported.',
                  )
                }}
              />
            </div>
          ))}
      </section>
      {isAdmin && (
        <section className="space-y-3">
          <h3 className="font-semibold">Library maintenance</h3>
          {scan.data && (
            <p className="text-sm">
              Scan status: {scan.data.status} · {scan.data.files_scanned} files
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={pending || scan.data?.status === 'scanning'}
              onClick={() =>
                run(async () => {
                  await request('/api/scan', {
                    method: 'POST',
                    responseFormat: 'text',
                  })
                  await scan.refetch()
                }, 'Library scan requested.')
              }
            >
              Scan library
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (
                  !window.confirm(
                    'Clear cached artist images and biographies so the server can fetch them again?',
                  )
                )
                  return
                run(async () => {
                  await request('/api/settings/reset-artists', {
                    method: 'POST',
                  })
                  await client.invalidateQueries()
                }, 'Artist metadata refresh requested.')
              }}
            >
              Refresh artist metadata
            </Button>
            {enabled('autotagger') && (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(runAutoTagger, 'Auto-tagging job started.')}
              >
                Run Auto-Tagger
              </Button>
            )}
            {(Object.keys(previewLabels) as PreviewPlugin[])
              .filter(enabled)
              .map((id) => (
                <Button
                  key={id}
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const result = await previewPlugin(id)
                      setPreview({
                        label: previewLabels[id],
                        count: result.candidates?.length ?? 0,
                        warning: result.warning,
                      })
                    })
                  }
                >
                  {previewLabels[id]}
                </Button>
              ))}
          </div>
          {preview && (
            <p role="status">
              {preview.label}: {preview.count} candidate groups.{' '}
              {preview.warning}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
