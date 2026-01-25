// Custom loader hook to stub PNG imports for Node.js
// This allows the CLI to import source files that import images

export async function load(url, context, nextLoad) {
  if (url.endsWith('.png') || url.endsWith('.gif') || url.endsWith('.jpg')) {
    // Return a stub module for image files
    return {
      shortCircuit: true,
      format: 'module',
      source: `export default '${url}'`
    }
  }
  return nextLoad(url, context)
}
