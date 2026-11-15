import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { supernova } from '@/service/supernova'
import { usePlaylists } from '@/store/playlists.store'
import { queryKeys } from '@/utils/queryKeys'
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'playlist.form.validations.nameLength' }),
})
type Values = z.infer<typeof schema>
export function CreatePlaylistDialog() {
  const { t } = useTranslation()
  const { playlistDialogState, setPlaylistDialogState } = usePlaylists()
  const queryClient = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })
  useEffect(() => {
    if (playlistDialogState) form.reset({ name: '' })
  }, [playlistDialogState, form])
  const mutation = useMutation({
    mutationFn: ({ name }: Values) => supernova.playlists.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.playlist.all] })
      toast.success(t('playlist.form.create.toast.success'))
      setPlaylistDialogState(false)
    },
    onError: (error) =>
      toast.error(error.message || t('playlist.form.edit.toast.error')),
  })
  return (
    <Dialog open={playlistDialogState} onOpenChange={setPlaylistDialogState}>
      <DialogContent className="max-w-[500px]" aria-describedby={undefined}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <DialogHeader>
              <DialogTitle>{t('playlist.form.create.title')}</DialogTitle>
            </DialogHeader>
            <div className="my-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('playlist.form.labels.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} id="playlist-name" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {t('playlist.form.create.button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
