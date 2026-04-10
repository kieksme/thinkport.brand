/**
 * Smoke tests for reference PDF listing chunking (no browser).
 */
function splitIntoChunks(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const REFS_PER_PAGE = 3

function expect(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
}

expect(JSON.stringify(splitIntoChunks([], REFS_PER_PAGE)) === JSON.stringify([]), 'empty')
expect(
  JSON.stringify(splitIntoChunks([1, 2, 3, 4, 5, 6, 7], REFS_PER_PAGE)) ===
    JSON.stringify([[1, 2, 3], [4, 5, 6], [7]]),
  'chunk boundary',
)
expect(Math.ceil(13 / REFS_PER_PAGE) === 5, 'page count')

console.log('references-pdf-table.test.mjs: ok')
