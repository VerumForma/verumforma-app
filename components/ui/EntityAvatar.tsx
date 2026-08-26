'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera } from 'lucide-react'

function initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') }

export default function EntityAvatar({ name, photo, canEdit, pathPrefix, onSaved }: { name: string; photo: string | null; canEdit: boolean; pathPrefix: string; onSaved: (url: string) => Promise<void> }) {
  const supabase = createClient()
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${pathPrefix}-${Date.now()}.${ext}`
    const up = await supabase.storage.from('avatars').upload(path, f, { contentType: f.type })
    if (up.error) { setBusy(false); e.target.value = ''; alert('Erro no upload: ' + up.error.message); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await onSaved(data.publicUrl)
    setBusy(false); e.target.value = ''
  }

  return (
    <div className="relative w-14 h-14 shrink-0 group">
      <span className="w-14 h-14 rounded-full bg-[rgba(26,26,26,0.06)] flex items-center justify-center text-lg font-medium text-[var(--muted)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initials(name)}
      </span>
      {canEdit && (
        <>
          <button onClick={() => ref.current?.click()} disabled={busy} className="absolute inset-0 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Mudar foto"><Camera size={18} /></button>
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </>
      )}
    </div>
  )
}
