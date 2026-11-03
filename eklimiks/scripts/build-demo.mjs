/**
 * Собирает автономное демо: одна HTML-страница со встроенными JS, CSS и шрифтами
 * плюс папка img/ с фотографиями техники.
 *
 * Результат — `../demo/index.html`, который открывается двойным щелчком
 * (file://), без сервера, сборки и интернета.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const dist = join(root, 'dist')
const demo = resolve(root, '..', 'demo')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Сначала выполните `pnpm build` — папка dist/ не найдена.')
  process.exit(1)
}

let html = readFileSync(join(dist, 'index.html'), 'utf8')
let css = readFileSync(join(dist, 'app.css'), 'utf8')
let js = readFileSync(join(dist, 'app.js'), 'utf8')

/* ── шрифты: превращаем файлы в data-URI, чтобы CSS был автономным ── */
let inlined = 0
css = css.replace(/url\((['"]?)(\.{0,2}\/?(?:fonts\/)?[^)'"]+\.woff2)\1\)/g, (m, q, rel) => {
  const candidates = [
    join(dist, rel),
    join(dist, 'fonts', rel.replace(/^\.?\/?(fonts\/)?/, '')),
    join(dist, rel.replace(/^\.\//, '')),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      inlined++
      return `url(data:font/woff2;base64,${readFileSync(p).toString('base64')})`
    }
  }
  console.warn('  ! шрифт не найден:', rel)
  return m
})
console.log(`  шрифтов встроено: ${inlined}`)

/* ── собираем одну страницу ── */
/* замены делаем функциями: в минифицированном JS встречаются $& и $' ,
   которые в строковой замене трактуются как спец-шаблоны */
const safeJs = js.replace(/<\/script/gi, () => '<\\/script')
html = html
  /* тег из <head> убираем: inline-скрипт без type="module" выполнился бы
     до разбора DOM, поэтому вставляем его в конце <body> */
  .replace(/<script[^>]*src="\.?\/?app\.js"[^>]*><\/script>/i, () => '')
  .replace(/<link[^>]*href="\.?\/?app\.css"[^>]*>/i, () => `<style>\n${css}\n</style>`)
  .replace('</body>', () => `<script>\n${safeJs}\n</script>\n  </body>`)
  .replace('<body>', () => '<!-- EKlimiks — автономное демо. Открывается двойным щелчком, интернет не нужен. -->\n  <body>')

if (/<script[^>]*src="\.?\/?app\.js"/i.test(html) || /<link[^>]*href="\.?\/?app\.css"/i.test(html)) {
  console.error('Не удалось встроить ресурсы — проверьте шаблон dist/index.html')
  process.exit(1)
}

/* ── пишем демо ── */
if (existsSync(demo)) rmSync(demo, { recursive: true, force: true })
mkdirSync(demo, { recursive: true })
writeFileSync(join(demo, 'index.html'), html, 'utf8')
cpSync(join(dist, 'img'), join(demo, 'img'), { recursive: true })

const kb = (n) => (n / 1024).toFixed(0) + ' KB'
console.log(`\n  demo/index.html   ${kb(Buffer.byteLength(html))}`)
console.log(`  demo/img/         95 фото техники`)
console.log(`\nГотово: ${join(demo, 'index.html')}`)
