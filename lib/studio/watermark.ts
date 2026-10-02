import sharp from "sharp";

// Tiles "BARONQUINN" diagonally across the entire image at low opacity —
// not a single corner stamp, which a crop could just cut out. Sharp has no
// native text support, so the tile is built as an SVG (which it can
// composite directly) and repeated across the full canvas.
export async function applyWatermark(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const { width = 800, height = 800 } = await image.metadata();

  const tileSize = Math.max(180, Math.round(Math.min(width, height) / 5));
  const fontSize = Math.round(tileSize / 7);

  const tile = `
    <svg width="${tileSize}" height="${tileSize}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%" y="50%"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        fill-opacity="0.35"
        stroke="black"
        stroke-opacity="0.2"
        stroke-width="1"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(-30 ${tileSize / 2} ${tileSize / 2})"
      >BARONQUINN</text>
    </svg>
  `;

  const tileBuffer = await sharp(Buffer.from(tile)).png().toBuffer();

  // Composite the same small tile repeated across the full canvas — sharp's
  // "repeat" blend mode on a canvas-sized raw buffer handles the tiling.
  const overlay = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: tileBuffer, tile: true }])
    .png()
    .toBuffer();

  return sharp(buffer).composite([{ input: overlay }]).png().toBuffer();
}
