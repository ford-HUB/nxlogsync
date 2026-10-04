/**
 * The key a user's rows are stored under: their N-PAX User ID, trimmed and
 * lowercased. N-PAX logins are Active Directory names, which ignore case, so
 * "JDoe" and "jdoe" are the same person and must see the same entries.
 */
export function toUserKey(loginId: string): string {
  return loginId.trim().toLowerCase();
}
