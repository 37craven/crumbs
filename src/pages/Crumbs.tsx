import { useEffect, useState } from 'react'
import CrumbCanvas from '../components/CrumbCanvas'
import CrumbUploader from '../components/CrumbUploader'
import CrumbViewer from '../components/CrumbViewer'
import { fetchCrumbs } from '../lib/crumbs'
import type { Crumb } from '../lib/schemas'

export default function Crumbs() {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Crumb | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchCrumbs()
      .then((list) => {
        if (!cancelled) setCrumbs(list)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Could not load your crumbs.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="shrink-0 px-6 text-center">
        <h1>Crumbs</h1>
        <p className="mt-1 text-sm">Drag around to browse. Tap a crumb to open it.</p>
      </header>

      {loadError && (
        <p role="alert" className="px-6 text-accent">
          {loadError}
        </p>
      )}

      {/* Remounted once the crumbs arrive, so the view starts centered on them. */}
      <CrumbCanvas
        key={loaded ? 'loaded' : 'loading'}
        crumbs={crumbs}
        emptyMessage={
          loaded && !loadError ? 'No crumbs yet. Tap the + button to add your first.' : undefined
        }
        onSelect={setSelected}
      />

      <CrumbUploader onUploaded={(crumb) => setCrumbs((current) => [crumb, ...current])} />
      <CrumbViewer crumb={selected} onClose={() => setSelected(null)} />
    </section>
  )
}