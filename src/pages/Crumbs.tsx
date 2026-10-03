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
    <section className="flex flex-col gap-6">
      <h1 className="px-6 text-4xl font-heading text-text-h">Crumbs</h1>

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