import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { ExternalFavoriteButton } from '@/app/components/external-favorite-button'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { radios } from '@/service/radios'
import { usePlayerActions } from '@/store/player.store'
import type { Radio } from '@/types/responses/radios'
import { queryKeys } from '@/utils/queryKeys'

export function StationSearch({ saved }: { saved: Radio[] }) {
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [filter, setFilter] = useState({ name: '', country: '', offset: 0 })
  const client = useQueryClient()
  const { setPlayRadio } = usePlayerActions()
  const results = useQuery({
    queryKey: ['radio-browser', filter],
    queryFn: () => radios.search(filter.name, filter.country, filter.offset),
    enabled: Boolean(filter.name || filter.country),
  })
  const subscribe = useMutation({
    mutationFn: radios.subscribe,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: [queryKeys.radio.all] }),
    onError: (error) => toast.error(error.message),
  })

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Find internet radio stations</h2>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          setFilter({ name: name.trim(), country: country.trim(), offset: 0 })
        }}
      >
        <Input
          aria-label="Station name"
          placeholder="Station name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-36 flex-1 text-base"
        />
        <Input
          aria-label="Country"
          placeholder="Country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="min-w-28 flex-1 text-base"
        />
        <Button type="submit" disabled={!name.trim() && !country.trim()}>
          Search
        </Button>
      </form>
      {results.isFetching && <p role="status">Searching stations…</p>}
      {results.isError && <p role="alert">{results.error.message}</p>}
      {results.data?.length === 0 && <p>No playable stations found.</p>}
      {results.data && (
        <ul className="divide-y rounded-xl border">
          {results.data.map((station) => (
            <li
              key={station.id}
              className="flex flex-wrap items-center gap-2 p-2"
            >
              <div className="min-w-32 flex-1">
                <div className="break-words font-medium">{station.name}</div>
                <div className="text-sm text-muted-foreground">
                  {station.country}
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setPlayRadio([station], 0)}
              >
                Play
              </Button>
              <Button
                variant="outline"
                disabled={
                  subscribe.isPending ||
                  saved.some(({ id }) => id === station.id)
                }
                onClick={() => subscribe.mutate(station)}
              >
                {saved.some(({ id }) => id === station.id) ? 'Saved' : 'Save'}
              </Button>
              <ExternalFavoriteButton
                id={station.id}
                kind="radio"
                metadata={{
                  stationuuid: station.id,
                  name: station.name,
                  url_resolved: station.streamUrl,
                  country: station.country,
                }}
              />
            </li>
          ))}
        </ul>
      )}
      {(filter.offset > 0 || (results.data?.length ?? 0) >= 20) && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={results.isFetching || !filter.offset}
            onClick={() => setFilter({ ...filter, offset: filter.offset - 20 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={results.isFetching || (results.data?.length ?? 0) < 20}
            onClick={() => setFilter({ ...filter, offset: filter.offset + 20 })}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  )
}
