import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src       = resolve(__dirname, '../public/punch/icons/logo-mark.png')
const iconDir   = resolve(__dirname, '../public/punch/icons')
const iosDir    = resolve(__dirname, '../public/punch/icons/ios')
const androidDir= resolve(__dirname, '../public/punch/icons/android')

if (!existsSync(iosDir))     mkdirSync(iosDir,     { recursive: true })
if (!existsSync(androidDir)) mkdirSync(androidDir, { recursive: true })

// The source logo-mark has content touching ALL four edges (0px padding on every side).
// Extend each side proportionally before any resize so nothing gets clipped.
// Horizontal needs more room (right leaf + left stem both flush).
const paddedSrcBuf = await sharp(src)
  .extend({
    top:    22,   // top bud flush
    bottom: 22,   // bottom of @ flush
    left:   22,   // left of @ stem flush
    right:  50,   // right leaf flush — extra room for the wider bottom leaf
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer()

// Render helper — pads evenly onto a solid background
async function render(size, dest, { pad = 0.14, bg = { r: 255, g: 255, b: 255, alpha: 1 } } = {}) {
  const logoSize = Math.round(size * (1 - pad * 2))
  const half     = Math.round(size * pad)

  await sharp(paddedSrcBuf)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: half, bottom: half, left: half, right: half, background: bg })
    .flatten({ background: bg })
    .resize(size, size)
    .png()
    .toFile(dest)

  console.log(`✓  ${dest.replace(resolve(__dirname, '..'), '')}`)
}

async function renderGreen(size, dest) {
  return render(size, dest, { pad: 0.20, bg: { r: 22, g: 163, b: 74, alpha: 1 } })
}

// ── PWA ────────────────────────────────────────────────────────────────────
await render(192, `${iconDir}/icon-192.png`)
await render(512, `${iconDir}/icon-512.png`)
await render(512, `${iconDir}/maskable-512.png`, { pad: 0.28 })  // extra safe-zone padding

// ── iOS (white bg, no rounding — iOS clips to squircle itself) ─────────────
const iosSizes = [
  // iPhone notifications / settings
  { px: 40,  name: 'Icon-20@2x.png'      },
  { px: 60,  name: 'Icon-20@3x.png'      },
  { px: 58,  name: 'Icon-29@2x.png'      },
  { px: 87,  name: 'Icon-29@3x.png'      },
  { px: 80,  name: 'Icon-40@2x.png'      },
  { px: 120, name: 'Icon-40@3x.png'      },
  // iPhone home screen
  { px: 120, name: 'Icon-60@2x.png'      },
  { px: 180, name: 'Icon-60@3x.png'      },
  // iPad
  { px: 20,  name: 'Icon-20.png'         },
  { px: 40,  name: 'Icon-ipad-20@2x.png' },
  { px: 29,  name: 'Icon-29.png'         },
  { px: 58,  name: 'Icon-ipad-29@2x.png' },
  { px: 40,  name: 'Icon-40.png'         },
  { px: 80,  name: 'Icon-ipad-40@2x.png' },
  { px: 76,  name: 'Icon-76.png'         },
  { px: 152, name: 'Icon-76@2x.png'      },
  { px: 167, name: 'Icon-83.5@2x.png'    },
  // App Store
  { px: 1024,name: 'Icon-1024.png'       },
  // PWA apple-touch-icon
  { px: 180, name: 'apple-touch-icon-180.png' },
  { px: 152, name: 'apple-touch-icon-152.png' },
  { px: 120, name: 'apple-touch-icon-120.png' },
]

for (const { px, name } of iosSizes) {
  await render(px, `${iosDir}/${name}`)
}

// ── Android ────────────────────────────────────────────────────────────────
const androidDpi = [
  { size: 48,  dir: 'mdpi'    },
  { size: 72,  dir: 'hdpi'    },
  { size: 96,  dir: 'xhdpi'   },
  { size: 144, dir: 'xxhdpi'  },
  { size: 192, dir: 'xxxhdpi' },
]

for (const { size, dir } of androidDpi) {
  const d = `${androidDir}/mipmap-${dir}`
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  await render(size, `${d}/ic_launcher.png`)
  await renderGreen(size, `${d}/ic_launcher_foreground.png`)
}
await render(512, `${androidDir}/ic_launcher-playstore.png`)

console.log('\n✅  All icons generated.')
console.log('   PWA    → public/punch/icons/{icon-192,icon-512,maskable-512}.png')
console.log('   iOS    → public/punch/icons/ios/')
console.log('   Android→ public/punch/icons/android/')
