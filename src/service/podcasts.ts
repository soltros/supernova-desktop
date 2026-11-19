import { request } from '@/api/httpClient'
import type {
  Podcast,
  Episode,
  EpisodeWithPodcast,
  Podcasts,
  Episodes,
  PodcastWithEpisodes,
  Playback,
} from '@/types/responses/podcasts'
interface Page {
  per_page?: number
  page?: number
}
export interface SearchParams extends Page {
  query: string
  filter_by?: string
}
export interface GetAllParams extends Page {
  order_by?: string
  sort?: string
}
export interface ShowParams extends GetAllParams {}
export interface SearchEpisodesParams extends GetAllParams {
  query: string
  filter_by?: string
}
interface Feed {
  id?: number
  feed_id?: string
  title: string
  description?: string
  author?: string
  url?: string
  feed_url?: string
  image?: string
  image_url?: string
  link?: string
  episodeCount?: number
  subscribed_at?: string
}
interface NativeEpisode {
  id: number | string
  title: string
  description: string
  enclosureUrl: string
  image?: string
  feedImage?: string
  duration: number
  datePublished: number
}
const feeds = new Map<string, Podcast>()
function feedModel(f: Feed): Podcast {
  const p: Podcast = {
    id: String(f.feed_id || f.id),
    title: f.title,
    description: f.description || '',
    author: f.author || '',
    link: f.link || '',
    image_url: f.image_url || f.image || '',
    feed_url: f.feed_url || f.url || '',
    is_visible: true,
    episode_count: f.episodeCount || 0,
    created_at: f.subscribed_at || '',
    updated_at: '',
  }
  feeds.delete(p.id)
  feeds.set(p.id, p)
  while (feeds.size > 256) feeds.delete(feeds.keys().next().value!)
  return p
}
function paginate<T>(data: T[], params: Page = {}) {
  const per_page = params.per_page || 30,
    current_page = params.page || 1,
    from = (current_page - 1) * per_page
  return {
    data: data.slice(from, from + per_page),
    per_page,
    current_page,
    from,
    to: Math.min(from + per_page, data.length),
    first_page_url: '',
    next_page_url:
      from + per_page < data.length ? String(current_page + 1) : null,
    prev_page_url: current_page > 1 ? String(current_page - 1) : null,
    path: '',
  }
}
async function search(p: SearchParams): Promise<Podcasts> {
  return paginate(
    (
      (await request<Feed[] | null>('/api/plugins/podcasts/search', {
        query: { q: p.query },
      })) || []
    ).map(feedModel),
    p,
  )
}
async function getAll(p: GetAllParams = {}): Promise<Podcasts> {
  const list = (
    (await request<Feed[] | null>('/api/plugins/podcasts/subscriptions')) || []
  ).map(feedModel)
  return paginate(list, p)
}
async function getOne(
  id: string,
  p: ShowParams = {},
): Promise<PodcastWithEpisodes> {
  if (!feeds.has(id)) {
    await getAll({ per_page: 10000 })
    if (!feeds.has(id)) {
      const favorites = await request<{ podcasts?: Feed[] | null }>(
        '/api/hearts/details',
      )
      const saved = favorites.podcasts?.find(
        (feed) => String(feed.feed_id ?? feed.id) === id,
      )
      if (saved) feedModel(saved)
    }
  }
  const feed = feeds.get(id) || {
    id,
    title: 'Podcast',
    description: '',
    author: '',
    link: '',
    image_url: '',
    feed_url: '',
    is_visible: true,
    episode_count: 0,
    created_at: '',
    updated_at: '',
  }
  const native =
    (await request<NativeEpisode[] | null>('/api/plugins/podcasts/episodes', {
      query: { id },
    })) || []
  const progress = await request<
    Record<string, { position_ms: number; completed: boolean }>
  >('/api/plugins/podcasts/progress/batch', {
    method: 'POST',
    body: JSON.stringify({ episode_ids: native.map((e) => String(e.id)) }),
  })
  const episodes: Episode[] = native.map((e) => ({
    id: `${id}:${e.id}`,
    podcast_id: id,
    title: e.title,
    description: e.description || '',
    audio_url: e.enclosureUrl,
    image_url: e.image || e.feedImage || feed.image_url,
    duration: e.duration || 0,
    published_at: new Date((e.datePublished || 0) * 1000).toISOString(),
    created_at: '',
    updated_at: '',
    playback: progress[String(e.id)]
      ? [
          {
            progress: progress[String(e.id)].position_ms / 1000,
            completed: progress[String(e.id)].completed,
          },
        ]
      : [],
  }))
  if (p.order_by === 'title')
    episodes.sort((a, b) => a.title.localeCompare(b.title))
  else episodes.sort((a, b) => b.published_at.localeCompare(a.published_at))
  if (p.sort === 'asc') episodes.reverse()
  return {
    podcast: { ...feed, episode_count: episodes.length },
    episodes: paginate(episodes, p),
  }
}
async function create(body: { feed_url: string }): Promise<Podcast | null>
async function create(body: { feed_urls: string[] }): Promise<Podcast[] | null>
async function create(body: {
  feed_url?: string
  feed_urls?: string[]
}): Promise<Podcast | Podcast[] | null> {
  const urls = body.feed_urls || [body.feed_url!]
  const result: Podcast[] = []
  for (const url of urls) {
    const known = [...feeds.values()].find((f) => f.feed_url === url)
    if (!known)
      throw new Error(
        'Find the podcast using Supernova search before subscribing.',
      )
    await request('/api/plugins/podcasts/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        feed_id: known.id,
        feed_url: known.feed_url,
        title: known.title,
        image_url: known.image_url,
      }),
    })
    result.push(known)
  }
  return body.feed_urls ? result : result[0]
}
async function unfollow(id: string) {
  try {
    await request('/api/plugins/podcasts/subscriptions', {
      method: 'DELETE',
      query: { feed_id: id },
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unsubscribe failed',
    }
  }
}
async function getEpisode(id: string): Promise<EpisodeWithPodcast | null> {
  const split = id.indexOf(':')
  if (split < 0) throw new Error('Invalid Supernova episode reference')
  const p = await getOne(id.slice(0, split), { per_page: 10000 })
  const e = p.episodes.data.find((e) => e.id === id)
  return e ? { ...e, podcast: p.podcast } : null
}
async function getLatest(): Promise<Episode[]> {
  const subscriptions = (await getAll({ per_page: 10000 })).data
  const episodes: Episode[] = []
  for (let i = 0; i < subscriptions.length; i += 4) {
    const batch = await Promise.all(
      subscriptions.slice(i, i + 4).map((p) => getOne(p.id, { per_page: 5 })),
    )
    episodes.push(...batch.flatMap((p) => p.episodes.data))
  }
  return episodes
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, 50)
}
async function searchEpisodes(
  id: string,
  p: SearchEpisodesParams,
): Promise<Episodes> {
  const data = await getOne(id, { per_page: 10000 })
  const q = p.query.toLocaleLowerCase()
  return paginate(
    data.episodes.data.filter((e) =>
      (e.title + ' ' + e.description).toLocaleLowerCase().includes(q),
    ),
    p,
  )
}
async function saveEpisodeProgress(
  id: string,
  progress: number,
  completed = false,
): Promise<Playback> {
  const nativeID = id.slice(id.indexOf(':') + 1)
  await request('/api/plugins/podcasts/progress', {
    method: 'POST',
    body: JSON.stringify({
      episode_id: nativeID,
      position_ms: Math.max(0, Math.round(progress * 1000)),
      completed,
    }),
  })
  return { progress, completed }
}
export const podcasts = {
  search,
  getAll,
  getOne,
  create,
  unfollow,
  getEpisode,
  getLatest,
  searchEpisodes,
  saveEpisodeProgress,
}
