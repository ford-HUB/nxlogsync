/** The public repo electron-builder publishes to (see electron-builder.json5 `publish`). */
export const RELEASES_REPO = 'ford-HUB/nxlogsync'

/** Published releases only, newest first; drafts never appear to an unauthenticated request. */
export const RELEASES_API_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=30`

export const RELEASES_UNREACHABLE_MESSAGE = "Couldn't load release notes. Check your internet connection and try again."
