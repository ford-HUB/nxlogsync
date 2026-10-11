export interface Release {
  /** The version without the tag's leading `v`, e.g. `1.0.1`. */
  version: string
  /** The release title on GitHub; empty when only the tag was given. */
  name: string
  /** The description written when publishing, as GitHub markdown. */
  body: string
  publishedAt: string
  prerelease: boolean
}
