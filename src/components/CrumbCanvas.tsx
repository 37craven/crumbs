import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'

export type Crumb = { id: string; imageUrl?: string }

type Drag = { id: number; x: number; y: number; time: number; vx: number; vy: number }

const NO_CRUMBS: Crumb[] = []

// Measured from the design: square tiles in straight columns, every second column
// sitting a quarter tile lower, with a slightly wider gap between rows than columns.
// The pattern repeats forever, so the canvas has no edges and empty squares are placeholders.
const COLUMN_SHIFT = [0, 0.25]
const BLOCK_COLS = 4
const MIN_SLOTS = 8

function tileFor(width: number) {
  return width > 0 && width < 520 ? 160 : 240
}

function metrics(tile: number) {
  const gapX = Math.round(tile * 0.06)
  const gapY = Math.round(tile * 0.09)
  return {
    gapX,
    gapY,
    stepX: tile + gapX,
    stepY: tile + gapY,
    shift: tile * COLUMN_SHIFT[1],
  }
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

// Where the crumbs themselves go: left to right, row by row, in a block of four columns.
function buildLayout(total: number) {
  const byCell = new Map<string, number>()
  for (let i = 0; i < total; i++) {
    byCell.set(`${i % BLOCK_COLS}:${Math.floor(i / BLOCK_COLS)}`, i)
  }
  return { total, byCell }
}

type Layout = ReturnType<typeof buildLayout>

// Camera position that puts the crumbs in the middle of the viewport.
function homeCamera(layout: Layout, tile: number, view: { w: number; h: number }) {
  const { gapX, gapY, stepX, stepY, shift } = metrics(tile)
  const rows = Math.ceil(layout.total / BLOCK_COLS)
  const width = BLOCK_COLS * stepX - gapX
  const height = rows * stepY - gapY + shift
  return { x: (view.w - width) / 2, y: (view.h - height) / 2 }
}

export default function CrumbCanvas({ crumbs = NO_CRUMBS }: { crumbs?: Crumb[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const frame = useRef(0)
  const centered = useRef(false)
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [view, setView] = useState({ w: 0, h: 0 })

  const layout = useMemo(() => buildLayout(Math.max(crumbs.length, MIN_SLOTS)), [crumbs.length])
  const tile = tileFor(view.w)
  const { stepX, stepY, shift } = metrics(tile)

  // Only the squares near the viewport are drawn. The group is anchored to a whole cell,
  // so panning only moves one element until the view crosses into the next cell.
  const col0 = Math.floor(-camera.x / stepX) - 1
  const row0 = Math.floor(-camera.y / stepY) - 1
  const cols = Math.ceil(view.w / stepX) + 3
  const rows = Math.ceil(view.h / stepY) + 3

  const tiles = useMemo(() => {
    const items: ReactNode[] = []
    for (let c = col0; c < col0 + cols; c++) {
      const drop = mod(c, COLUMN_SHIFT.length) === 0 ? 0 : shift
      for (let r = row0; r < row0 + rows; r++) {
        const index = layout.byCell.get(`${c}:${r}`)
        const crumb = index === undefined ? undefined : crumbs[index]
        items.push(
          <li
            key={`${c}:${r}`}
            aria-hidden={crumb?.imageUrl ? undefined : true}
            className="absolute overflow-hidden bg-border"
            style={{
              left: (c - col0) * stepX,
              top: drop + (r - row0) * stepY,
              width: tile,
              height: tile,
            }}
          >
            {crumb?.imageUrl && (
              <img
                src={crumb.imageUrl}
                alt="Crumb"
                draggable={false}
                className="size-full object-cover"
              />
            )}
          </li>,
        )
      }
    }
    return items
  }, [col0, row0, cols, rows, stepX, stepY, shift, tile, layout, crumbs])

  const panBy = useCallback((dx: number, dy: number) => {
    setCamera((current) => ({ x: current.x + dx, y: current.y + dy }))
  }, [])

  const stopGlide = useCallback(() => cancelAnimationFrame(frame.current), [])

  const glide = useCallback(
    (startX: number, startY: number) => {
      let vx = startX
      let vy = startY
      let last = performance.now()

      const tick = (now: number) => {
        const dt = Math.min(32, now - last)
        last = now
        panBy(vx * dt, vy * dt)
        const decay = Math.pow(0.94, dt / 16)
        vx *= decay
        vy *= decay
        if (Math.hypot(vx, vy) > 0.02) {
          frame.current = requestAnimationFrame(tick)
        }
      }
      frame.current = requestAnimationFrame(tick)
    },
    [panBy],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const observer = new ResizeObserver(() => {
      const next = { w: viewport.clientWidth, h: viewport.clientHeight }
      setView(next)
      if (!centered.current) {
        centered.current = true
        setCamera(homeCamera(layout, tileFor(next.w), next))
      }
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [layout])

  // The canvas is as wide as the browser window, which includes the scrollbar's width.
  // Clipping the page sideways stops that sliver from creating a horizontal scrollbar.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('overflow-x-clip')
    return () => root.classList.remove('overflow-x-clip')
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    // Native listener: React's onWheel is passive and cannot stop the page from scrolling.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      event.preventDefault()
      stopGlide()
      const unit = event.deltaMode === 1 ? 16 : 1
      panBy(-event.deltaX * unit, -event.deltaY * unit)
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [panBy, stopGlide])

  useEffect(() => stopGlide, [stopGlide])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    stopGlide()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      vx: 0,
      vy: 0,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return

    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    const dt = Math.max(1, event.timeStamp - current.time)
    panBy(dx, dy)

    current.vx = 0.7 * current.vx + 0.3 * (dx / dt)
    current.vy = 0.7 * current.vy + 0.3 * (dy / dt)
    current.x = event.clientX
    current.y = event.clientY
    current.time = event.timeStamp
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stillMoving = event.timeStamp - current.time < 80
    if (!reduceMotion && stillMoving && Math.hypot(current.vx, current.vy) > 0.05) {
      glide(current.vx, current.vy)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home') {
      event.preventDefault()
      stopGlide()
      setCamera(homeCamera(layout, tile, view))
      return
    }

    const distance = event.shiftKey ? 300 : 100
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [distance, 0],
      ArrowRight: [-distance, 0],
      ArrowUp: [0, distance],
      ArrowDown: [0, -distance],
    }
    const move = moves[event.key]
    if (!move) return

    event.preventDefault()
    stopGlide()
    panBy(move[0], move[1])
  }

  return (
    <div className="space-y-3">
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <div
          ref={viewportRef}
          role="region"
          aria-label="Crumbs canvas"
          aria-describedby="crumb-canvas-hint"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="relative h-[75dvh] min-h-80 w-full cursor-grab touch-none overflow-hidden border-y border-border select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:cursor-grabbing"
        >
          <ul
            className="absolute top-0 left-0 will-change-transform"
            style={{
              transform: `translate3d(${camera.x + col0 * stepX}px, ${camera.y + row0 * stepY}px, 0)`,
            }}
          >
            {tiles}
          </ul>
        </div>
      </div>

      <p id="crumb-canvas-hint" className="px-6 text-sm text-text">
        Drag to move around. Arrow keys work too, and Home goes back to the start.
      </p>
    </div>
  )
}