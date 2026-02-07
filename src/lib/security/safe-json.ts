/**
 * Safely stringify JSON for injection into HTML <script> contexts.
 *
 * Primary threat: `</script>` substring (or `<` generally) breaking out of the tag.
 * Mitigation: escape `<` (and friends) to unicode escapes.
 */
export function safeJsonStringifyForHtmlScript(data: unknown): string {
  // JSON.stringify can return undefined for `undefined` / functions; normalize to `null`.
  const json = JSON.stringify(data) ?? 'null';

  // Prevent closing the script tag or starting HTML tags.
  // Common hardening: escape `<`, `>`, and `&`.
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
