// Importa una vacante de LinkedIn desde su URL pública. Best-effort:
// LinkedIn bloquea el scraping desde IPs de datacenter (Vercel) y su ToS lo restringe,
// así que puede fallar → siempre queda la captura manual como respaldo. Solo se contacta
// el host linkedin.com (además de ser la feature, evita SSRF a URLs internas).

export interface LinkedInJob {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
}

export type ImportReason = "invalid_url" | "blocked" | "not_found" | "empty" | "fetch_error";
export type ImportResult =
  | { ok: true; job: LinkedInJob }
  | { ok: false; reason: ImportReason; error: string };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function isLinkedInHost(h: string): boolean {
  return h === "linkedin.com" || h.endsWith(".linkedin.com");
}

// La vacante se identifica por un id numérico largo en la ruta o en ?currentJobId=.
function extractJobId(url: URL): string | null {
  const q = url.searchParams.get("currentJobId");
  if (q && /^\d{6,}$/.test(q)) return q;
  const m = url.pathname.match(/jobs\/view\/(?:.*?-)?(\d{6,})/);
  if (m) return m[1];
  const trailing = url.pathname.match(/(\d{6,})\/?$/);
  return trailing ? trailing[1] : null;
}

async function fetchText(target: string, timeoutMs = 9000): Promise<{ status: number; text: string } | null> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
    });
    return { status: res.status, text: await res.text() };
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => safeChar(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => safeChar(parseInt(n, 16)));
}
function safeChar(code: number): string {
  try { return String.fromCodePoint(code); } catch { return ""; }
}

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/\s*(p|div|li|ul|ol|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(withBreaks)
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripInline(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

// Encuentra un objeto JobPosting dentro de un JSON-LD (soporta @graph y arrays).
function findJobPosting(node: unknown): Record<string, any> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) { const f = findJobPosting(n); if (f) return f; }
    return null;
  }
  const obj = node as Record<string, any>;
  const type = obj["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return obj;
  if (obj["@graph"]) return findJobPosting(obj["@graph"]);
  return null;
}

function parseJsonLd(html: string): LinkedInJob | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let data: unknown;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const posting = findJobPosting(data);
    if (!posting) continue;
    const loc = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation;
    const addr = loc?.address;
    const location = addr
      ? [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(", ")
      : undefined;
    return {
      title: posting.title ? stripInline(String(posting.title)) : undefined,
      company: posting.hiringOrganization?.name ? stripInline(String(posting.hiringOrganization.name)) : undefined,
      location: location || undefined,
      description: posting.description ? htmlToText(String(posting.description)) : undefined,
    };
  }
  return null;
}

// og:title de LinkedIn suele venir como "Empresa hiring Puesto in Lugar | LinkedIn".
function parseOgTitle(html: string): { title?: string; company?: string } {
  const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (!m) return {};
  const raw = decodeEntities(m[1]).replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const hm = raw.match(/^(.*?)\s+hiring\s+(.*?)(?:\s+in\s+.*)?$/i);
  if (hm) return { company: hm[1].trim(), title: hm[2].trim() };
  return { title: raw };
}

export async function importLinkedInJob(rawUrl: string): Promise<ImportResult> {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { return { ok: false, reason: "invalid_url", error: "URL inválida" }; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "invalid_url", error: "URL inválida" };
  if (!isLinkedInHost(url.hostname.toLowerCase())) return { ok: false, reason: "invalid_url", error: "Debe ser un link de LinkedIn" };

  const jobId = extractJobId(url);
  const canonical = jobId ? `https://www.linkedin.com/jobs/view/${jobId}` : url.toString();

  const page = await fetchText(canonical);
  if (!page) return { ok: false, reason: "fetch_error", error: "No se pudo contactar a LinkedIn (tiempo agotado)." };
  if (page.status === 999 || page.status === 429 || page.status === 403 || page.status === 451) {
    return { ok: false, reason: "blocked", error: "LinkedIn bloqueó la importación automática." };
  }

  const job: LinkedInJob = parseJsonLd(page.text) ?? {};
  if (!job.title || !job.company) {
    const og = parseOgTitle(page.text);
    job.title = job.title || og.title;
    job.company = job.company || og.company;
  }
  // Respaldo de la descripción por el endpoint público de invitado.
  if (!job.description && jobId) {
    const guest = await fetchText(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`);
    if (guest && guest.status < 400) {
      const txt = htmlToText(guest.text);
      if (txt.length > 40) job.description = txt.slice(0, 8000);
    }
  }

  if (!job.title && !job.description) {
    return { ok: false, reason: "not_found", error: "No se encontró la vacante (puede requerir sesión)." };
  }
  return { ok: true, job };
}
