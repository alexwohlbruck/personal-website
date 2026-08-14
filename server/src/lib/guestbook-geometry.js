/**
 * Where a mark sits, as a rectangle.
 *
 * Stored beside every row so the canvas can be read a region at a time rather
 * than all at once. Kept deliberately generous: a box that is slightly too big
 * costs one extra row in a query, while one that is too small makes a mark
 * vanish until you happen to scroll past its centre.
 */
export function guestbookItemBounds(item) {
  const box = rawBounds(item)
  if (!item.rotation) return box

  // A rotated mark sweeps outside its upright box. Rather than work out the
  // real corners, take the circle it can never leave.
  const centerX = (box.minX + box.maxX) / 2
  const centerY = (box.minY + box.maxY) / 2
  const reach = Math.hypot(box.maxX - box.minX, box.maxY - box.minY) / 2
  return {
    minX: centerX - reach,
    minY: centerY - reach,
    maxX: centerX + reach,
    maxY: centerY + reach,
  }
}

function rawBounds(item) {
  if (item.kind === 'drawing') {
    const points = Array.isArray(item.points) ? item.points : []
    if (!points.length) return { minX: item.x, minY: item.y, maxX: item.x, maxY: item.y }
    // The stroke is drawn centred on the line, so half of its width hangs off
    // either side of the outermost point.
    const pad = (Number(item.width) || 0) / 2
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
  }

  if (item.kind === 'emoji') {
    // An emoji is drawn from its middle; everything else from its corner.
    const half = (Number(item.size) || 0) / 2
    return { minX: item.x - half, minY: item.y - half, maxX: item.x + half, maxY: item.y + half }
  }

  return {
    minX: item.x,
    minY: item.y,
    maxX: item.x + (Number(item.width) || 0),
    maxY: item.y + (Number(item.height) || 0),
  }
}
