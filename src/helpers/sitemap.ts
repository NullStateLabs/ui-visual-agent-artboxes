/**
 * Fetch /sitemap.xml from the app and return all URL paths.
 * Used by the chaos runner when no explicit routes are configured.
 */

export async function discoverRoutes(baseUrl: string): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`;

  let xml: string;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return ["/"];
    xml = await res.text();
  } catch {
    console.warn(`sitemap: could not fetch ${url}, falling back to ["/"]`);
    return ["/"];
  }

  // Extract <loc>…</loc> entries and convert absolute URLs to paths
  const paths = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/gi))
    .map((m) => {
      try {
        return new URL(m[1].trim()).pathname;
      } catch {
        return null;
      }
    })
    .filter((p): p is string => p !== null && p.length > 0);

  return paths.length > 0 ? paths : ["/"];
}
