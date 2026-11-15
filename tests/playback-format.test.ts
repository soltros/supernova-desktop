import { expect, it } from 'vitest'
import { ensureSupportForAlac } from '@/utils/alac'
it('preserves directly supported music without forcing transcoding', () => {
  for (const format of ['mp3', 'flac', 'wav', 'ogg', 'opus'])
    expect(ensureSupportForAlac(format)).toBeUndefined()
  expect(ensureSupportForAlac('m4a')).toBe('opus')
  expect(ensureSupportForAlac('WMA')).toBe('opus')
})
