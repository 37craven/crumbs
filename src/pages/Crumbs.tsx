import CrumbCanvas from '../components/CrumbCanvas'

// No uploads yet, so every square is a placeholder. Pass crumbs={[{ id, imageUrl }]} to fill them in.
export default function Crumbs() {
  return (
    <section className="space-y-6">
      <h1 className="px-6 text-4xl font-heading text-text-h">Crumbs</h1>
      <CrumbCanvas />
    </section>
  )
}