import * as cheerio from "cheerio";

export interface ExtractedHtmlSnapshotFields {
  title?: string;
  textContent: string;
  meta: Record<string, string>;
  jsonLd: unknown[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
  };
}

export function extractHtmlSnapshotFields(html: string, sourceUrl: string): ExtractedHtmlSnapshotFields {
  const $ = cheerio.load(html);
  const title = normalizeWhitespace($("title").first().text());
  const meta = collectMeta($);
  const canonical = $("link[rel='canonical']").first().attr("href");

  if (canonical) {
    meta.canonical = normalizeWhitespace(canonical);
  }

  const links = collectLinks($, sourceUrl);
  const jsonLd = collectJsonLd($);
  $("script, style, noscript, svg").remove();

  return {
    ...(title ? { title } : {}),
    textContent: normalizeWhitespace($("body").text()),
    meta,
    jsonLd,
    headings: {
      h1: collectText($, "h1"),
      h2: collectText($, "h2"),
      h3: collectText($, "h3")
    },
    links
  };
}

function collectMeta($: cheerio.CheerioAPI): Record<string, string> {
  const meta: Record<string, string> = {};

  $("meta").each((_, element) => {
    const key =
      $(element).attr("name") ??
      $(element).attr("property") ??
      $(element).attr("itemprop") ??
      $(element).attr("http-equiv");
    const content = $(element).attr("content");

    if (key && content) {
      meta[normalizeWhitespace(key)] = normalizeWhitespace(content);
    }
  });

  return meta;
}

function collectLinks($: cheerio.CheerioAPI, sourceUrl: string): ExtractedHtmlSnapshotFields["links"] {
  const internal = new Set<string>();
  const external = new Set<string>();
  const origin = safeOrigin(sourceUrl);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const normalized = normalizeUrl(href, sourceUrl);
    if (!normalized) return;
    if (origin && safeOrigin(normalized) === origin) internal.add(normalized);
    else external.add(normalized);
  });

  return {
    internal: [...internal],
    external: [...external]
  };
}

function collectText($: cheerio.CheerioAPI, selector: string): string[] {
  return $(selector)
    .map((_, element) => normalizeWhitespace($(element).text()))
    .get()
    .filter((value) => value.length > 0);
}

function collectJsonLd($: cheerio.CheerioAPI): unknown[] {
  const items: unknown[] = [];

  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).text();
    if (!raw.trim()) return;
    try {
      items.push(JSON.parse(raw) as unknown);
    } catch {
      // Invalid JSON-LD is ignored by the snapshot extractor.
    }
  });

  return items;
}

function normalizeUrl(href: string | undefined, sourceUrl: string): string | null {
  if (!href) return null;
  try {
    const normalized = new URL(href, sourceUrl);
    if (!/^https?:$/i.test(normalized.protocol)) return null;
    normalized.hash = "";
    return normalized.toString();
  } catch {
    return null;
  }
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
