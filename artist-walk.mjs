// ══ ARTIST WALK — the TattooArtist.world directory intake (2026-11-20) ══════════════════════════
// Its own small worker so it never touches aura-core. Same pattern as the parlor crawl's Workflow:
// one step per batch, deterministic step names, retries, one bad page never ends the run, a progress
// line in KV, and the run chains itself into a fresh instance so it can go for hours unattended.
//
// WHAT IT DOES NOT DO (on purpose): no Browser Run, no AI, no vision, no picture classification.
// Both directories serve their profile pages fully in plain HTML, so a plain fetch reads everything.
// Pictures are kept as LINKS ONLY, max 20 per artist - no bytes fetched, no copies.
//
// HOW IT IS DRIVEN (no public URL, nothing to sign in to):
//   1. write the job as plain words to KV key  artistwalk:job
//        one <profile url> [dry]        read one profile (dry = write nothing)
//        tw all | tw us [test]          TattoosWizard: list every profile, then read them all
//        pm all | pm us [test]          Permanent Markings: the same
//        tw read | pm read              read whatever is listed and not yet read
//        shops test | shops all         artists + their work from the shops already crawled (R2 + D1 only)
//        status                         counts per source, from D1
//      several jobs can be given at once, separated by ;
//   2. npx wrangler workflows trigger artist-walk
//   3. read KV  artistwalk:last  (results of one/status)  or  artistwalk:progress:tw / :pm
//   Stop everything: put KV  artistwalk:stop  (any value). Delete it, then "tw read" to resume.
//
// MANNERS: our own honest name as the user agent. robots.txt is read at the start of every run and
// honoured (TattoosWizard asks for 1 second between requests; we leave 1.1s, one request at a time
// per site). A 429 waits and tries once more; a second one, a 403 or a challenge page STOPS that
// site's run and says so. Nothing is ever worked around.

import { WorkflowEntrypoint } from "cloudflare:workers";

const BUILD = "artist-walk-v8-2026-11-21-neotrad-tattoonow";
const UA = "AuraArtistWalk/1.0 (+https://tattooartist.world)";
const UA_TOKEN = "auraartistwalk";
const GAP_MS = 1100;
const PER_STEP = 20;          // requests per step
const STEPS_PER_RUN = 8;      // steps per instance, then a fresh instance (keeps every invocation small)
const MAX_IMAGES = 20;
const PM_PLACEHOLDER = "0b642e19-ea5b-4a5a-117b-5686d9825a00";

const SOURCES = {
  tw: { name: "tattooswizard", base: "https://tattooswizard.com", advertised: "21,000+ (stated on the site)",
        paths: ["/locations/", "/artists/"] },
  pm: { name: "permanentmarkings", base: "https://permanentmarkings.com", advertised: "15,000+ (stated on the site; its country pages add up to 15,783)",
        paths: ["/artists/", "/artistProfile/"] },
  // Inkjin (2026-11-20): robots "Allow: /". Every country, city and city-style page from its own
  // sitemap; each lists artists as /en/artists/<handle>/. Profile = handle, city, country, Instagram,
  // the styles in the page title and the portfolio pictures. No pagination - one page per area.
  ij: { name: "inkjin", base: "https://inkjin.com", advertised: "5,419 (stated on the site)",
        paths: ["/en/tattoo-artists/", "/en/artists/"] },
  // Tattoo Atlas (2026-11-20): robots "Allow: /". 272 hand-picked artists in its sitemap,
  // /<style>/artist/<handle>/ - full name, Instagram, city, region, country, pictures.
  ta: { name: "tattooatlas", base: "https://tattooatlas.org", advertised: "272 (its sitemap)",
        paths: ["/sitemap.xml", "/anime/artist/"] },
  // NeoTrad Atlas (2026-11-21): Tattoo Atlas's sister site, robots "Allow: /" (only /split/ is off).
  // 1,088 artists at /artist/<handle>/ in /sitemap-0.xml. Person JSON-LD + ImageObjects with a
  // description of each piece; work pictures at /artists/posts/<handle>/N.jpg.
  nt: { name: "neotradatlas", base: "https://neotradatlas.com", advertised: "1,088 (its sitemap)",
        paths: ["/sitemap-0.xml", "/artist/"] },
  // TattooNOW (2026-11-21): robots allows all but /api/ and admin. 2,013 artists in
  // /sitemap-artists.xml at /tattoo-artists/<slug>~<uuid>. Person JSON-LD carries name, styles
  // (knowsAbout), Instagram and the studio they work for; their own pictures sit under
  // images.tattoonow.com/tenants/<slug> or /tenants/ig-<slug> - every other tenant on the page is
  // a sidebar feed of other shops' work and is never taken.
  tn: { name: "tattoonow", base: "https://tattoonow.com", advertised: "2,013 (its artist sitemap)",
        paths: ["/sitemap-artists.xml", "/tattoo-artists/"] },
};
const SRC_OF_NAME = { tattooswizard: "tw", tw: "tw", permanentmarkings: "pm", pm: "pm", inkjin: "ij", ij: "ij", tattooatlas: "ta", ta: "ta",
  neotradatlas: "nt", nt: "nt", tattoonow: "tn", tn: "tn" };

// Link services and social sites are never "the artist's own website" for matching duplicates.
const NOT_OWN_SITE = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|youtube\.com|youtu\.be|pinterest\.com|twitter\.com|x\.com|linktr\.ee|instabio\.cc|beacons\.ai|linkin\.bio|lnk\.bio|bio\.link|taplink\.cc|campsite\.bio|carrd\.co|booksy\.com|vagaro\.com|square\.site|squareup\.com|calendly\.com|acuityscheduling\.com|tattoodo\.com|tattooswizard\.com|permanentmarkings\.com|inkjin\.com|tattooatlas\.org|neotradatlas\.com|tattoonow\.com|google\.com|goo\.gl|wa\.me|whatsapp\.com|threads\.net|snapchat\.com|etsy\.com)$/i;

class Blocked extends Error {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
const clean = (s) => (s == null ? null : String(s).replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim() || null);
const nameKey = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : null);
const igHandle = (u) => {
  const m = String(u || "").match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  const h = m ? m[1] : (/^@?[A-Za-z0-9_.]{2,30}$/.test(String(u || "").trim()) ? String(u).trim() : "");
  const x = h.replace(/^@/, "").replace(/\.+$/, "").toLowerCase();
  return x && !/^(p|reel|reels|explore|stories|accounts)$/.test(x) ? x : null;
};
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return null; } };
const stripUtm = (u) => { try { const x = new URL(String(u).replace(/&amp;/g, "&")); [...x.searchParams.keys()].filter((k) => /^utm_/i.test(k)).forEach((k) => x.searchParams.delete(k)); return x.toString(); } catch { return u; } };

// ── fetching, politely ─────────────────────────────────────────────────────────────────────────
async function getPage(url, ms = 25000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let r;
    try {
      r = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html,application/xml;q=0.9,*/*;q=0.8" },
                             redirect: "follow", signal: AbortSignal.timeout(ms) });
    } catch (e) { return { status: 0, text: "", error: String(e?.message ?? e).slice(0, 120) }; }
    if (r.status === 429) {
      if (attempt === 0) { await sleep(15000 + Math.floor(Math.random() * 10000)); continue; }
      throw new Blocked("429 twice at " + url);
    }
    let text = "";
    try {
      const buf = await r.arrayBuffer();
      const u8 = new Uint8Array(buf);
      if (u8[0] === 0x1f && u8[1] === 0x8b) {
        text = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
      } else text = new TextDecoder().decode(buf);
    } catch {}
    if (r.status === 403 || /<title>\s*Just a moment|cf-chl-|challenge-platform/i.test(text.slice(0, 4000)))
      throw new Blocked("refused (" + r.status + ") at " + url);
    return { status: r.status, text: r.ok ? text : "" };
  }
}

// ── robots.txt ─────────────────────────────────────────────────────────────────────────────────
function robotsVerdict(txt, paths) {
  const groups = []; let cur = null, lastWasAgent = false;
  for (const raw of String(txt || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!lastWasAgent || !cur) { cur = { agents: [], allow: [], disallow: [], delay: null }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false; if (!cur) continue;
    if (k === "disallow" && v) cur.disallow.push(v);
    else if (k === "allow" && v) cur.allow.push(v);
    else if (k === "crawl-delay") cur.delay = Number(v) || null;
  }
  const g = groups.find((x) => x.agents.some((a) => a !== "*" && UA_TOKEN.includes(a))) || groups.find((x) => x.agents.includes("*")) || { allow: [], disallow: [], delay: null };
  const blocked = paths.filter((p) => {
    const d = g.disallow.filter((r) => p.startsWith(r)).sort((a, b) => b.length - a.length)[0];
    if (!d) return false;
    const a = g.allow.filter((r) => p.startsWith(r)).sort((x, y) => y.length - x.length)[0];
    return !(a && a.length >= d.length);
  });
  return { ok: blocked.length === 0, blocked, delay: g.delay };
}

// ── reading one profile ────────────────────────────────────────────────────────────────────────
function ldNodes(h) {
  const out = [];
  for (const m of h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); for (const x of [].concat(j)) { if (x && x["@graph"]) out.push(...x["@graph"]); else if (x) out.push(x); } } catch {}
  }
  return out;
}
function socialsFrom(links) {
  const s = { facebook: null, tiktok: null, youtube: null, pinterest: null, x: null, other: [] };
  for (const u of links) {
    const h = hostOf(u) || "";
    if (/facebook\.com|fb\.com/.test(h)) s.facebook ||= u;
    else if (/tiktok\.com/.test(h)) s.tiktok ||= u;
    else if (/youtube\.com|youtu\.be/.test(h)) s.youtube ||= u;
    else if (/pinterest\./.test(h)) s.pinterest ||= u;
    else if (/^(twitter\.com|x\.com)$/.test(h)) s.x ||= u;
    else if (!/instagram\.com/.test(h)) s.other.push(u);
  }
  s.other = [...new Set(s.other)].slice(0, 10);
  return s;
}

function parseTW(h, url) {
  const g = ldNodes(h);
  const p = g.find((x) => x.jobTitle) || g.find((x) => /Person|TattooParlor|LocalBusiness|Organization/.test(String(x["@type"]))) || {};
  const page = g.find((x) => x["@type"] === "ProfilePage") || {};
  const gal = g.find((x) => x["@type"] === "ImageGallery") || {};
  if (!p.name) return null;
  const contact = {};
  for (const m of h.matchAll(/ap-contact__lbl">([^<]+)<\/span>\s*<a[^>]*?href="([^"]+)"[^>]*>([^<]*)</g))
    contact[m[1].trim().toLowerCase()] = { href: stripUtm(m[2]), text: clean(m[3]) };
  const loc = p.workLocation?.address || p.address || {};
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const website = contact.website?.href || sameAs.find((u) => !/instagram\.com/i.test(u)) || null;
  const images = [...new Set(h.match(/https:\/\/cdn\.tattooswizard\.com\/artists\/[a-f0-9]+\/tattoos\/[a-f0-9]+/g) || [])]
    .slice(0, MAX_IMAGES).map((u) => ({ url: u, style: null, source: "tattooswizard", page: url }));
  const kind = /studio|parlou?r|shop/i.test(String(p.jobTitle || "")) ? "studio" : "artist";
  const extra = {};
  for (const [k, v] of Object.entries(contact)) if (!["instagram", "website", "phone", "email"].includes(k)) extra[k] = v.href;
  return {
    kind, name: clean(p.name), alias: clean(p.alternateName), bio: clean(page.description || p.description),
    city: clean(loc.addressLocality), region: clean(loc.addressRegion), country: clean(loc.addressCountry),
    studio_text: null,
    styles: [].concat(p.knowsAbout || []).map(clean).filter(Boolean),
    instagram: igHandle(contact.instagram?.href) || igHandle(sameAs.find((u) => /instagram\.com/i.test(u))),
    website, website_host: hostOf(website),
    socials: socialsFrom([...sameAs, ...Object.values(contact).map((c) => c.href)].filter((u) => /^https?:/i.test(u) && u !== website)),
    phone: contact.phone ? contact.phone.href.replace(/^tel:/i, "") : null,
    email: contact.email ? contact.email.href.replace(/^mailto:/i, "") : null,
    booking_url: contact.booking?.href || null,
    images, portfolio_total: Number(gal.numberOfItems) || null,
    on_since: (h.match(/On TattoosWizard since (\d{4})/) || [])[1] || null,
    // A studio's own words often name its artists by Instagram handle ("@wolfslayertattoos, @natelauerman").
    // Kept exactly as written - it is what links studio and artist later, with no guessing.
    understanding: { job_title: p.jobTitle || null, contact_other: Object.keys(extra).length ? extra : undefined,
      handles_named: [...new Set([...String(page.description || "").matchAll(/@([A-Za-z0-9_.]{2,30})/g)].map((m) => m[1].replace(/\.+$/, "").toLowerCase()))].slice(0, 40) },
  };
}

function parsePM(h, url) {
  const g = ldNodes(h);
  const web = g.find((x) => x["@type"] === "WebPage") || {};
  const p = web.about || g.find((x) => /Person|TattooParlor|LocalBusiness/.test(String(x["@type"]))) || {};
  if (!p.name) return null;
  const desc = clean(web.description || p.description) || "";
  const lm = desc.match(/is listed as an? (tattoo [a-z]+)\s+in\s+(.+?)(?:\s+with specialties|\.\s|\.$)/i);
  const parts = lm ? lm[2].split(",").map((x) => x.trim()).filter(Boolean) : [];
  const city = parts.length >= 2 ? parts[0] : null;
  const country = parts.length >= 2 ? parts[parts.length - 1] : (parts[0] || null);
  const region = parts.length >= 3 ? parts[1] : null;
  const kind = /shop|studio|parlou?r/i.test((lm && lm[1]) || "") || /TattooParlor|LocalBusiness/.test(String(p["@type"])) ? "studio" : "artist";
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const ext = [...new Set([...h.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => stripUtm(m[1])))]
    .filter((u) => !/permanentmarkings\.com|imagedelivery\.net|googletagmanager|google-analytics|fonts\.|schema\.org|_next\//i.test(u));
  const links = [...new Set([...sameAs, ...ext])];
  const ig = igHandle(links.find((u) => /instagram\.com/i.test(u)));
  const website = links.find((u) => !/instagram\.com|facebook\.com|tiktok\.com|youtube\.com|pinterest\.|twitter\.com|x\.com/i.test(hostOf(u) || "")) || null;
  const images = [...new Set(h.match(/https:\/\/imagedelivery\.net\/[A-Za-z0-9_-]+\/[a-f0-9-]+\/[A-Za-z0-9]+/g) || [])]
    .filter((u) => !u.includes(PM_PLACEHOLDER)).slice(0, MAX_IMAGES)
    .map((u) => ({ url: u, style: null, source: "permanentmarkings", page: url }));
  return {
    kind, name: clean(p.name), alias: null, bio: desc || null,
    city, region, country, studio_text: null,
    styles: [].concat(p.knowsAbout || []).map(clean).filter(Boolean),
    instagram: ig, website, website_host: hostOf(website),
    socials: socialsFrom(links.filter((u) => u !== website)),
    phone: (h.match(/href="tel:([^"]+)"/) || [])[1] || null,
    email: (h.match(/href="mailto:([^"?]+)/) || [])[1] || null,
    booking_url: null, images, portfolio_total: null,
    on_since: (String(web.dateCreated || "").match(/^\d{4}/) || [])[0] || null,
    understanding: { listed_since: web.dateCreated || null, modified: web.dateModified || null, listed_as: lm ? lm[1] : null },
  };
}

// Inkjin: the person is a handle ("@adamwarmerdam"); styles are written in the page title
// ("@h, american traditional and neo traditional tattoo artist in Los Angeles | Inkjin"); the
// portfolio pictures sit behind Netlify's image resizer as cdn2.inkjin.com/images/portfolio/thumb/
// (full-size files, ~380KB, despite the folder name). /images/artists/ is the avatar - not work.
function parseIJ(h, url) {
  const g = ldNodes(h);
  const p = (g.find((x) => x["@type"] === "ProfilePage") || {}).mainEntity || g.find((x) => x["@type"] === "Person") || {};
  if (!p.name) return null;
  const handle = String(p.name).replace(/^@/, "").trim();
  const title = clean((h.match(/<title>([^<]*)<\/title>/i) || [])[1]) || "";
  const tm = title.match(/,\s*(.+?)\s+tattoo artist in /i);
  const styles = tm ? tm[1].replace(/black and gr([ae])y/gi, "black&gr$1y").split(/\s*,\s*|\s+and\s+/)
    .map((x) => x.replace(/&/g, " and ").trim().toLowerCase()).filter(Boolean) : [];
  const loc = p.address || {};
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const files = [...new Set([...h.matchAll(/images(?:\/|%2F)portfolio(?:\/|%2F)thumb(?:\/|%2F)([A-Za-z0-9_.-]+\.(?:jpe?g|png|webp))/gi)].map((m) => m[1]))];
  const images = files.slice(0, MAX_IMAGES).map((f) => ({ url: "https://cdn2.inkjin.com/images/portfolio/thumb/" + f, style: null, source: "inkjin", page: url }));
  return {
    kind: "artist", name: handle, alias: handle, bio: null,
    city: clean(loc.addressLocality), region: null, country: clean(loc.addressCountry), studio_text: null,
    styles, instagram: igHandle(sameAs.find((u) => /instagram\.com/i.test(u))),
    website: null, website_host: null, socials: socialsFrom(sameAs.filter((u) => !/instagram\.com/i.test(u))),
    phone: null, email: null, booking_url: null, images, portfolio_total: files.length || null, on_since: null,
    understanding: { job_title: p.jobTitle || null, title },
  };
}

// Tattoo Atlas: one Person per page in an @graph; the style is the first part of the address
// (/anime/artist/<handle>/); pictures are /<style>/img/<handle>/<1|s1|p1>.jpg - only this artist's folder,
// never the "more artists" strip under it. knowsAbout is subjects ("Flame Princess"), kept as notes.
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseTA(h, url) {
  const g = ldNodes(h);
  const p = g.find((x) => x["@type"] === "Person") || {};
  if (!p.name) return null;
  const m = String(url).match(/tattooatlas\.org\/([a-z0-9-]+)\/artist\/([^\/?#]+)/i);
  if (!m) return null;
  const style = m[1].replace(/-/g, " ").toLowerCase(), handle = m[2];
  const loc = p.address || {};
  const area = String(clean(p.areaServed?.name) || "").split(",").map((x) => x.trim()).filter(Boolean);
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const re = new RegExp("/" + escRe(m[1]) + "/img/" + escRe(handle) + "/[A-Za-z0-9_-]+\\.(jpe?g|png|webp|avif)", "gi");
  const imgs = [...new Set([...h.matchAll(re)].map((x) => SOURCES.ta.base + x[0]))];
  const images = imgs.slice(0, MAX_IMAGES).map((u) => ({ url: u, style, source: "tattooatlas", page: url }));
  const posts = [...new Set((h.match(/https?:\/\/(?:www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?/g) || []))].slice(0, 20);
  return {
    kind: /studio|shop|parlou?r/i.test(String(p.jobTitle || "")) ? "studio" : "artist",
    name: clean(String(p.name).replace(/^@/, "")), alias: clean(String(p.alternateName || "").replace(/^@/, "")) || handle, bio: null,
    city: clean(loc.addressLocality), country: clean(loc.addressCountry),
    region: area.length >= 2 && area[area.length - 1] !== clean(loc.addressCountry) ? area[area.length - 1] : null,
    studio_text: null, styles: [style], instagram: igHandle(sameAs.find((u) => /instagram\.com/i.test(u))),
    website: null, website_host: null, socials: socialsFrom(sameAs.filter((u) => !/instagram\.com/i.test(u))),
    phone: null, email: null, booking_url: null, images, portfolio_total: imgs.length || null, on_since: null,
    understanding: { job_title: p.jobTitle || null, knows_about: [].concat(p.knowsAbout || []), area_served: p.areaServed?.name || null,
      geo: p.geo ? { lat: p.geo.latitude, lng: p.geo.longitude } : null, instagram_posts: posts },
  };
}

// NeoTrad Atlas: one Person, then an array of ImageObjects each with its own description of the
// piece ("Spotted ocelot ... on thigh with purple stars"). Locality is written "Toronto, Canada".
function parseNT(h, url) {
  const g = ldNodes(h);
  const p = g.find((x) => x["@type"] === "Person") || {};
  if (!p.name) return null;
  const m = String(url).match(/neotradatlas\.com\/artist\/([^\/?#]+)/i);
  if (!m) return null;
  const handle = decodeURIComponent(m[1]);
  const loc = p.address || {};
  const parts = String(clean(loc.addressLocality) || "").split(",").map((x) => x.trim()).filter(Boolean);
  const country = clean(loc.addressCountry) || (parts.length > 1 ? parts[parts.length - 1] : null);
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const objs = g.filter((x) => x["@type"] === "ImageObject" && x.contentUrl);
  const own = (u) => new RegExp("/artists/posts/" + escRe(handle) + "/", "i").test(String(u));
  let imgs = objs.filter((x) => own(x.contentUrl)).map((x) => ({ url: String(x.contentUrl), about: clean(x.description) || null }));
  if (!imgs.length) {
    const re = new RegExp("/artists/posts/" + escRe(handle) + "/[A-Za-z0-9_-]+\\.(jpe?g|png|webp|avif)", "gi");
    imgs = [...new Set([...h.matchAll(re)].map((x) => SOURCES.nt.base + x[0]))].map((u) => ({ url: u, about: null }));
  }
  const seen = new Set(); imgs = imgs.filter((x) => !seen.has(x.url) && seen.add(x.url));
  const styles = [...new Set([].concat(p.knowsAbout || []).map((x) => String(x).toLowerCase().trim()).filter(Boolean))];
  return {
    kind: /studio|shop|parlou?r/i.test(String(p.jobTitle || "")) ? "studio" : "artist",
    name: clean(String(p.name).replace(/^@/, "")), alias: clean(String(p.alternateName || "").replace(/^@/, "")) || handle, bio: null,
    city: parts[0] || null, region: parts.length >= 3 ? parts[1] : null, country,
    studio_text: null, styles: styles.length ? styles : ["neotraditional"],
    instagram: igHandle(sameAs.find((u) => /instagram\.com/i.test(u))),
    website: null, website_host: null, socials: socialsFrom(sameAs.filter((u) => !/instagram\.com/i.test(u))),
    phone: null, email: null, booking_url: null,
    images: imgs.slice(0, MAX_IMAGES).map((x) => ({ url: x.url, style: null, source: "neotradatlas", page: url, about: x.about })),
    portfolio_total: imgs.length || null, on_since: null,
    understanding: { job_title: p.jobTitle || null, area_served: p.areaServed?.name || null,
      geo: p.geo ? { lat: p.geo.latitude, lng: p.geo.longitude } : null,
      pieces: imgs.slice(0, MAX_IMAGES).map((x) => x.about).filter(Boolean) },
  };
}

// TattooNOW: the artist's own pictures are the tenants named for them (slug, or ig-<slug>); the
// page also carries a feed from other shops' tenants on every profile - MEASURED on three
// profiles: the same nine "icons-prodigies" pictures on all three - which is never theirs.
// Pictures are stored without the cdn-cgi resize prefix so one piece is one URL.
function parseTN(h, url) {
  const g = ldNodes(h);
  const p = g.find((x) => x["@type"] === "Person") || {};
  if (!p.name) return null;
  const m = String(url).match(/tattoonow\.com\/tattoo-artists\/([^\/?#~]+)~/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  const sameAs = [].concat(p.sameAs || []).map(stripUtm);
  const raw = [...new Set((h.match(/https:\/\/images\.tattoonow\.com\/tenants\/[^"'\s)]+?\.(?:jpe?g|png|webp)/gi) || []))];
  // A one-person studio is a tenant named for the artist ("david-chaston-tattooer" for
  // david-chaston) - MEASURED: without it his 7 pictures were missed. A studio tenant that is NOT
  // named for them is a shared shop gallery and stays out.
  const shopSlug = String((p.worksFor && p.worksFor.url) || "").split("/tattoo-studio/")[1]?.split(/[/?#]/)[0]?.toLowerCase() || "";
  const allowed = new Set([slug, "ig-" + slug]);
  if (shopSlug && shopSlug.includes(slug)) allowed.add(shopSlug);
  const mine = raw.filter((u) => allowed.has((u.split("/tenants/")[1] || "").split("/")[0].toLowerCase()));
  const styles = [...new Set([].concat(p.knowsAbout || []).map((x) => String(x).toLowerCase().replace(/\s*&\s*/g, " and ").trim()).filter(Boolean))];
  const shop = p.worksFor && p.worksFor.name ? clean(p.worksFor.name) : null;
  return {
    kind: "artist",
    // Names arrive decorated ("♠️David Taute ♠️") - the symbols are stripped, the words kept.
    name: clean(String(p.name).replace(/[^\p{L}\p{N}\s.'-]/gu, " ").replace(/\s+/g, " ").trim()) || clean(p.name),
    alias: igHandle(sameAs.find((u) => /instagram\.com/i.test(u))) || slug, bio: null,
    city: null, region: null, country: null, studio_text: shop, styles,
    instagram: igHandle(sameAs.find((u) => /instagram\.com/i.test(u))),
    website: null, website_host: null, socials: socialsFrom(sameAs.filter((u) => !/instagram\.com/i.test(u))),
    phone: null, email: null, booking_url: null,
    images: mine.slice(0, MAX_IMAGES).map((u) => ({ url: u, style: null, source: "tattoonow", page: url })),
    portfolio_total: mine.length || null, on_since: null,
    understanding: { job_title: p.jobTitle || null, works_for: shop, works_for_url: p.worksFor?.url || null },
  };
}

function sourceOfUrl(u) {
  const h = hostOf(u) || "";
  if (h.endsWith("tattooswizard.com")) { const id = (String(u).match(/\/artists\/([^\/?#]+)/) || [])[1]; return id ? { src: "tw", id } : null; }
  if (h.endsWith("permanentmarkings.com")) { const id = (String(u).match(/\/artistProfile\/([a-f0-9]{24})/) || [])[1]; return id ? { src: "pm", id } : null; }
  if (h.endsWith("inkjin.com")) { const id = (String(u).match(/\/artists\/([^\/?#]+)/) || [])[1]; return id ? { src: "ij", id } : null; }
  if (h.endsWith("neotradatlas.com")) { const id = (String(u).match(/\/artist\/([^\/?#]+)/) || [])[1]; return id ? { src: "nt", id } : null; }
  if (h.endsWith("tattoonow.com")) { const id = (String(u).match(/\/tattoo-artists\/([^\/?#]+)/) || [])[1]; return id ? { src: "tn", id } : null; }
  if (h.endsWith("tattooatlas.org")) { const id = (String(u).match(/tattooatlas\.org\/([a-z0-9-]+\/artist\/[^\/?#]+)/i) || [])[1]; return id ? { src: "ta", id } : null; }
  return null;
}
const profileUrl = (src, id) => ({
  tw: () => SOURCES.tw.base + "/artists/" + id, pm: () => SOURCES.pm.base + "/artistProfile/" + id,
  ij: () => SOURCES.ij.base + "/en/artists/" + id + "/", ta: () => SOURCES.ta.base + "/" + id + "/",
  nt: () => SOURCES.nt.base + "/artist/" + id + "/", tn: () => SOURCES.tn.base + "/tattoo-artists/" + id,
}[src])();
const PARSE = { tw: parseTW, pm: parsePM, ij: parseIJ, ta: parseTA, nt: parseNT, tn: parseTN };

async function readProfile(src, id) {
  const url = profileUrl(src, id);
  const r = await getPage(url);
  if (r.status === 404 || r.status === 410) return { verdict: "not_found", url };
  if (!r.text) return { verdict: "error", url, why: r.error || ("status " + r.status) };
  const rec = PARSE[src](r.text, url);
  if (!rec) return { verdict: "error", url, why: "no name on the page" };
  return { verdict: rec.kind === "studio" ? "studio" : "ok", url, rec };
}

// ── storage ────────────────────────────────────────────────────────────────────────────────────
async function ensureSchema(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS artist_listing (source TEXT NOT NULL, source_id TEXT NOT NULL, profile_url TEXT, list_page TEXT, verdict TEXT, artist_id TEXT, dup_how TEXT, possible_dup TEXT, seen_at TEXT, read_at TEXT, PRIMARY KEY (source, source_id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS cg_artist (id TEXT PRIMARY KEY, kind TEXT, name TEXT, name_key TEXT, alias TEXT, bio TEXT, city TEXT, region TEXT, country TEXT, studio_text TEXT, styles TEXT, instagram TEXT, website TEXT, website_host TEXT, socials TEXT, phone TEXT, email TEXT, booking_url TEXT, images TEXT, image_count INTEGER DEFAULT 0, portfolio_total INTEGER, sources TEXT, understanding TEXT, cg_business_id TEXT, pta_id TEXT, created_at TEXT, updated_at TEXT)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_artist_listing_verdict ON artist_listing (source, verdict)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_cg_artist_ig ON cg_artist (instagram)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_cg_artist_host ON cg_artist (website_host)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_cg_artist_namecity ON cg_artist (name_key, city)"),
  ]);
}

async function upsertListings(db, src, rows, listPage) {
  const t = now(); const name = SOURCES[src].name;
  for (let i = 0; i < rows.length; i += 20) {
    const part = rows.slice(i, i + 20);
    const sql = "INSERT OR IGNORE INTO artist_listing (source, source_id, profile_url, list_page, seen_at) VALUES " + part.map(() => "(?,?,?,?,?)").join(",");
    const args = []; for (const id of part) args.push(name, id, profileUrl(src, id), listPage, t);
    await db.prepare(sql).bind(...args).run();
  }
}

const parseJ = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };

// One canonical artist. Same Instagram -> merge. Same own website -> merge. Same name+city -> NOT
// merged, only flagged. Never merged on a name alone.
async function saveArtist(db, src, id, rec, dry) {
  const name = SOURCES[src].name, t = now();
  const nk = nameKey(rec.name), city = rec.city ? rec.city.toLowerCase() : null;
  const ownHost = rec.website_host && !NOT_OWN_SITE.test(rec.website_host) ? rec.website_host : null;
  const cands = (await db.prepare(
    "SELECT * FROM cg_artist WHERE (instagram = ?1 AND ?1 IS NOT NULL) OR (website_host = ?2 AND ?2 IS NOT NULL) OR (name_key = ?3 AND city = ?4 AND ?3 IS NOT NULL AND ?4 IS NOT NULL) LIMIT 10")
    .bind(rec.instagram || null, ownHost, nk, city).all()).results || [];
  let hit = null, how = null;
  if (rec.instagram) { hit = cands.find((c) => c.instagram === rec.instagram) || null; if (hit) how = "instagram"; }
  if (!hit && ownHost) { hit = cands.find((c) => c.website_host === ownHost) || null; if (hit) how = "website"; }
  // Reading the same listing again refreshes its own record - that is not a duplicate.
  if (hit && parseJ(hit.sources, []).some((s) => s.source === name && s.source_id === id)) how = null;
  const possible = !hit ? (cands.find((c) => c.name_key === nk && c.city === city)?.id || null) : null;
  const srcRef = { source: name, source_id: id, url: profileUrl(src, id), collected_at: t, on_since: rec.on_since || null };

  let row;
  if (hit) {
    const imgs = parseJ(hit.images, []); const seen = new Set(imgs.map((x) => x.url));
    for (const im of rec.images) if (imgs.length < MAX_IMAGES && !seen.has(im.url)) { imgs.push(im); seen.add(im.url); }
    const sources = parseJ(hit.sources, []).filter((s) => !(s.source === name && s.source_id === id)); sources.push(srcRef);
    const styles = [...new Set([...parseJ(hit.styles, []), ...rec.styles].map((s) => String(s).toLowerCase()))].slice(0, 20);
    const soc = parseJ(hit.socials, {}); const ns = rec.socials || {};
    for (const k of ["facebook", "tiktok", "youtube", "pinterest", "x"]) soc[k] ||= ns[k] || null;
    soc.other = [...new Set([...(soc.other || []), ...(ns.other || [])])].slice(0, 10);
    const und = parseJ(hit.understanding, {}); und[name] = rec.understanding;
    row = { ...hit,
      kind: hit.kind || rec.kind, alias: hit.alias || rec.alias, bio: hit.bio || rec.bio,
      city: hit.city || city, region: hit.region || rec.region, country: hit.country || rec.country,
      instagram: hit.instagram || rec.instagram, website: hit.website || rec.website, website_host: hit.website_host || ownHost,
      phone: hit.phone || rec.phone, email: hit.email || rec.email, booking_url: hit.booking_url || rec.booking_url,
      portfolio_total: Math.max(Number(hit.portfolio_total) || 0, Number(rec.portfolio_total) || 0) || null,
      styles: JSON.stringify(styles), socials: JSON.stringify(soc), images: JSON.stringify(imgs), image_count: imgs.length,
      sources: JSON.stringify(sources), understanding: JSON.stringify(und), updated_at: t };
  } else {
    row = { id: "art_" + rid(), kind: rec.kind, name: rec.name, name_key: nk, alias: rec.alias, bio: rec.bio,
      city, region: rec.region, country: rec.country, studio_text: rec.studio_text,
      styles: JSON.stringify(rec.styles.map((s) => String(s).toLowerCase())), instagram: rec.instagram,
      website: rec.website, website_host: ownHost, socials: JSON.stringify(rec.socials || {}),
      phone: rec.phone, email: rec.email, booking_url: rec.booking_url,
      images: JSON.stringify(rec.images), image_count: rec.images.length, portfolio_total: rec.portfolio_total,
      sources: JSON.stringify([srcRef]), understanding: JSON.stringify({ [name]: rec.understanding }),
      cg_business_id: null, pta_id: null, created_at: t, updated_at: t };
  }
  const result = { artist_id: row.id, merged: !!hit, dup_how: how, possible_dup: possible };
  if (dry) return { ...result, would_write: row };

  const cols = ["id", "kind", "name", "name_key", "alias", "bio", "city", "region", "country", "studio_text", "styles", "instagram", "website", "website_host", "socials", "phone", "email", "booking_url", "images", "image_count", "portfolio_total", "sources", "understanding", "cg_business_id", "pta_id", "created_at", "updated_at"];
  await db.batch([
    db.prepare("INSERT OR REPLACE INTO cg_artist (" + cols.join(",") + ") VALUES (" + cols.map(() => "?").join(",") + ")").bind(...cols.map((c) => row[c] ?? null)),
    db.prepare("INSERT INTO artist_listing (source, source_id, profile_url, seen_at, verdict, artist_id, dup_how, possible_dup, read_at) VALUES (?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT (source, source_id) DO UPDATE SET verdict = excluded.verdict, artist_id = excluded.artist_id, dup_how = excluded.dup_how, possible_dup = excluded.possible_dup, read_at = excluded.read_at")
      .bind(name, id, profileUrl(src, id), t, rec.kind === "studio" ? "studio" : "ok", row.id, how, possible, t),
  ]);
  return result;
}

async function markListing(db, src, id, verdict) {
  await db.prepare("INSERT INTO artist_listing (source, source_id, profile_url, seen_at, verdict, read_at) VALUES (?,?,?,?,?,?) " +
    "ON CONFLICT (source, source_id) DO UPDATE SET verdict = excluded.verdict, read_at = excluded.read_at")
    .bind(SOURCES[src].name, id, profileUrl(src, id), now(), verdict, now()).run();
}

async function statusOf(db) {
  const out = { build: BUILD, at: now(), sources: {} };
  for (const [k, s] of Object.entries(SOURCES)) {
    const n = s.name;
    const listed = (await db.prepare("SELECT COUNT(*) n FROM artist_listing WHERE source = ?").bind(n).first())?.n || 0;
    const verdicts = Object.fromEntries(((await db.prepare("SELECT COALESCE(verdict,'not_read_yet') v, COUNT(*) n FROM artist_listing WHERE source = ? GROUP BY v").bind(n).all()).results || []).map((r) => [r.v, r.n]));
    const merged = (await db.prepare("SELECT dup_how h, COUNT(*) n FROM artist_listing WHERE source = ? AND dup_how IS NOT NULL GROUP BY h").bind(n).all()).results || [];
    const possible = (await db.prepare("SELECT COUNT(*) n FROM artist_listing WHERE source = ? AND possible_dup IS NOT NULL").bind(n).first())?.n || 0;
    const created = (await db.prepare("SELECT COUNT(*) n FROM artist_listing WHERE source = ? AND verdict IN ('ok','studio') AND dup_how IS NULL").bind(n).first())?.n || 0;
    const pics = await db.prepare("SELECT COUNT(*) a, COALESCE(SUM(image_count),0) i FROM cg_artist WHERE image_count > 0 AND sources LIKE ?").bind('%"source":"' + n + '"%').first();
    out.sources[n] = { advertised: s.advertised, listings_enumerated: listed, profiles_by_verdict: verdicts,
      profiles_read: listed - (verdicts.not_read_yet || 0),
      duplicates_merged: Object.fromEntries(merged.map((r) => [r.h, r.n])), possible_duplicates_flagged: possible,
      new_canonical_records: created, artists_with_images: pics?.a || 0, images_total: pics?.i || 0 };
  }
  const tot = await db.prepare("SELECT COUNT(*) n, SUM(kind='artist') a, SUM(kind='studio') s FROM cg_artist").first();
  out.canonical_total = { all: tot?.n || 0, artists: tot?.a || 0, studios: tot?.s || 0 };
  return out;
}

// ── listing pages ──────────────────────────────────────────────────────────────────────────────
const twSlugs = (h) => [...new Set([...h.matchAll(/href="\/artists\/([^"?#\/]+)"/g)].map((m) => m[1]))];
const pmIds = (h) => [...new Set([...h.matchAll(/artistProfile\/([a-f0-9]{24})/g)].map((m) => m[1]))];
const ijIds = (h) => [...new Set([...h.matchAll(/href="(?:https:\/\/inkjin\.com)?\/en\/artists\/([^"\/?#]+)\/"/g)].map((m) => m[1]))];
const taIds = (h) => [...new Set([...h.matchAll(/tattooatlas\.org\/([a-z0-9-]+\/artist\/[^\/<"]+)\//gi)].map((m) => m[1]))];
const ntIds = (h) => [...new Set([...h.matchAll(/neotradatlas\.com\/artist\/([^\/<"]+)\//gi)].map((m) => m[1]))];
const tnIds = (h) => [...new Set([...h.matchAll(/tattoonow\.com\/tattoo-artists\/([^\/<"?#]+~[0-9a-f-]{36})/gi)].map((m) => m[1]))];
const IDS = { tw: twSlugs, pm: pmIds, ij: ijIds, ta: taIds, nt: ntIds, tn: tnIds };

async function listInit(src, scope, test) {
  if (src === "ij") {
    // Every listing page in Inkjin's artist sitemap: countries, cities, city+style, styles. A city's
    // page may not show everyone, so its style pages are read too; repeats are ignored on insert.
    let areas = ["/en/tattoo-artists/usa/"];
    if (!test) {
      const sm = await getPage(SOURCES.ij.base + "/sitemap-tattoo-artists.xml");
      const all = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => { try { return new URL(m[1]).pathname; } catch { return ""; } })
        .filter((p) => /^\/en\/tattoo-artists\/.+\/$/.test(p) && (scope !== "us" || p.startsWith("/en/tattoo-artists/usa/")));
      areas = [...new Set(["/en/tattoo-artists/usa/", ...all])];
    }
    return { areas, ai: 0, page: 1, prev: [], footer: [], pagesDone: 0, maxPages: 1 };
  }
  if (src === "ta") return { areas: ["/sitemap.xml"], ai: 0, page: 1, prev: [], footer: [], pagesDone: 0, maxPages: 1 };
  if (src === "nt") return { areas: ["/sitemap-0.xml"], ai: 0, page: 1, prev: [], footer: [], pagesDone: 0, maxPages: 1 };
  if (src === "tn") return { areas: ["/sitemap-artists.xml"], ai: 0, page: 1, prev: [], footer: [], pagesDone: 0, maxPages: 1 };
  if (src === "tw") {
    let areas = ["/locations/united-states"];
    if (scope === "all" && !test) {
      const sm = await getPage(SOURCES.tw.base + "/sitemap-locations-en.xml.gz");
      const all = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => { try { return new URL(m[1]).pathname; } catch { return ""; } })
        .filter((p) => /^\/locations\/[^\/]+$/.test(p));
      areas = [...new Set(["/locations/united-states", ...all])];
    }
    await sleep(GAP_MS);
    const far = await getPage(SOURCES.tw.base + "/locations/united-states?page=99999");
    return { areas, ai: 0, page: 1, prev: [], footer: twSlugs(far.text), pagesDone: 0, maxPages: test ? 2 : 5000 };
  }
  let areas = ["/artists/united-states"];
  if (scope === "all" && !test) {
    const h = (await getPage(SOURCES.pm.base + "/artists")).text;
    const m = h.match(/availableCountries\\":\[(.*?)\]/);
    let cs = []; try { cs = JSON.parse("[" + m[1].replace(/\\"/g, '"') + "]"); } catch {}
    areas = [...new Set(["/artists/united-states", ...cs.map((c) => "/artists/" + String(c).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))])];
  }
  return { areas, ai: 0, page: 1, prev: [], footer: [], pagesDone: 0, maxPages: test ? 2 : 5000 };
}

// One step of listing: up to PER_STEP pages. Returns the moved cursor and whether listing is done.
async function listStep(db, src, cur) {
  let found = 0, pages = 0;
  const footer = new Set(cur.footer || []);
  while (pages < PER_STEP && cur.ai < cur.areas.length) {
    const area = cur.areas[cur.ai];
    const url = SOURCES[src].base + area + (cur.page > 1 ? "?page=" + cur.page : "");
    const r = await getPage(url); pages++;
    const ids = IDS[src](r.text);
    if (ids.length) await upsertListings(db, src, ids, url);
    found += ids.length;
    const main = ids.filter((x) => !footer.has(x));
    const same = main.length && main.length === cur.prev.length && main.every((x, i) => x === cur.prev[i]);
    if (!main.length || same || cur.page >= (cur.maxPages || 5000) || (r.status && r.status !== 200)) {
      cur.ai++; cur.page = 1; cur.prev = [];
    } else { cur.page++; cur.prev = main; }
    cur.pagesDone = (cur.pagesDone || 0) + 1;
    await sleep(GAP_MS);
  }
  return { cur, found, pages, done: cur.ai >= cur.areas.length };
}

async function readStep(db, src, limit) {
  const rows = (await db.prepare("SELECT source_id FROM artist_listing WHERE source = ? AND verdict IS NULL ORDER BY rowid LIMIT ?")
    .bind(SOURCES[src].name, Math.min(limit, PER_STEP)).all()).results || [];
  const tally = {}; let last = null;
  for (const { source_id } of rows) {
    let v;
    try {
      const got = await readProfile(src, source_id);
      if (got.rec) { const s = await saveArtist(db, src, source_id, got.rec, false); v = got.verdict + (s.merged ? "_merged" : ""); last = { name: got.rec.name, verdict: v }; }
      else { await markListing(db, src, source_id, got.verdict); v = got.verdict; last = { id: source_id, verdict: v, why: got.why }; }
    } catch (e) {
      if (e instanceof Blocked) throw e;
      v = "error"; try { await markListing(db, src, source_id, "error"); } catch {}
      last = { id: source_id, verdict: "error", why: String(e?.message ?? e).slice(0, 120) };
    }
    tally[v] = (tally[v] || 0) + 1;
    await sleep(GAP_MS);
  }
  return { read: rows.length, tally, last, done: rows.length === 0 };
}

// ══ ARTISTS FROM THE SHOPS WE ALREADY CRAWLED (2026-11-20) ══════════════════════════════════════
// The directories gave names but no work. The parlor crawl already holds the work: when a shop's
// site has a page per artist (Inkus: /meet-the-artist-mel, -joey, -rodney), the card kept a few of
// those pictures tagged with the artist's name and page ("s":"Mel","p":"/meet-the-artist-mel"), and
// the FULL crawl of that page is archived in R2 (crawl/<shop id>/<date>.md). So each artist's work
// is read back from what was already fetched - no new crawling, no requests to anybody's site.
// Picture rules are the parlor crawl's own (copied verbatim from aura-core so the two cannot drift
// in meaning): stock libraries, icons, logos, tiny files, template assets. Plus one: a picture that
// appears on 3+ pages of the same site is the site's furniture, not an artist's tattoo.
// The pictures the card already kept for this artist come first - they passed every parlor rule.
const BUILDER_STOCK = /(images\.squarespace-cdn\.com\/content\/[^/]*\/demo|cdn\.shopify\.com\/s\/files\/[^/]*\/placeholder|unsplash\.com|pexels\.com|pixabay\.com)/i;
const BRAND = /\b(instagram|facebook|twitter|tiktok|youtube|yelp|google[%\s_-]*places|google[%\s_-]*maps|pinterest|snapchat|linkedin|whatsapp|tripadvisor)\b/i;
const CHROME = /logo|icon|sprite|favicon|badge|banner|arrow|button|placeholder|avatar-default|spacer/i;
const NOT_A_PHOTO = /\.svg(\?|$)|^data:|\.ico(\?|$)|\.gif(\?|$)/i;
const TEMPLATE_ASSET = /\/(demo|sample|dummy|stock|template|theme|assets\/img\/default)[-_\/]/i;
const TINY = /[?&/](?:w|width)[_=](\d{1,3})(?:[,&/]|$)/i;
const TINY_FILE = /[_\-\/.](\d{2,4})x(\d{2,4})\.(?:jpe?g|png|gif|webp|avif)(?:\?|$)/i;
const CDN_TRANSFORM = /(static\.wixstatic\.com|images\.squarespace-cdn\.com|cdn\.shopify\.com|images\.unsplash\.com|cdn\.prod\.website-files\.com|i0\.wp\.com|res\.cloudinary\.com)/i;
const STOCK = /images\.unsplash\.com|pexels\.com|pixabay\.com|shutterstock|istockphoto|gettyimages|stock\.adobe/i;
const NOT_WORK = /\.svg(\?|$)|\/static\/|\/icons?\/|\/assets\/icons|payment-methods|\/flags?\//i;
const isTiny = (u) => {
  if (/[,\/_]blur_\d/i.test(u)) return true;
  const f = u.match(TINY_FILE);
  if (f && parseInt(f[1], 10) < 200 && parseInt(f[2], 10) < 200) return true;
  if (CDN_TRANSFORM.test(u)) return false;
  const m = u.match(TINY); if (m && parseInt(m[1], 10) < 200) return true;
  return false;
};
const isChromeUrl = (url, alt) => {
  const u = String(url || ""); const file = (u.split("?")[0].split("/").pop() || "");
  const words = file.replace(/[_+.\-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/%[0-9a-f]{2}/gi, " ");
  const a = String(alt || "");
  return CHROME.test(words) || CHROME.test(a) || BRAND.test(words) || isTiny(u) || NOT_A_PHOTO.test(u) || TEMPLATE_ASSET.test(u) || BUILDER_STOCK.test(u);
};
// A BANNER IS NOT A TATTOO (2026-11-20). MEASURED on Texas Tattoo and Company: a 1920x601 black
// header strip and an Instagram QR code sat among Adam Johnson's tattoos. When the address states the
// picture's size (Wix w_1920,h_601; ?width=&height=; 1920x601.jpg), anything more than twice as wide
// as tall - or as tall as wide - is page furniture. No size stated, no judgement made.
const QR = /(^|[^a-z])qr([^a-z]|$)|qr[-_ ]?code/i;
const isStrip = (u) => {
  const s = String(u || "");
  const m = s.match(/[,\/]w_(\d{2,5}),h_(\d{2,5})/i) || s.match(/[?&]w(?:idth)?=(\d{2,5})&h(?:eight)?=(\d{2,5})/i) || s.match(/[_\-\/.](\d{2,5})x(\d{2,5})\.(?:jpe?g|png|webp|avif)/i);
  if (!m) return false;
  const w = +m[1], h = +m[2]; if (!w || !h) return false;
  return w / h > 2 || h / w > 2;
};
const pathOf = (u) => { const s = String(u || ""); return (s.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0].replace(/\/+$/, "") || "/").toLowerCase(); };
const sha16 = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
const SHOP_SRC = "tattooparlors";
const SHOPS_PER_STEP = 5;   // each artist's own page is now read live too, so fewer shops per step
const INKUS = "6a98cbd6-09c0-465e-9597-aa91ed2de1cf";

async function newestArchive(env, shopId) {
  if (!env.AURA_KNOWLEDGE_RAW) return null;
  const ls = await env.AURA_KNOWLEDGE_RAW.list({ prefix: "crawl/" + shopId + "/" });
  const key = (ls.objects || []).map((o) => o.key).sort().pop();
  if (!key) return null;
  const obj = await env.AURA_KNOWLEDGE_RAW.get(key);
  return obj ? { key, md: await obj.text() } : null;
}

// Every picture on every archived page, in page order, with the page it came from.
function archiveImages(md) {
  const out = []; const blocksOf = new Map();
  const blocks = String(md || "").split(/\n\n---\n\n/);
  for (const b of blocks) {
    const page = (b.match(/<!--PAGE\s+(\S*)\s*-->/) || [])[1] || "";
    const here = new Set();
    const found = [...b.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map((m) => ({ alt: m[1], url: m[2] }))
      .concat([...b.matchAll(/\[[^\]]*!\[([^\]]*)\]\(\s*\)\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => ({ alt: m[1], url: m[2] }))
        .filter((x) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(x.url)));
    for (const f of found) {
      const url = f.url.replace(/[).,]+$/, "");
      if (!/^https?:\/\//i.test(url)) continue;
      out.push({ url, alt: (f.alt || "").trim(), page });
      here.add(url);
    }
    for (const u of here) blocksOf.set(u, (blocksOf.get(u) || 0) + 1);
  }
  return { list: out, blocksOf };
}

// ── who the artist is, in the shop's own words ─────────────────────────────────────────────────
// The artist's own page is often only pictures (Inkus /meet-the-artist-mel: "Mel" and nothing else).
// Their bio usually sits on the shop's roster page, right above the link to their portfolio. So the
// roster block is read for the text between their name and their link. Their own links (an
// Instagram, an email, a booking page) are the ones in that bit or on their own page - never a link
// that appears on 3+ pages of the site, which is the SHOP's footer (Inkus's own Instagram).
// Styles are only the style words actually written there. Nothing is guessed or made up.
const STYLE_WORDS = [
  ["neo-traditional", /\bneo[\s-]?trad(itional)?\b/i], ["traditional", /\b(american\s+)?traditional\b|\bold[\s-]?school\b/i],
  ["japanese", /\bjapanese\b|\birezumi\b/i], ["realism", /\brealism\b|\brealistic\b/i], ["micro realism", /\bmicro[\s-]?realism\b/i],
  ["black and grey", /\bblack[\s-]*(and|&|n)[\s-]*gr[ae]y\b|\bb\s?&\s?g\b/i], ["color", /\bcolou?r\s+(work|realism|tattoos?)\b|\bfull[\s-]colou?r\b/i],
  ["fine line", /\bfine[\s-]?line\b/i], ["blackwork", /\bblack[\s-]?work\b/i], ["dotwork", /\bdot[\s-]?work\b|\bstippl/i],
  ["watercolor", /\bwatercolou?r\b/i], ["new school", /\bnew[\s-]?school\b/i], ["illustrative", /\billustrative\b/i],
  ["geometric", /\bgeometric\b|\bsacred geometry\b/i], ["ornamental", /\bornamental\b|\bmandala/i], ["lettering", /\blettering\b|\bscript\b|\bcalligraph/i],
  ["portraits", /\bportraits?\b/i], ["tribal", /\btribal\b|\bpolynesian\b/i], ["minimalist", /\bminimal(ist)?\b/i],
  ["surrealism", /\bsurreal/i], ["anime", /\banime\b|\bmanga\b/i], ["trash polka", /\btrash[\s-]?polka\b/i], ["chicano", /\bchicano\b/i],
  ["cover-ups", /\bcover[\s-]?ups?\b/i], ["custom", /\bcustom\s+(work|pieces?|designs?|tattoos?)\b/i], ["horror", /\bhorror\b/i], ["floral", /\bfloral\b|\bbotanical\b/i],
];
const stylesIn = (t) => STYLE_WORDS.filter(([, re]) => re.test(t)).map(([n]) => n);
const mdLinks = (t) => [...String(t || "").matchAll(/\[([^\]]*)\]\((\S+?)\)/g)].map((m) => ({ label: m[1], href: m[2].replace(/[).,]+$/, "") }));
const plainText = (t) => String(t || "").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/<!--[\s\S]*?-->/g, " ").replace(/[#*_>`|]+/g, " ").replace(/\s+/g, " ").trim();
const SOCIAL_HOST = /instagram\.com|facebook\.com|tiktok\.com|pinterest\.|youtube\.com|twitter\.com|x\.com|threads\.net/i;
const BOOK_HOST = /booksy|vagaro|squareup|square\.site|calendly|acuity|setmore|fresha|glossgenius|styleseat|tattoodo|bookedin|getbooked/i;
function linkInfo(links) {
  const out = { instagram: null, socials: { facebook: null, tiktok: null, youtube: null, pinterest: null, x: null, other: [] }, email: null, phone: null, booking: null };
  for (const { href } of links) {
    const h = String(href || "");
    if (/^mailto:/i.test(h)) { out.email ||= h.replace(/^mailto:/i, "").split("?")[0]; continue; }
    if (/^tel:/i.test(h)) { out.phone ||= h.replace(/^tel:/i, ""); continue; }
    if (!/^https?:/i.test(h)) continue;
    const host = hostOf(h) || "";
    if (/instagram\.com/.test(host)) { out.instagram ||= igHandle(h); continue; }
    if (/facebook\.com|fb\.com/.test(host)) out.socials.facebook ||= h;
    else if (/tiktok\.com/.test(host)) out.socials.tiktok ||= h;
    else if (/youtube\.com|youtu\.be/.test(host)) out.socials.youtube ||= h;
    else if (/pinterest\./.test(host)) out.socials.pinterest ||= h;
    else if (/^(twitter\.com|x\.com)$/.test(host)) out.socials.x ||= h;
    else if (BOOK_HOST.test(host)) out.booking ||= h;
  }
  return out;
}

async function shopArtists(env, shopId) {
  const db = env.AURA_MEMORY;
  const row = await db.prepare("SELECT * FROM cg_business WHERE id = ?").bind(shopId).first();
  if (!row) return { shop: shopId, error: "NO_SUCH_SHOP", artists: [] };
  const und = parseJ(row.understanding, {});
  const names = (Array.isArray(und.artists) ? und.artists : []).map((x) => String(x).trim()).filter(Boolean);
  const imgs = Array.isArray(und.images) ? und.images : [];
  const nameSet = new Set(names.map((n) => n.toLowerCase()));
  const secs = (Array.isArray(und.sections) ? und.sections : []).map((s) => String(s?.name || "")).filter((n) => nameSet.has(n.toLowerCase()));
  if (!secs.length) return { shop: row.name, id: shopId, artists: [], note: "no pictures saved under an artist's name" };
  const arch = await newestArchive(env, shopId);
  const all = arch ? archiveImages(arch.md) : { list: [], blocksOf: new Map() };
  const site = String(row.website || "").split("|")[0].trim();
  const origin = (() => { try { return new URL(site.startsWith("http") ? site : "https://" + site).origin; } catch { return ""; } })();
  // A picture the card filed under ANOTHER artist is theirs, not this one's.
  const ownerOf = new Map(); for (const im of imgs) if (im?.u && im?.s) ownerOf.set(im.u, String(im.s).toLowerCase());
  // Links on 3+ pages are the site's own (header/footer). The shop's socials are among them.
  const blocks = arch ? arch.md.split(/\n\n---\n\n/).map((b) => ({ page: (b.match(/<!--PAGE\s+(\S*)\s*-->/) || [])[1] || "", body: b })) : [];
  const linkPages = new Map();
  for (const b of blocks) for (const u of new Set(mdLinks(b.body).map((l) => l.href))) linkPages.set(u, (linkPages.get(u) || 0) + 1);
  // The homepage's links count as the site's too - on a two-page site the footer is only seen twice.
  const homeLinks = new Set(blocks.filter((b) => pathOf(b.page) === "/").flatMap((b) => mdLinks(b.body).map((l) => l.href)));
  // A link is the SITE's when it is on 3+ pages (header, footer, menu). The homepage alone is not
  // enough: MEASURED on Bridge Street Tattoo, the saved homepage carried an artist's own Instagram,
  // so "on the homepage" was quietly turning Marley's account into the shop's and dropping it.
  const isSiteLink = (u) => (linkPages.get(u) || 0) >= 3;
  const shopLinks = [...linkPages.keys()].filter((u) => isSiteLink(u));
  const pathsByArtist = new Map();
  for (const n of secs) pathsByArtist.set(n.toLowerCase(), new Set(imgs.filter((im) => String(im?.s || "").toLowerCase() === n.toLowerCase()).map((im) => pathOf(im.p)).filter((p) => p && p !== "/")));
  // The bit of the roster page about one artist: from their name to the link to their own page.
  const rosterBit = (name, paths) => {
    for (const b of blocks) {
      if (paths.has(pathOf(b.page))) continue;
      const links = [...b.body.matchAll(/\[([^\]]*)\]\((\S+?)\)/g)];
      const hit = links.find((m) => paths.has(pathOf(m[2])));
      if (!hit) continue;
      const end = hit.index + hit[0].length;
      const before = b.body.slice(0, hit.index);
      const nameRe = new RegExp("(^|\\n)[#*\\s]*" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[*\\s]*(\\n|$)", "gi");
      let start = -1, m; while ((m = nameRe.exec(before))) start = m.index;
      if (start < 0) {
        // No heading with their name: start after the previous artist's link instead.
        const prev = links.filter((x) => x.index < hit.index && [...pathsByArtist.values()].some((ps) => ps.has(pathOf(x[2])))).pop();
        start = prev ? prev.index + prev[0].length : Math.max(0, hit.index - 1500);
      }
      return b.body.slice(start, end);
    }
    return "";
  };
  const out = [];
  for (const name of secs) {
    const nl = name.toLowerCase();
    const mine = imgs.filter((im) => String(im?.s || "").toLowerCase() === nl && im?.u);
    const paths = new Set(mine.map((im) => pathOf(im.p)).filter((p) => p && p !== "/"));
    const pics = []; const seenU = new Set(), seenF = new Set();
    const take = (url, page, from) => {
      if (pics.length >= MAX_IMAGES || !url || seenU.has(url)) return;
      const file = (url.split("/").pop() || "").split("?")[0];
      if (seenF.has(file)) return;
      seenU.add(url); seenF.add(file);
      pics.push({ url, style: null, source: SHOP_SRC, page: page ? (String(page).startsWith("http") ? page : origin + page) : null, from });
    };
    for (const im of mine) take(im.u, im.p, "card");
    const fromCard = pics.length; let considered = 0, cut = 0;
    if (paths.size) {
      for (const im of all.list) {
        if (pics.length >= MAX_IMAGES) break;
        if (!paths.has(pathOf(im.page))) continue;
        considered++;
        const other = ownerOf.get(im.url);
        if ((other && other !== nl) || STOCK.test(im.url) || NOT_WORK.test(im.url) || isChromeUrl(im.url, im.alt) || (all.blocksOf.get(im.url) || 0) >= 3 || isStrip(im.url) || QR.test(im.url + " " + im.alt)) { cut++; continue; }
        take(im.url, im.page, "archive");
      }
    }
    const page = [...paths][0] ? origin + [...paths][0] : null;
    // A PIERCER IS NOT A TATTOO ARTIST (2026-11-20). Inkus's roster lists Jennifer, and her page is
    // /meet-the-piercer-jennifer - the shop says so itself. Only the shop's own words decide it.
    const piercer = /pierc/i.test(name) || [...paths].some((x) => /pierc/i.test(x));
    const bit = paths.size ? rosterBit(name, paths) : "";
    const ownBlock = blocks.filter((b) => paths.has(pathOf(b.page))).map((b) => b.body).join("\n");
    let bio = plainText(bit).replace(new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b\\s*", "i"), "").replace(/\s*\b(portfolio|view portfolio|see (my|his|her|their) work|book now|learn more)\s*$/i, "").trim();
    if (bio.length < 40) bio = null; else if (bio.length > 1500) bio = bio.slice(0, 1500).replace(/\s+\S*$/, "") + "…";
    // A BIO IS SENTENCES, NOT A MENU (2026-11-20). MEASURED on Maui Tattoo Company: Dave Bobrick's
    // "about" came back as "- SAMANTHA STRAYCAT - ABIGAIL HAMBEK - DAVE BOBRICK" - the site's artist
    // menu. Real bios are lowercase prose with at least one sentence; a list of names or a shouted
    // heading is dropped, and nothing is shown rather than the wrong thing.
    if (bio) {
      const letters = bio.replace(/[^A-Za-z]/g, ""), upper = bio.replace(/[^A-Z]/g, "");
      const others = secs.filter((n) => n.toLowerCase() !== nl && new RegExp("\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(bio)).length;
      const words = bio.split(/\s+/).length;
      if (letters.length && upper.length / letters.length > 0.5) bio = null;
      else if (others >= 2) bio = null;
      else if (words < 10 || !/[a-z]{3,}[^.!?]*[.!?]/.test(bio)) bio = null;
    }
    const theirLinks = [...mdLinks(bit), ...mdLinks(ownBlock)].filter((l) => !isSiteLink(l.href) && !paths.has(pathOf(l.href)));
    const li = linkInfo(theirLinks);
    const ownText = plainText(ownBlock).replace(/\s+/g, " ");
    const emailTxt = (bit + " " + ownText).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    // Styles come from the BIO only. MEASURED on the same shop: the artist's own page carried the
    // shop's whole services list and gave him eleven styles. A bio is about the person; a page is not.
    const ownStyles = bio ? stylesIn(bio) : [];
    const look = { own_pages: [...paths], own_blocks: blocks.filter((b) => paths.has(pathOf(b.page))).length, own_chars: ownBlock.length,
      own_text: plainText(ownBlock).slice(0, 300), roster_bit_chars: bit.length,
      own_links: [...new Set(mdLinks(ownBlock).map((l) => l.href))].filter((h) => !/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(h)).slice(0, 25)
        .map((h) => ({ h, pages: linkPages.get(h) || 0, home: homeLinks.has(h), shop_side: isSiteLink(h) })),
      emails_in_text: [...new Set(((bit + " " + ownText).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []))].slice(0, 5) };
    out.push({ name, nameKey: nameKey(name), images: pics, skip: piercer ? "piercer" : null, look,
      bio, styles: ownStyles, instagram: li.instagram, socials: li.socials, email: li.email || (emailTxt ? emailTxt[0] : null),
      phone: li.phone, booking: li.booking, from_card: fromCard, from_archive: pics.length - fromCard,
      archive_candidates: considered, archive_cut: cut, artist_page: page });
  }
  // The shop's own way to be reached - shown as the shop's, never as the artist's.
  const shopSoc = linkInfo(shopLinks.map((href) => ({ href })));
  const socialCol = String(row.social || "");
  for (const u of socialCol.match(/https?:\/\/[^\s"',\]]+/g) || []) {
    const one = linkInfo([{ href: u }]);
    shopSoc.instagram ||= one.instagram;
    for (const k of Object.keys(one.socials)) if (k !== "other") shopSoc.socials[k] ||= one.socials[k];
  }
  const firstOf = (v) => String(v || "").split(/[|,;]/)[0].trim() || null;
  const shopInfo = { name: row.name, id: shopId, phone: firstOf(row.phone) || firstOf(row.phone_found), email: firstOf(row.email) || firstOf(row.email_found),
    street: row.street || null, city: row.locality || null, region: row.region || null, postcode: row.postcode || null,
    website: origin || null, booking: und.booking_page || null, instagram: shopSoc.instagram, socials: shopSoc.socials };
  await readArtistsLive(out, { origin, shopInfo, homeLinks });
  return { shop: row.name, id: shopId, row, shopInfo, styles: Array.isArray(und.styles) ? und.styles : [], archive: arch ? arch.key : null, artists: out };
}

// ══ THEIR OWN PAGE, READ ONCE MORE, LIVE (2026-11-20) ═════════════════════════════════════════
// MEASURED with "look": Marley (Bridge Street) and Mike Wardell (Spidermonkey) both have their own
// Instagram on their own page - instagram.com/marleysart, instagram.com/mikewardelltattoo - and the
// saved crawl does not have it. On those sites the crawl kept the pictures and dropped the buttons.
// So each artist's own page is read once more, as plain HTML: one request per artist, our honest
// name as the user agent, the shop's robots.txt honoured, 1.1s between pages of the same site, and a
// refusal ends that shop with nothing worked around.
// What counts as THEIRS: links in the body of their page only - the page's <header>, <footer> and
// <nav> are the shop's. A link that also appears on another artist's page, on the homepage, or that
// is the shop's own account, email or phone, is the shop's too.
const digitsOf = (v) => String(v || "").replace(/\D/g, "").slice(-10);
function pageBody(html) {
  const body = String(html || "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(header|footer|nav)\b[\s\S]*?<\/\1>/gi, " ");
  const links = [...new Set([...body.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, "&").trim()))];
  const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ");
  // Every Instagram handle anywhere in the raw page, scripts included - some builders keep the
  // page's buttons in JSON (escaped as instagram.com\/name) and draw them in the browser.
  const raw = String(html || "");
  const handles = [...new Set([...raw.matchAll(/instagram\.com(?:\\?\/)+([A-Za-z0-9_.]{2,30})/gi)].map((m) => igHandle("instagram.com/" + m[1])).filter(Boolean))];
  const title = ((raw.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "").trim().slice(0, 80);
  return { links, text, handles, bytes: raw.length, title };
}
async function readArtistsLive(artists, ctx) {
  const si = ctx.shopInfo || {};
  const shopEmail = String(si.email || "").toLowerCase(), shopPhone = digitsOf(si.phone);
  const shopSocial = new Set(Object.values(si.socials || {}).filter((v) => typeof v === "string"));
  // Never the shop's email or phone, whichever way it was found.
  for (const a of artists) {
    if (a.email && a.email.toLowerCase() === shopEmail) a.email = null;
    if (a.phone && digitsOf(a.phone) === shopPhone) a.phone = null;
  }
  const todo = artists.filter((a) => !a.skip && a.artist_page);
  if (!todo.length || !ctx.origin) return;
  // MEASURED on Bridge Street Tattoo: its stored address is http://, the site lives on https://, and
  // the plain-http request sat until it timed out on all three artists. Try https first, then the
  // address as stored. If a site answers nothing at all, the rest of its artists are not waited on -
  // they keep everything the saved crawl already gave them.
  const tries = (u) => { const out = []; try { const x = new URL(u); if (x.protocol === "http:") { x.protocol = "https:"; out.push(x.toString()); } } catch {} out.push(u); return [...new Set(out)]; };
  let delay = GAP_MS;
  try {
    let rb = { text: "" };
    for (const u of tries(ctx.origin + "/robots.txt")) { rb = await getPage(u, 15000); if (rb.status) break; }
    const v = robotsVerdict(rb.text, todo.map((a) => { try { return new URL(a.artist_page).pathname; } catch { return "/"; } }));
    if (!v.ok) { for (const a of todo) a.live = "robots_disallow"; return; }
    if (v.delay) delay = Math.max(delay, v.delay * 1000 + 100);
  } catch (e) { for (const a of todo) a.live = "refused"; return; }
  const pages = [];
  let answered = 0;
  for (const a of todo) {
    try {
      let r = { text: "", status: 0 };
      for (const u of tries(a.artist_page)) { r = await getPage(u, 15000); if (r.text) break; }
      if (r.text) { pages.push({ a, body: pageBody(r.text) }); answered++; }
      else {
        a.live = "unreadable (" + (r.status || r.error || "no answer") + ")";
        if (!answered && !r.status) { for (const x of todo) if (!x.live) x.live = "site did not answer"; break; }
      }
    } catch (e) { for (const x of todo) if (!x.live) x.live = "refused"; break; }
    await sleep(delay);
  }
  const seen = new Map(), seenH = new Map();
  for (const pg of pages) for (const l of pg.body.links) seen.set(l, (seen.get(l) || 0) + 1);
  for (const pg of pages) for (const h of pg.body.handles) seenH.set(h, (seenH.get(h) || 0) + 1);
  for (const { a, body } of pages) {
    const mine = body.links.filter((l) => !(pages.length >= 2 && seen.get(l) >= 2) && !shopSocial.has(l));
    const li = linkInfo(mine.map((href) => ({ href })));
    if (li.instagram && li.instagram !== si.instagram) a.instagram ||= li.instagram;
    if (!a.instagram) {
      // No Instagram link in the body: take a handle from the raw page only if exactly one is left
      // after removing the shop's own, the homepage's, and any that other artists' pages also carry.
      const cand = body.handles.filter((h) => h !== si.instagram && !(pages.length >= 2 && seenH.get(h) >= 2));
      if (cand.length === 1) a.instagram = cand[0];
    }
    a.live_page = { bytes: body.bytes, title: body.title, handles_on_page: body.handles.slice(0, 6) };
    a.socials ||= {};
    for (const k of ["facebook", "tiktok", "youtube", "pinterest", "x"]) if (li.socials[k]) a.socials[k] ||= li.socials[k];
    if (li.email && li.email.toLowerCase() !== shopEmail) a.email ||= li.email;
    if (!a.email) {
      const em = (body.text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
        .find((e) => e.toLowerCase() !== shopEmail && !/\.(png|jpe?g|webp|gif)$/i.test(e) && !/(wix|sentry|example|domain)\./i.test(e));
      if (em) a.email = em;
    }
    if (li.phone && digitsOf(li.phone) !== shopPhone) a.phone ||= li.phone;
    if (li.booking) a.booking ||= li.booking;
    a.live = "read";
  }
}

const escH = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const titleCase = (s) => String(s || "").replace(/\b([a-z])/g, (c) => c.toUpperCase());
function artistPageHtml(a, shop) {
  const where = [titleCase(shop.row.locality), shop.row.region].filter(Boolean).join(", ");
  const si = shop.shopInfo || {};
  const chipA = (href, label) => '<a class=chip href="' + escH(href) + '" rel="noopener">' + escH(label) + '</a>';
  // The artist's own ways in - only what their part of the site gives.
  const own = [];
  if (a.instagram) own.push(chipA("https://www.instagram.com/" + a.instagram + "/", "Instagram @" + a.instagram));
  for (const [k, lab] of [["tiktok", "TikTok"], ["facebook", "Facebook"], ["pinterest", "Pinterest"], ["youtube", "YouTube"], ["x", "X"]])
    if (a.socials && a.socials[k]) own.push(chipA(a.socials[k], lab));
  if (a.email) own.push(chipA("mailto:" + a.email, a.email));
  if (a.phone) own.push(chipA("tel:" + a.phone, a.phone));
  if (a.booking) own.push(chipA(a.booking, "Book with " + a.name));
  // The shop's - labelled as the shop's.
  const shopBits = [];
  const fact = (k, v) => shopBits.push('<div class=fact><b>' + escH(k) + '</b><span>' + v + '</span></div>');
  const addr = [si.street, [titleCase(si.city), si.region].filter(Boolean).join(", "), si.postcode].filter(Boolean).join(" · ");
  if (addr) fact("Address", escH(addr));
  if (si.phone) fact("Shop phone", '<a href="tel:' + escH(si.phone) + '">' + escH(si.phone) + '</a>');
  if (si.email) fact("Shop email", '<a href="mailto:' + escH(si.email) + '">' + escH(si.email) + '</a>');
  if (si.booking) fact("Book through the shop", '<a href="' + escH(si.booking) + '" rel="noopener">' + escH(String(si.booking).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + '</a>');
  if (si.website) fact("Shop website", '<a href="' + escH(si.website) + '" rel="noopener">' + escH(String(si.website).replace(/^https?:\/\/(www\.)?/, "")) + '</a>');
  const ss = [];
  if (si.instagram) ss.push('<a href="https://www.instagram.com/' + escH(si.instagram) + '/" rel="noopener">Instagram @' + escH(si.instagram) + '</a>');
  for (const [k, lab] of [["facebook", "Facebook"], ["tiktok", "TikTok"], ["pinterest", "Pinterest"], ["youtube", "YouTube"]])
    if (si.socials && si.socials[k]) ss.push('<a href="' + escH(si.socials[k]) + '" rel="noopener">' + lab + '</a>');
  if (ss.length) fact("Shop social", ss.join(" &middot; "));
  const imgs = a.images;
  const hero = imgs.slice(0, 5).map((i) => '<img src="' + escH(i.url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">').join("");
  const grid = imgs.map((i) => '<img src="' + escH(i.url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">').join("");
  return '<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<title>' + escH(a.name) + ' at ' + escH(shop.row.name) + ' &mdash; tattooartist.world</title><meta name=robots content="noindex">' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#07090f;color:#f8fafc;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    'a{color:inherit;text-decoration:none}.wrap{max-width:56rem;margin:0 auto;padding:0 20px 5rem}header{padding:.9rem 0;border-bottom:1px solid rgba(251,191,36,.15);margin-bottom:1.6rem}' +
    '.logo{font-size:1rem;font-weight:800}.logo b{color:#fbbf24}.hero{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;border-radius:16px;overflow:hidden;margin-bottom:1.6rem}' +
    '.hero img{width:100%;height:clamp(115px,16vw,180px);object-fit:cover;display:block;background:#0f172a}.hero img:first-child{grid-column:span 2;grid-row:span 2;height:100%;min-height:238px}' +
    '@media(max-width:640px){.hero{grid-template-columns:repeat(2,1fr)}.hero img:first-child{min-height:200px}}h1{font-size:clamp(1.7rem,5vw,2.6rem);font-weight:800;letter-spacing:-.03em;line-height:1.05}' +
    '.where{color:#94a3b8;margin-top:.35rem;font-size:.95rem}.acts{display:flex;gap:.6rem;flex-wrap:wrap;margin:1.5rem 0 .4rem}.act{padding:.7rem 1.3rem;border-radius:11px;background:#0f1420;border:1px solid rgba(251,191,36,.25);color:#e2e8f0;font-weight:600;font-size:.95rem}' +
    '.act.go{background:#b45309;border-color:#b45309;color:#fff;font-weight:700}h2{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:700;margin:2.3rem 0 .8rem;border-top:1px solid rgba(251,191,36,.1);padding-top:1.3rem}' +
    '.chips{display:flex;flex-wrap:wrap;gap:.45rem}.chip{background:#0f1420;border:1px solid rgba(251,191,36,.2);border-radius:999px;padding:.35rem .9rem;font-size:.87rem;color:#e2e8f0}.chip.who{background:#b45309;border-color:#b45309;color:#fff;font-weight:600}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.5rem}.grid img{width:100%;height:150px;object-fit:cover;border-radius:10px;background:#0f172a;display:block}' +
    'footer{color:#475569;font-size:.78rem;padding:2.4rem 0 1rem;line-height:1.7;word-break:break-word}' +
    '.story{color:#cbd5e1;font-size:.96rem;line-height:1.6;max-width:44rem}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.55rem;margin-top:.8rem}' +
    '.fact{background:#0f1420;border:1px solid rgba(251,191,36,.18);border-radius:12px;padding:.8rem 1rem}.fact b{display:block;color:#64748b;font-size:.67rem;text-transform:uppercase;letter-spacing:.09em;font-weight:700;margin-bottom:.3rem}' +
    '.fact span{color:#f1f5f9;font-size:.93rem;line-height:1.45;word-break:break-word}.fact a{color:#fbbf24}</style></head><body>' +
    '<header><div class=wrap><a href="/" class=logo>tattooartist<b>.world</b></a></div></header><div class=wrap>' +
    (hero ? '<div class=hero>' + hero + '</div>' : '') +
    '<h1>' + escH(a.name) + '</h1><div class=where>Tattoo artist at ' + escH(shop.row.name) + (where ? ' &middot; ' + escH(where) : '') + '</div>' +
    '<div class=acts><a class="act go" href="https://tattooparlors.world/b/' + escH(shop.id) + '">' + escH(shop.row.name) + '</a>' +
    (a.artist_page ? '<a class=act href="' + escH(a.artist_page) + '" rel="noopener">Their page</a>' : '') + '</div>' +
    (a.bio ? '<h2>About</h2><p class=story>' + escH(a.bio) + '</p>' : '') +
    (a.styles && a.styles.length ? '<h2>Styles</h2><div class=chips>' + a.styles.map((x) => '<span class=chip>' + escH(x) + '</span>').join("") + '</div>' : '') +
    (own.length ? '<h2>Reach ' + escH(a.name) + '</h2><div class=chips>' + own.join("") + '</div>' : '') +
    '<h2>Works at</h2><div class=chips><a class="chip who" href="https://tattooparlors.world/b/' + escH(shop.id) + '">' + escH(shop.row.name) + '</a></div>' +
    (shopBits.length ? '<div class=facts>' + shopBits.join("") + '</div>' : '') +
    '<h2>Their work &middot; ' + imgs.length + '</h2>' + (grid ? '<div class=grid>' + grid + '</div>' : '<p style="color:#64748b">No pictures yet.</p>') +
    '<footer>Pictures from ' + escH(a.artist_page || shop.row.website || "") + '</footer></div></body></html>';
}

async function saveShopArtists(env, got, dry) {
  const db = env.AURA_MEMORY, t = now(); const saved = [];
  for (const a of got.artists) {
    const id = "art_tp_" + await sha16(got.id + "|" + a.nameKey);
    const sid = got.id + "|" + a.nameKey;
    const row = { id, kind: "artist", name: a.name, name_key: a.nameKey, alias: null, bio: a.bio || null,
      city: got.row.locality ? String(got.row.locality).toLowerCase() : null, region: got.row.region || null, country: got.row.country || null,
      studio_text: got.row.name, styles: JSON.stringify(a.styles || []), instagram: a.instagram || null, website: a.artist_page, website_host: null,
      socials: JSON.stringify(a.socials || {}), phone: a.phone || null, email: a.email || null, booking_url: a.booking || null,
      images: JSON.stringify(a.images), image_count: a.images.length, portfolio_total: null,
      sources: JSON.stringify([{ source: SHOP_SRC, source_id: sid, url: "https://tattooparlors.world/b/" + got.id, page: a.artist_page, collected_at: t }]),
      understanding: JSON.stringify({ [SHOP_SRC]: { archive: got.archive, from_card: a.from_card, from_archive: a.from_archive }, shop: got.shopInfo }),
      cg_business_id: got.id, pta_id: null, created_at: t, updated_at: t };
    if (a.skip) {
      // Not published. If an earlier run already made a page for them, it is taken down.
      saved.push({ name: a.name, skipped: a.skip, artist_page: a.artist_page });
      if (!dry) {
        await db.batch([
          db.prepare("DELETE FROM cg_artist WHERE id = ?").bind(id),
          db.prepare("INSERT INTO artist_listing (source, source_id, profile_url, seen_at, verdict, read_at) VALUES (?,?,?,?,?,?) " +
            "ON CONFLICT (source, source_id) DO UPDATE SET verdict = excluded.verdict, artist_id = NULL, read_at = excluded.read_at")
            .bind(SHOP_SRC, sid, a.artist_page, t, a.skip, t),
        ]);
        await env.AURA_KV.delete("page:tattooartist.world/a/" + id);
      }
      continue;
    }
    const url = "https://tattooartist.world/a/" + id;
    saved.push({ name: a.name, pictures: a.images.length, live: a.live || null, bio: a.bio ? a.bio.slice(0, 120) : null, styles: a.styles, instagram: a.instagram, email: a.email, phone: a.phone || null,
      socials: Object.fromEntries(Object.entries(a.socials || {}).filter(([k, v]) => v && k !== "other")), booking: a.booking,
      from_card: a.from_card, from_archive: a.from_archive,
      archive_cut: a.archive_cut, artist_page: a.artist_page, view: url });
    if (dry) continue;
    const cols = ["id", "kind", "name", "name_key", "alias", "bio", "city", "region", "country", "studio_text", "styles", "instagram", "website", "website_host", "socials", "phone", "email", "booking_url", "images", "image_count", "portfolio_total", "sources", "understanding", "cg_business_id", "pta_id", "created_at", "updated_at"];
    await db.batch([
      db.prepare("INSERT OR REPLACE INTO cg_artist (" + cols.join(",") + ") VALUES (" + cols.map(() => "?").join(",") + ")").bind(...cols.map((c) => row[c] ?? null)),
      db.prepare("INSERT INTO artist_listing (source, source_id, profile_url, seen_at, verdict, artist_id, read_at) VALUES (?,?,?,?,?,?,?) " +
        "ON CONFLICT (source, source_id) DO UPDATE SET verdict = excluded.verdict, artist_id = excluded.artist_id, read_at = excluded.read_at")
        .bind(SHOP_SRC, sid, a.artist_page, t, a.images.length ? "ok" : "no_pictures", id, t),
    ]);
    await env.AURA_KV.put("page:tattooartist.world/a/" + id, artistPageHtml(a, got));
  }
  return saved;
}

async function shopsStep(env, cur, test) {
  const db = env.AURA_MEMORY;
  let ids;
  if (test) ids = cur.testIds.slice(cur.done, cur.done + SHOPS_PER_STEP);
  else ids = ((await db.prepare("SELECT id FROM cg_business WHERE id > ? AND id <= ? AND json_type(understanding, '$.sections') = 'array' ORDER BY id LIMIT ?")
    .bind(cur.after || "", cur.upto || "\uffff", SHOPS_PER_STEP).all()).results || []).map((r) => r.id);
  const report = []; let artists = 0, pics = 0, twenty = 0;
  for (const id of ids) {
    try {
      const got = await shopArtists(env, id);
      const saved = got.artists.length ? await saveShopArtists(env, got, false) : [];
      const pub = saved.filter((x) => !x.skipped);
      artists += pub.length; pics += pub.reduce((n, x) => n + x.pictures, 0); twenty += pub.filter((x) => x.pictures >= MAX_IMAGES).length;
      if (test) report.push({ shop: got.shop, id, archive: got.archive, artists: saved });
    } catch (e) { if (test) report.push({ id, error: String(e?.message ?? e).slice(0, 160) }); }
    cur.after = id;
  }
  cur.done = (cur.done || 0) + ids.length; cur.artists = (cur.artists || 0) + artists; cur.pictures = (cur.pictures || 0) + pics; cur.at_twenty = (cur.at_twenty || 0) + twenty;
  return { cur, ids: ids.length, report, done: test ? cur.done >= cur.testIds.length : ids.length < SHOPS_PER_STEP };
}

// ── the Workflow ───────────────────────────────────────────────────────────────────────────────
export class ArtistWalk extends WorkflowEntrypoint {
  async run(event, step) {
    const env = this.env, db = env.AURA_MEMORY, kv = env.AURA_KV;
    const p = event.payload || {};
    const RETRY = { retries: { limit: 2, delay: "30 seconds", backoff: "constant" }, timeout: "10 minutes" };

    // ── the starter: reads the plain-words job from KV ──
    if (!p.src) {
      const jobs = await step.do("job", async () => {
        const txt = String((await kv.get("artistwalk:job")) || "").trim();
        if (txt) await kv.delete("artistwalk:job");
        return txt.split(/\s*;\s*/).filter(Boolean);
      });
      if (!jobs.length) return { ok: false, build: BUILD, error: "NO_JOB", what_to_do: "Put a job in KV artistwalk:job first." };
      await step.do("schema", RETRY, async () => { await ensureSchema(db); return true; });
      const results = [];
      for (let j = 0; j < jobs.length; j++) {
        const w = jobs[j].split(/\s+/); const verb = (w[0] || "").toLowerCase();
        if (verb === "one") {
          const r = await step.do("one-" + j, RETRY, async () => {
            const s = sourceOfUrl(w[1]); const dry = /^dry$/i.test(w[2] || "");
            if (!s) return { job: jobs[j], ok: false, error: "NOT_A_PROFILE_URL" };
            try {
              const got = await readProfile(s.src, s.id);
              if (!got.rec) { if (!dry) await markListing(db, s.src, s.id, got.verdict); return { job: jobs[j], ok: true, verdict: got.verdict, why: got.why || null }; }
              const saved = await saveArtist(db, s.src, s.id, got.rec, dry);
              return { job: jobs[j], ok: true, dry, verdict: got.verdict, record: got.rec, ...saved, would_write: undefined };
            } catch (e) { return { job: jobs[j], ok: false, error: String(e?.message ?? e).slice(0, 200) }; }
          });
          results.push(r);
        } else if (verb === "shops") {
          // shops test  - Inkus + the first 4 other shops with pictures under an artist's name
          // shops all   - every such shop (about 2,492), chained, unattended
          // shops upto <shop id> - redo every shop up to and including that one (a second pass on
          // the part of a run that finished before a fix was deployed)
          let upto = /^upto$/i.test(w[1] || "") ? String(w[2] || "") : "";
          if (upto.toLowerCase() === "here") {
            // "here" = wherever the main run has got to, but only once the main run is on THIS build -
            // then everything before that point was done by the older code and needs the second pass.
            const pr = await step.do("upto-here-" + j, async () => JSON.parse((await kv.get("artistwalk:progress:shops")) || "{}"));
            if (pr.build !== BUILD || !pr.last_shop) { results.push({ job: jobs[j], ok: false, error: "MAIN_RUN_NOT_ON_THIS_BUILD_YET", main_run_build: pr.build || null, what_to_do: "wait a few minutes and run it again" }); continue; }
            upto = pr.last_shop;
          }
          const test = !upto && !/^all$/i.test(w[1] || "test");
          const run = "shops-" + Date.now().toString(36) + "-" + rid();
          const made = await step.do("start-" + j, async () => {
            const inst = await env.ARTIST_WALK.create({ id: "aw-" + run + "-0", params: { src: "shops", test, upto, run, chain: 0 } });
            return inst.id;
          });
          results.push({ job: jobs[j], started: made, upto: upto || undefined, progress_key: "artistwalk:progress:" + (upto ? "redo" : "shops") });
        } else if (verb === "look") {
          // look <shop name> - what the saved crawl actually holds for each artist there. Reads only.
          const shopName = jobs[j].replace(/^look\s+/i, "").trim();
          results.push(await step.do("look-" + j, RETRY, async () => {
            const r = await db.prepare("SELECT id FROM cg_business WHERE name = ? AND json_type(understanding, '$.sections') = 'array' LIMIT 1").bind(shopName).first();
            if (!r) return { job: jobs[j], ok: false, error: "NO_SUCH_SHOP_WITH_ARTISTS" };
            const got = await shopArtists(env, r.id);
            return { job: jobs[j], shop: got.shop, id: r.id, archive: got.archive, shop_email: got.shopInfo?.email || null, shop_instagram: got.shopInfo?.instagram || null,
              artists: got.artists.map((a) => ({ name: a.name, pictures: a.images.length, live: a.live || null, instagram: a.instagram, email: a.email, phone: a.phone || null,
                socials: Object.fromEntries(Object.entries(a.socials || {}).filter(([k, v]) => v && k !== "other")), booking: a.booking || null, live_page: a.live_page || null })) };
          }));
        } else if (verb === "status") {
          results.push(await step.do("status-" + j, RETRY, async () => statusOf(db)));
        } else if (SRC_OF_NAME[verb]) {
          const src = SRC_OF_NAME[verb]; const w1 = (w[1] || "all").toLowerCase();
          const phase = w1 === "read" ? "read" : "list";
          const scope = w1 === "us" ? "us" : "all";
          const test = /^test$/i.test(w[2] || "");
          const readLimit = phase === "read" && Number(w[2]) > 0 ? Number(w[2]) : (test ? 25 : null);
          const run = src + "-" + Date.now().toString(36) + "-" + rid();
          const made = await step.do("start-" + j, async () => {
            const inst = await env.ARTIST_WALK.create({ id: "aw-" + run + "-0", params: { src, phase, scope, test, readLimit, run, chain: 0 } });
            return inst.id;
          });
          results.push({ job: jobs[j], started: made, progress_key: "artistwalk:progress:" + src });
        } else results.push({ job: jobs[j], ok: false, error: "UNKNOWN_JOB" });
      }
      const out = { ok: true, build: BUILD, at: now(), results };
      await step.do("say", async () => { await kv.put("artistwalk:last", JSON.stringify(out), { expirationTtl: 30 * 86400 }); return true; });
      return out;
    }

    // ── a chain link: list or read, STEPS_PER_RUN steps, then hand on to a fresh instance ──
    const src = p.src; const pkey = "artistwalk:progress:" + (p.upto ? "redo" : src);
    const say = async (body) => { try { await kv.put(pkey, JSON.stringify({ build: BUILD, run: p.run, chain: p.chain, ...body, updated: now() }), { expirationTtl: 30 * 86400 }); } catch {} };

    // ── artists from the shops already crawled: R2 + D1 only, no outside requests ──
    if (src === "shops") {
      let cur = p.cur || null, stepsHere = 0; const report = [];
      if (!cur) cur = await step.do("shops-init", RETRY, async () => {
        await ensureSchema(db);
        const more = ((await db.prepare("SELECT id FROM cg_business WHERE id <> ? AND json_type(understanding, '$.sections') = 'array' ORDER BY id LIMIT 4")
          .bind(INKUS).all()).results || []).map((r) => r.id);
        return { after: "", upto: p.upto || "", done: 0, testIds: p.test ? [INKUS, ...more] : [], artists: 0, pictures: 0, at_twenty: 0 };
      });
      let finished = false;
      while (stepsHere < STEPS_PER_RUN) {
        const stop = await step.do("stop-check-" + stepsHere, async () => !!(await kv.get("artistwalk:stop")));
        if (stop) { await step.do("stopped-say", async () => { await say({ phase: "shops", stopped: "artistwalk:stop is set" }); return true; }); return { ok: true, stopped: "by request" }; }
        const r = await step.do("shops-" + stepsHere, RETRY, async () => shopsStep(env, cur, p.test));
        cur = r.cur; stepsHere++; report.push(...r.report);
        await step.do("say-" + stepsHere, async () => { await say({ phase: "shops", shops_done: cur.done, artists: cur.artists, pictures: cur.pictures, artists_at_20: cur.at_twenty, last_shop: cur.after }); return true; });
        if (r.done) { finished = true; break; }
      }
      if (!finished) {
        const next = await step.do("next", async () => {
          try { const inst = await env.ARTIST_WALK.create({ id: "aw-" + p.run + "-" + (p.chain + 1), params: { ...p, cur, chain: p.chain + 1 } }); return inst.id; }
          catch (e) { return "already started: " + String(e?.message ?? e).slice(0, 80); }
        });
        return { ok: true, handed_on_to: next };
      }
      await step.do("shops-final", async () => {
        const body = { ok: true, finished: "shops", test: !!p.test, shops: cur.done, artists: cur.artists, pictures: cur.pictures, artists_at_20: cur.at_twenty, at: now(), build: BUILD };
        if (p.test) body.report = report;
        await kv.put("artistwalk:last", JSON.stringify(body), { expirationTtl: 30 * 86400 });
        await say({ phase: "finished", shops_done: cur.done, artists: cur.artists, pictures: cur.pictures, artists_at_20: cur.at_twenty });
        return true;
      });
      return { ok: true, finished: true };
    }

    if (p.chain === 0) {
      const rb = await step.do("robots", RETRY, async () => {
        const r = await getPage(SOURCES[src].base + "/robots.txt");
        return robotsVerdict(r.text, SOURCES[src].paths);
      });
      if (!rb.ok) { await step.do("robots-say", async () => { await say({ stopped: "robots.txt disallows " + rb.blocked.join(", ") }); return true; }); return { ok: false, stopped: "robots", blocked: rb.blocked }; }
    }

    let phase = p.phase, cur = p.cur || null, readLeft = p.readLimit ?? null, stepsHere = 0, lastSaid = null;
    try {
      if (phase === "list" && !cur) cur = await step.do("list-init", RETRY, async () => listInit(src, p.scope, p.test));
      while (stepsHere < STEPS_PER_RUN) {
        const stop = await step.do("stop-check-" + stepsHere, async () => !!(await kv.get("artistwalk:stop")));
        if (stop) { await step.do("stopped-say", async () => { await say({ phase, stopped: "artistwalk:stop is set - delete it and run '" + src + " read' to carry on" }); return true; }); return { ok: true, stopped: "by request" }; }
        if (phase === "list") {
          const r = await step.do("list-" + stepsHere, RETRY, async () => listStep(db, src, cur));
          cur = r.cur; stepsHere++;
          lastSaid = { phase, area: cur.areas[Math.min(cur.ai, cur.areas.length - 1)], page: cur.page, areas_done: cur.ai, areas: cur.areas.length, pages_read: cur.pagesDone, found_this_step: r.found };
          await step.do("say-" + stepsHere, async () => { await say(lastSaid); return true; });
          if (r.done) { phase = "read"; cur = null; }
        } else {
          if (readLeft !== null && readLeft <= 0) break;
          const r = await step.do("read-" + stepsHere, RETRY, async () => readStep(db, src, readLeft ?? PER_STEP));
          stepsHere++;
          if (readLeft !== null) readLeft -= r.read;
          lastSaid = { phase, read_this_step: r.read, tally: r.tally, last: r.last };
          if (r.done) { readLeft = 0; }
          await step.do("say-" + stepsHere, async () => { await say(lastSaid); return true; });
          if (r.done) break;
        }
      }
    } catch (e) {
      const why = String(e?.message ?? e).slice(0, 240);
      await step.do("blocked-say", async () => { await say({ phase, stopped: "the site refused us - nothing was worked around: " + why }); return true; });
      return { ok: false, stopped: why };
    }

    const finished = phase === "read" && readLeft !== null && readLeft <= 0;
    if (!finished) {
      const next = await step.do("next", async () => {
        try {
          const inst = await env.ARTIST_WALK.create({ id: "aw-" + p.run + "-" + (p.chain + 1),
            params: { ...p, phase, cur, readLimit: readLeft, chain: p.chain + 1 } });
          return inst.id;
        } catch (e) { return "already started: " + String(e?.message ?? e).slice(0, 80); }
      });
      return { ok: true, handed_on_to: next };
    }
    const st = await step.do("final-status", RETRY, async () => statusOf(db));
    await step.do("final-say", async () => { await say({ phase: "finished", status: st.sources[SOURCES[src].name] }); await kv.put("artistwalk:last", JSON.stringify({ ok: true, finished: src, status: st }), { expirationTtl: 30 * 86400 }); return true; });
    return { ok: true, finished: true };
  }
}

// No public door: workers_dev is off and there are no routes. This only answers if something is ever bound to it.
export default { async fetch() { return new Response("artist-walk " + BUILD, { status: 404 }); } };
