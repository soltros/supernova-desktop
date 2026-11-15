// Podcast audio is delivered directly by the feed publisher. Metadata, subscriptions,
// and progress use the configured Supernova server through the native services.
export function getProxyURL(url: string) {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol))
    throw new Error('Invalid podcast audio URL')
  return parsed.toString()
}
