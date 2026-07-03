import sharp from 'sharp'
import { statSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', 'src', 'assets')

const CLANS = ['wolfrin', 'averon', 'crodon', 'viperon']

function kb(p) {
  return (statSync(p).size / 1024).toFixed(1) + 'KB'
}

async function run() {
  for (const clan of CLANS) {
    const src = path.join(ROOT, 'clans', `${clan}.png`)

    const heroOut = path.join(ROOT, 'clans', `${clan}-hero.webp`)
    await sharp(src).resize({ width: 1280 }).webp({ quality: 62 }).toFile(heroOut)

    const iconOut = path.join(ROOT, 'clans', `${clan}-icon.webp`)
    await sharp(src).resize({ width: 160 }).webp({ quality: 82 }).toFile(iconOut)

    console.log(clan, 'hero:', kb(heroOut), 'icon:', kb(iconOut))
  }

  const logoSrc = path.join(ROOT, 'logo.png')
  const logoOut = path.join(ROOT, 'logo.webp')
  await sharp(logoSrc).resize({ width: 400 }).webp({ quality: 90 }).toFile(logoOut)
  console.log('logo:', kb(logoOut))
}

run().catch(e => { console.error(e); process.exit(1) })
