/** Every Run yourself image (from the 2D Stickman pack, CC0), by file name without the extension. */
const FILES = import.meta.glob<string>('../assets/run-yourself/*.png', { eager: true, import: 'default' })
const byName = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url]),
)

/** The numbered frames of one animation, in order: `run` → run-01, run-02, … */
function frames(name: string) {
  return Object.keys(byName)
    .filter((key) => new RegExp(`^${name}-\\d+$`).test(key))
    .sort()
    .map((key) => byName[key])
}

/** Stickman animations: frames trimmed to one shared box, the feet at FRAME_FOOT in every one. */
export const SPRITES = {
  idle: frames('idle'),
  run: frames('run'),
  jump: frames('jump'),
  slide: frames('slide'),
  punch: frames('punch'),
  kick: frames('kick'),
  stumble: frames('hit'),
  dead: frames('death'),
  hitEffect: frames('hit-effect'),
}

/** Single images: the obstacles' art and the scenery. */
export const PROPS = {
  rocks: byName.rocks,
  wall: byName.wall,
  ground: byName.ground,
  skyline: byName.skyline,
}

/** Every image, for preloading so the first jump or punch never flashes while it loads. */
export const ALL_IMAGES = Object.values(byName)
