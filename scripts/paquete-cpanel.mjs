// Crea ../entregables/rns-web-cpanel.zip con el contenido de dist/ listo para subir a public_html
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve('dist')
const outDir = resolve('..', 'entregables')
const zip = resolve(outDir, 'rns-web-cpanel.zip')
if (!existsSync(resolve(dist, '.htaccess'))) throw new Error('Falta dist/.htaccess')
mkdirSync(outDir, { recursive: true })
rmSync(zip, { force: true })
execFileSync('python', ['-c', `
import os, zipfile, sys
dist, zp = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(dist):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, dist).replace(os.sep, '/'))
print('Paquete:', zp)
`, dist, zip], { stdio: 'inherit' })
