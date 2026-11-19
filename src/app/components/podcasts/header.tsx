import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { useTranslation } from 'react-i18next'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { HeaderTitle } from '@/app/components/header-title'
import { Button } from '@/app/components/ui/button'
import { queryKeys } from '@/utils/queryKeys'
import { PodcastFormDialog } from './form-dialog'
import { PodcastsFilters } from './podcasts-filters'

export function PodcastsHeader() {
  const { t } = useTranslation()
  const [openFormDialog, setOpenFormDialog] = useState(false)

  const queryClient = useQueryClient()

  function handleRefreshPodcasts() {
    queryClient.invalidateQueries(
      { queryKey: [queryKeys.podcast.all] },
      { cancelRefetch: true },
    )
  }

  return (
    <ShadowHeader>
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 items-center">
          <HeaderTitle title={t('sidebar.podcasts')} />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleRefreshPodcasts}
          >
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.EPISODES.LATEST}>
              {t('podcasts.form.latestEpisodes')}
            </Link>
          </Button>
          <PodcastsFilters />

          <Button
            size="sm"
            variant="default"
            className="px-4"
            onClick={() => setOpenFormDialog(true)}
          >
            <PlusIcon className="w-5 h-5 -ml-[3px]" />
            <span className="ml-2">{t('podcasts.form.addButton')}</span>
          </Button>
        </div>
      </div>

      <PodcastFormDialog open={openFormDialog} setOpen={setOpenFormDialog} />
    </ShadowHeader>
  )
}
