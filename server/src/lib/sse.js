/**
 * Server-Sent Events, which is all this needs.
 *
 * The old setup ran socket.io for one server-to-client message with no reply
 * path, which meant a websocket upgrade, a fallback transport and a client
 * library for what is really a text stream. EventSource is built into every
 * browser, reconnects by itself, and survives a proxy that only speaks HTTP.
 */

/** Proxies love to buffer streams, and a buffered stream is a broken one. */
const HEARTBEAT = 25_000

export function openStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  const send = (event, data) => {
    if (res.writableEnded) return
    res.write(`event: ${event}\ndata: ${JSON.stringify(data ?? null)}\n\n`)
  }

  /**
   * Write a frame whose body was serialised elsewhere.
   *
   * For a broadcast, the same payload goes to every listener, and building it
   * once beats building it once per socket.
   */
  const sendRaw = (event, json) => {
    if (res.writableEnded) return
    res.write(`event: ${event}\ndata: ${json}\n\n`)
  }

  // A comment line is a valid no-op frame. It keeps the connection warm without
  // the client having to know it happened.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n')
  }, HEARTBEAT)
  heartbeat.unref?.()

  const close = (fn) => {
    req.on('close', () => {
      clearInterval(heartbeat)
      fn?.()
      if (!res.writableEnded) res.end()
    })
  }

  return { send, sendRaw, close }
}
