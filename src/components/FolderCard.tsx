import { Link } from 'react-router-dom'
import { AlignLeft } from '@untitledui/icons/AlignLeft'
import { Calendar } from '@untitledui/icons/Calendar'
import { Link01 } from '@untitledui/icons/Link01'
import Avatar from './Avatar'
import { assetUrl } from '../lib/api'
import { formatDate, whenLabel } from '../lib/dates'
import { profilePath } from '../lib/people'
import { focusRing, hoverLift } from '../lib/ui'
import type { CardTile, Collection, Person } from '../lib/collectionSchemas'

// Left, right, left, right — the shape a hand of cards settles into. Every tile
// after the first is pulled left by a slice of its own width so they overlap
// like a fan rather than sitting side by side.
const FAN_TILT = [-5, 4, -3, 5]

/** The tile's resting angle: the fan's own tilt, plus a per-collection nudge so
 *  a grid of folders never looks mechanically identical. */
function fanRotation(collectionId: string, index: number): number {
  const tail = Number.parseInt(collectionId.slice(-2), 16)
  const jitter = Number.isNaN(tail) ? 0 : (tail % 3) - 1
  return FAN_TILT[index % FAN_TILT.length] + jitter
}

// The rotation is passed through a custom property rather than an inline
// `rotate`, because the fan straightens on hover and a hover rule cannot beat an
// inline style.
//
// White rather than the subtle fill: with the panel behind the folder gone, the
// fill sits #efefef on a #f2f2f2 canvas — too close to read as anything. The
// cards have to be the lighter thing, which is the one piece of elevation the
// system keeps a shadow for.

// Held apart from TILE so a caller can choose a different one. A shadow and a
// shadow-none in one class list would be decided by the order the stylesheet
// happens to emit them in, not by the order they are written here, so the tile
// is built with one shadow class and never two.
const TILE_SHADOW = 'shadow-lg'

// No padding here: a picture wants the whole tile, and padding over the white
// surface shows as a frame around the photo. The written tiles add their own,
// below, because their text needs the inset.
//
// The hairline is what separates one tile from its neighbour now that the
// padding is gone: at a fan's overlap they sit directly against each other, and
// without an edge a pale photo and a white canvas read as one shape. Tailwind
// has no xs/sm border width, so 1px is as thin as it goes — border-inactive
// rather than a palette grey, so it follows the theme.
const TILE =
  'h-[130px] w-[30%] shrink-0 overflow-hidden rounded-control bg-surface text-left ' +
  'rotate-(--fan-rotate) transition-transform duration-200 ease-ios group-hover:rotate-0'

function TileLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-text uppercase">
      {children}
    </span>
  )
}

/**
 * One preview of a collection's contents, fanned. The four kinds keep their own
 * treatment — a picture is a picture, the rest are written on the fill — so a
 * folder reads at a glance as the sort of thing it is holding.
 */
function FanTile({
  tile,
  rotation,
  overlap,
  shadow,
}: {
  tile: CardTile
  rotation: number
  overlap: boolean
  /** The one shadow this tile gets. */
  shadow: string
}) {
  const style = { '--fan-rotate': `${rotation}deg` } as React.CSSProperties
  const shape = `${TILE} ${shadow} ${overlap ? '-ml-[9%]' : ''}`

  if (tile.type === 'image') {
    return (
      <div className={shape} style={style}>
        <img
          src={assetUrl(tile.url)}
          alt=""
          loading="lazy"
          className="size-full rounded-control object-cover"
        />
      </div>
    )
  }

  if (tile.type === 'date') {
    return (
      <div className={`${shape} flex flex-col gap-1 p-2.5`} style={style}>
        <TileLabel>
          <Calendar size={12} strokeWidth={1.75} />
          Date
        </TileLabel>
        <span className="text-[13px] leading-tight font-semibold text-text-h">
          {formatDate(tile.date)}
        </span>
        {tile.daysUntil != null && (
          <span className="text-[11px] text-text">{whenLabel(tile.daysUntil)}</span>
        )}
      </div>
    )
  }

  if (tile.type === 'note') {
    return (
      <div className={`${shape} flex flex-col gap-1 p-2.5`} style={style}>
        <TileLabel>
          <AlignLeft size={12} strokeWidth={1.75} />
          Notes
        </TileLabel>
        <span className="line-clamp-5 text-[11px] leading-tight text-text-h">{tile.text}</span>
      </div>
    )
  }

  return (
    <div className={`${shape} flex flex-col gap-1 p-2.5`} style={style}>
      {tile.image && (
        <img
          src={assetUrl(tile.image)}
          alt=""
          loading="lazy"
          className="h-[44%] w-full rounded-control object-cover"
        />
      )}
      <TileLabel>
        <Link01 size={12} strokeWidth={1.75} />
        Link
      </TileLabel>
      <span className="truncate text-[11px] font-medium text-text-h">
        {tile.title || tile.url}
      </span>
      {tile.siteName && <span className="truncate text-[10px] text-text">{tile.siteName}</span>}
    </div>
  )
}

/**
 * The owner's and collaborators' faces, overlapping. The API describes a person
 * without an email and may have a null username for one whose account is gone,
 * so anyone nameless is dropped rather than drawn as a blank. Each links to that
 * person's profile.
 */
function People({ owner, collaborators }: { owner: Person; collaborators: Person[] }) {
  const everyone = [owner, ...collaborators].filter((person) => person.username)
  if (everyone.length <= 1) return null

  const shown = everyone.slice(0, 3)
  const hidden = everyone.length - shown.length

  return (
    <ul className="flex -space-x-1.5">
      {shown.map((person) => (
        <li key={person.id} className="contents">
          <Link
            to={profilePath(person.username)}
            aria-label={`${person.username}'s profile`}
            className={`rounded-full ${focusRing}`}
          >
            <div className="size-6">
              {/* The ring separates overlapping faces from each other. */}
              <Avatar
                user={{
                  username: person.username as string,
                  firstName: person.firstName,
                  lastName: person.lastName,
                  avatarUrl: person.avatarUrl,
                }}
                ring
              />
            </div>
          </Link>
        </li>
      ))}
      {hidden > 0 && (
        <li className="grid size-6 place-items-center rounded-full bg-fill text-[11px] font-medium text-text ring-2 ring-surface">
          +{hidden}
        </li>
      )}
    </ul>
  )
}

/**
 * A collection as a folder of fanned cards rather than a panel of thumbnails.
 *
 * Nothing here sits on a panel. The fan is the collection, and the words under
 * it are the only annotation — no status, no tags, no controls — so a shelf of
 * these reads as a shelf of folders rather than as a grid of cards. Changing
 * anything about a collection happens on its own page.
 */
export default function FolderCard({
  collection,
  tileShadow = TILE_SHADOW,
}: {
  collection: Collection
  /**
   * The shadow on the fanned tiles, so a caller can pick a quieter one. The
   * collections page is a shelf of these and the wide floating shadow is what
   * separates one folder from the next; the profile sets them in a tighter grid
   * beside other sections, where that shadow is only a rim on every photo.
   */
  tileShadow?: string
}) {
  const { summary } = collection
  const tiles = summary.tiles.slice(0, 4)

  // A folder with nothing photographed in it has no count worth printing.
  const memories =
    summary.imageCount > 0
      ? summary.imageCount === 1
        ? '1 memory'
        : `${summary.imageCount} memories`
      : null

  return (
    <article className="bg-code-bg shadow-md rounded-3xl group flex h-full flex-col items-center gap-2 px-2 py-3">
            <header className="mt-auto flex items-center self-end justify-center gap-2">
        <People owner={collection.owner} collaborators={collection.collaborators} />
      </header>
      <div className="flex h-[156px] w-full items-center justify-center px-1">
        {tiles.length > 0 ? (
          tiles.map((tile, index) => (
            <FanTile
              key={`${tile.type}-${index}`}
              tile={tile}
              rotation={fanRotation(collection.id, index)}
              overlap={index > 0}
              shadow={tileShadow}
            />
          ))
        ) : (
          <div
            className={`flex h-[130px] w-[30%] items-center justify-center rounded-control bg-surface text-[12px] text-text ${tileShadow}`}
          >
            Empty
          </div>
        )}
      </div>

      <h3 className="min-w-0 text-[16px] font-semibold tracking-heading">
        <Link
          to={`/collections/${collection.id}`}
          className={`block truncate text-text-h no-underline ${focusRing} ${hoverLift}`}
        >
          {collection.title || 'Untitled collection'}
        </Link>
      </h3>

{/* The line is reserved whether or not there is anything to put on it. The
          fan and everything under it is pushed to the bottom of the card, so a
          folder that has a count is a whole line taller than one that has
          nothing to say — and every line above it rides up by that line, landing
          the titles on a shelf of folders at as many different heights. An empty
          block has no line box in it at all, so the space has to be asked for
          here rather than left to the text. */}
      <p className="min-h-5 text-[13px] leading-5 text-text">
        {summary.collectionDate && <>{formatDate(summary.collectionDate)}</>}
        {summary.collectionDate && memories && ' · '}
        {memories}
      </p>


    </article>
  )
}