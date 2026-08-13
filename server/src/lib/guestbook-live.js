const subscribers = new Set()

export function subscribeToGuestbook(send) {
  subscribers.add(send)
  return () => subscribers.delete(send)
}

export function publishGuestbook(change) {
  for (const send of subscribers) {
    try {
      send(change)
    } catch {
      // The SSE route owns dead-socket cleanup.
    }
  }
}
