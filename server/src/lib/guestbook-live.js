const subscribers = new Set()

export function subscribeToGuestbook(send) {
  subscribers.add(send)
  return () => subscribers.delete(send)
}

/**
 * Tell every open canvas what changed.
 *
 * Serialised once rather than once per listener. The old shape handed each
 * subscriber the object and let the stream stringify it, so an image upload
 * with fifty people watching built the same megabyte of JSON fifty times over,
 * on the one thread that is also answering everybody else's requests.
 *
 * The full upload is dropped on the way out for the same reason: nobody needs
 * a photograph pushed at them unprompted, and the marks are small without it.
 * Whoever is looking at that part of the board asks for the picture itself.
 */
export function publishGuestbook(change) {
  if (!subscribers.size) return

  const frame = JSON.stringify(change.action === 'upsert' ? withoutUpload(change) : change)
  for (const send of subscribers) {
    try {
      send(frame)
    } catch {
      // The SSE route owns dead-socket cleanup.
    }
  }
}

function withoutUpload(change) {
  if (!change.item?.src) return change
  const { src, ...item } = change.item
  // The thumbnail stays: it is a couple of kilobytes and it means the mark can
  // be drawn immediately, at low resolution, instead of appearing as a hole.
  return { ...change, item: { ...item, hasUpload: true } }
}
