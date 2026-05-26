import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import robotsParser from "robots-parser";
import type { CrawlResult, JsonValue, PageData, SiteAsset } from "@openvisi/core";
import {
  isSameOrigin,
  normalizeDiscoveredUrl,
  normalizeInputUrl,
  stripTrailingSlash
} from "./url.js";
export * from "./diagnostics.js";
export * from "./extractors.js";
export * from "./snapshotAdapter.js";
export * from "./structureTrustInputs.js";

export interface CrawlOptions {
  maxPages?: number;
  respectRobots?: boolean;
  userAgent?: string;
  delayMs?: number;
  timeoutMs?: number;
}

interface FetchResult {
  url: string;
  statusCode: number;
  contentType: string | null;
  body: string;
}

const defaultUserAgent = "OpenVisiBot/0.1 (+https://github.com/openvisi/openvisi)";
const keyPagePatterns = [
  /\/about\b/i,
  /\/contact\b/i,
  /\/services?\b/i,
  /\/products?\b/i,
  /\/solutions?\b/i,
  /\/pricing\b/i,
  /\/faq\b/i,
  /\/help\b/i,
  /\/docs?\b/i,
  /\/courses?\b/i
];

export async function crawlSite(
  inputUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const normalized = normalizeInputUrl(inputUrl);
  const maxPages = options.maxPages ?? 30;
  const respectRobots = options.respectRobots ?? true;
  const userAgent = options.userAgent ?? defaultUserAgent;
  const delayMs = options.delayMs ?? 250;
  const timeoutMs = options.timeoutMs ?? 10000;

  const robotsTxt = await fetchAsset(new URL("/robots.txt", normalized.origin).toString(), {
    userAgent,
    timeoutMs
  });
  const robots = robotsTxt.bodyPreview
    ? robotsParser(robotsTxt.url, robotsTxt.bodyPreview)
    : robotsParser(robotsTxt.url, "");

  const sitemapXml = await fetchAsset(new URL("/sitemap.xml", normalized.origin).toString(), {
    userAgent,
    timeoutMs
  });
  const llmsTxt = await fetchAsset(new URL("/llms.txt", normalized.origin).toString(), {
    userAgent,
    timeoutMs
  });

  const crawlResult: CrawlResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
    origin: normalized.origin,
    domain: normalized.hostname.replace(/^www\./, ""),
    crawledAt: new Date().toISOString(),
    maxPages,
    respectRobots,
    assets: {
      robotsTxt,
      sitemapXml,
      llmsTxt
    },
    pages: [],
    skippedUrls: []
  };

  const queue = buildInitialQueue(normalized.toString(), sitemapXml.bodyPreview);
  const seen = new Set<string>();

  while (queue.length > 0 && crawlResult.pages.length < maxPages) {
    const nextUrl = queue.shift();
    if (!nextUrl || seen.has(nextUrl)) continue;
    seen.add(nextUrl);

    if (!isSameOrigin(nextUrl, normalized.origin)) {
      crawlResult.skippedUrls.push({ url: nextUrl, reason: "external-origin" });
      continue;
    }

    const allowed = !respectRobots || robots.isAllowed(nextUrl, userAgent) !== false;
    if (!allowed) {
      crawlResult.skippedUrls.push({ url: nextUrl, reason: "blocked-by-robots" });
      continue;
    }

    const page = await fetchPage(nextUrl, {
      discoveredFrom: nextUrl === normalized.toString() ? "homepage" : "discovery",
      userAgent,
      timeoutMs
    });
    crawlResult.pages.push(page);

    for (const link of prioritizeInternalLinks(page.internalLinks)) {
      if (crawlResult.pages.length + queue.length >= maxPages) break;
      if (!seen.has(link) && isSameOrigin(link, normalized.origin)) queue.push(link);
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  return crawlResult;
}

function buildInitialQueue(homepageUrl: string, sitemapBody: string | null): string[] {
  const homepage = new URL(homepageUrl);
  const seeds = new Set<string>([
    homepage.toString(),
    new URL("/about", homepage.origin).toString(),
    new URL("/about-us", homepage.origin).toString(),
    new URL("/contact", homepage.origin).toString(),
    new URL("/services", homepage.origin).toString(),
    new URL("/products", homepage.origin).toString(),
    new URL("/faq", homepage.origin).toString()
  ]);

  for (const sitemapUrl of extractSitemapUrls(sitemapBody).slice(0, 50)) {
    if (isSameOrigin(sitemapUrl, homepage.origin)) seeds.add(sitemapUrl);
  }

  return [...seeds];
}

function extractSitemapUrls(sitemapBody: string | null): string[] {
  if (!sitemapBody) return [];
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true
    });
    const parsed = parser.parse(sitemapBody) as unknown;
    return collectLocValues(parsed).filter((url) => /^https?:\/\//i.test(url));
  } catch {
    return [];
  }
}

function collectLocValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectLocValues(item));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const ownLoc = typeof record.loc === "string" ? [record.loc] : [];
    return ownLoc.concat(Object.values(record).flatMap((item) => collectLocValues(item)));
  }
  return [];
}

async function fetchAsset(
  url: string,
  options: Pick<Required<CrawlOptions>, "userAgent" | "timeoutMs">
): Promise<SiteAsset> {
  try {
    const result = await fetchText(url, options);
    const found = result.statusCode >= 200 && result.statusCode < 300;
    return {
      url,
      statusCode: result.statusCode,
      found,
      contentType: result.contentType,
      bodyPreview: found ? result.body.slice(0, 200000) : null,
      error: found ? null : `HTTP ${result.statusCode}`
    };
  } catch (error) {
    return {
      url,
      statusCode: null,
      found: false,
      contentType: null,
      bodyPreview: null,
      error: error instanceof Error ? error.message : "Unknown fetch error"
    };
  }
}

async function fetchPage(
  url: string,
  options: Pick<Required<CrawlOptions>, "userAgent" | "timeoutMs"> & { discoveredFrom: string }
): Promise<PageData> {
  try {
    const result = await fetchText(url, options);
    if (!result.contentType?.includes("text/html")) {
      return emptyPage(url, result.statusCode, options.discoveredFrom, "Non-HTML response");
    }

    const $ = cheerio.load(result.body);
    $("script, style, noscript, svg").remove();

    const internalLinks = new Set<string>();
    const externalLinks = new Set<string>();
    $("a[href]").each((_, element) => {
      const rawHref = $(element).attr("href");
      if (!rawHref) return;
      const normalized = normalizeDiscoveredUrl(rawHref, url);
      if (!normalized) return;
      if (isSameOrigin(normalized, new URL(url).origin)) internalLinks.add(normalized);
      else externalLinks.add(normalized);
    });

    return {
      url,
      statusCode: result.statusCode,
      title: textOrNull($("title").first().text()),
      metaDescription: attrOrNull($, "meta[name='description']", "content"),
      h1: collectText($, "h1"),
      h2: collectText($, "h2"),
      h3: collectText($, "h3"),
      canonical: attrOrNull($, "link[rel='canonical']", "href"),
      openGraph: collectOpenGraph($),
      schemaJsonLd: collectJsonLd($),
      visibleText: normalizeWhitespace($("body").text()).slice(0, 200000),
      imageCount: $("img").length,
      internalLinks: [...internalLinks],
      externalLinks: [...externalLinks],
      discoveredFrom: options.discoveredFrom,
      error: null
    };
  } catch (error) {
    return emptyPage(
      url,
      0,
      options.discoveredFrom,
      error instanceof Error ? error.message : "Unknown page fetch error"
    );
  }
}

async function fetchText(
  url: string,
  options: Pick<Required<CrawlOptions>, "userAgent" | "timeoutMs">
): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "user-agent": options.userAgent,
      accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(options.timeoutMs)
  });
  const body = await response.text();
  return {
    url: response.url,
    statusCode: response.status,
    contentType: response.headers.get("content-type"),
    body
  };
}

function emptyPage(
  url: string,
  statusCode: number,
  discoveredFrom: string,
  error: string
): PageData {
  return {
    url,
    statusCode,
    title: null,
    metaDescription: null,
    h1: [],
    h2: [],
    h3: [],
    canonical: null,
    openGraph: {},
    schemaJsonLd: [],
    visibleText: "",
    imageCount: 0,
    internalLinks: [],
    externalLinks: [],
    discoveredFrom,
    error
  };
}

function collectText($: cheerio.CheerioAPI, selector: string): string[] {
  return $(selector)
    .map((_, element) => normalizeWhitespace($(element).text()))
    .get()
    .filter((value) => value.length > 0)
    .slice(0, 20);
}

function collectOpenGraph($: cheerio.CheerioAPI): Record<string, string> {
  const openGraph: Record<string, string> = {};
  $("meta[property^='og:']").each((_, element) => {
    const property = $(element).attr("property");
    const content = $(element).attr("content");
    if (property && content) openGraph[property] = content;
  });
  return openGraph;
}

function collectJsonLd($: cheerio.CheerioAPI): JsonValue[] {
  const items: JsonValue[] = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isJsonValue(parsed)) items.push(parsed);
    } catch {
      // Invalid JSON-LD is ignored for the crawl artifact; analyzer phases can surface it later.
    }
  });
  return items;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  if (["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item));
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every((item) => isJsonValue(item));
  }
  return false;
}

function attrOrNull($: cheerio.CheerioAPI, selector: string, attr: string): string | null {
  const value = $(selector).first().attr(attr);
  return value ? normalizeWhitespace(value) : null;
}

function textOrNull(value: string): string | null {
  const normalized = normalizeWhitespace(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function prioritizeInternalLinks(links: string[]): string[] {
  return [...new Set(links)]
    .filter((link) => !/\.(pdf|png|jpe?g|gif|webp|svg|zip|mp4|mov)$/i.test(new URL(link).pathname))
    .sort((a, b) => linkPriority(b) - linkPriority(a))
    .map(stripTrailingSlash);
}

function linkPriority(url: string): number {
  return keyPagePatterns.some((pattern) => pattern.test(new URL(url).pathname)) ? 2 : 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
