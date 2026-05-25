export function normalizeInputUrl(input: string): URL {
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(withProtocol);
  url.hash = "";
  if (!url.pathname) url.pathname = "/";
  return url;
}

export function normalizeDiscoveredUrl(input: string, baseUrl: string): string | null {
  try {
    const url = new URL(input, baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return stripTrackingParams(url).toString();
  } catch {
    return null;
  }
}

export function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function stripTrackingParams(url: URL): URL {
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  return url;
}
