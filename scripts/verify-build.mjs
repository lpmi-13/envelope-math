import { access, readdir, readFile } from 'node:fs/promises'

const outputDirectory = new URL('../dist/', import.meta.url)
const assetDirectory = new URL('assets/', outputDirectory)
const hashedAssetName = /-[A-Za-z0-9_-]{8,}\.[^.]+$/

const assetNames = await readdir(assetDirectory)
if (assetNames.length === 0) {
  throw new Error('Production build emitted no files under dist/assets.')
}

const unhashedAssets = assetNames.filter((name) => !hashedAssetName.test(name))
if (unhashedAssets.length > 0) {
  throw new Error(`Production assets are missing content hashes: ${unhashedAssets.join(', ')}`)
}

const html = await readFile(new URL('index.html', outputDirectory), 'utf8')
const referencedAssets = [...html.matchAll(/(?:src|href)="\/(assets\/[^"?#]+)"/g)]
  .map((match) => match[1])

if (referencedAssets.length === 0) {
  throw new Error('dist/index.html does not reference any compiled assets.')
}

for (const assetPath of referencedAssets) {
  if (!hashedAssetName.test(assetPath)) {
    throw new Error(`HTML references an asset without a content hash: ${assetPath}`)
  }
  await access(new URL(assetPath, outputDirectory))
}

console.log(`Verified ${assetNames.length} content-hashed production assets.`)
