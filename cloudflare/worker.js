// uMap hybrid worker: prepared GeoJSON from GitHub; SVG combinations generated here.

// hybrid-source.ts
var FILTER_LANDKREIS_SIGMARINGEN = true;
var COUNTY_NAME = "Landkreis Sigmaringen";
var COUNTY_GEOJSON_SOURCE = "https://raw.githubusercontent.com/googie0815/umap-icons/main/landkreis-sigmaringen.geojson";
var COLOR_CONSTRUCTION = "#EEAD2D";
var COLOR_ROAD_CLOSED = "#E6391D";
var ICON_ZOOM_FACTOR = 1.08;
var ENDPOINT_MATCH_TOLERANCE_M = 40;
var AOA_MATCH_TOLERANCE_M = 30;
var HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300"
};
var DATEX_CACHE_MS = 5 * 60 * 1e3;
var COUNTY_CACHE_MS = 24 * 60 * 60 * 1e3;
var COMBINED_ICON_CACHE_TTL = 60 * 60 * 1e3;
var combinedIconCache = /* @__PURE__ */ new Map();
var VZ250_FILE = "VZ_250.svg";
var VZ123_FILE = "VZ_123.svg";
var ICON_GITHUB_BASE = "https://raw.githubusercontent.com/googie0815/umap-icons/main";
var COMBINED_ICON_DEFAULT_LAYOUT = "horizontal";
var COMBINED_ICON_DEFAULT_GAP = 8;
var COMBINED_ICON_CANVAS_SIZE = 120;
var COMBINED_ICON_CANVAS_PADDING = 6;
function iconSourceUrl(filename) {
  return `${ICON_GITHUB_BASE}/${encodeURIComponent(filename)}`;
}
function isValidSvgFilename(filename) {
  return /^[A-Za-z0-9_.-]+\.svg$/i.test(filename);
}
function normalizeCombinedLayout(value) {
  return value === "vertical" ? "vertical" : "horizontal";
}
function normalizeGap(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return COMBINED_ICON_DEFAULT_GAP;
  }
  return Math.max(
    0,
    Math.min(
      40,
      Math.round(parsed)
    )
  );
}
function normalizeScales(value, expectedLength) {
  const rawValues = (value ?? "").split(",").map(
    (item) => item.trim()
  ).filter(Boolean);
  const result = [];
  for (let i = 0; i < expectedLength; i++) {
    const parsed = Number(
      rawValues[i] ?? "1"
    );
    if (!Number.isFinite(parsed)) {
      result.push(1);
      continue;
    }
    result.push(
      Math.max(
        0.2,
        Math.min(
          1.5,
          parsed
        )
      )
    );
  }
  return result;
}
function stripSvgMetadata(svg) {
  return svg.replace(
    /<metadata\b[\s\S]*?<\/metadata>\s*/gi,
    ""
  ).replace(
    /<\?xml[\s\S]*?\?>\s*/gi,
    ""
  ).trim();
}
function attributeNumber(svgTag, attribute) {
  const match = svgTag.match(
    new RegExp(
      `${attribute}\\s*=\\s*["']([^"']+)["']`,
      "i"
    )
  );
  if (!match) {
    return null;
  }
  const value = Number(
    String(match[1]).replace(
      /px$/i,
      ""
    )
  );
  return Number.isFinite(value) ? value : null;
}
function extractSvgNamespaces(svgTag) {
  const result = {};
  for (const match of svgTag.matchAll(
    /\s(xmlns(?::[A-Za-z_][\w.-]*)?)\s*=\s*["']([^"']+)["']/g
  )) {
    result[match[1]] = match[2];
  }
  return result;
}
function parseSvg(svg) {
  const openTagMatch = svg.match(
    /<svg\b[^>]*>/i
  );
  const closeTagMatch = svg.match(
    /<\/svg>\s*$/i
  );
  if (!openTagMatch || !closeTagMatch) {
    throw new Error(
      "Ung\xFCltiges SVG: <svg>-Tag nicht gefunden."
    );
  }
  const openTag = openTagMatch[0];
  const viewBoxMatch = openTag.match(
    /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i
  );
  let minX = 0;
  let minY = 0;
  let width = attributeNumber(
    openTag,
    "width"
  );
  let height = attributeNumber(
    openTag,
    "height"
  );
  if (viewBoxMatch) {
    minX = Number(viewBoxMatch[1]);
    minY = Number(viewBoxMatch[2]);
    width = Number(viewBoxMatch[3]);
    height = Number(viewBoxMatch[4]);
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(
      "SVG ohne brauchbare width/height bzw. viewBox-Angabe."
    );
  }
  const start = openTagMatch.index + openTag.length;
  const end = closeTagMatch.index;
  const content = svg.slice(
    start,
    end
  );
  return {
    minX,
    minY,
    width,
    height,
    content,
    namespaces: extractSvgNamespaces(
      openTag
    )
  };
}
function prefixSvgIds(svgContent, prefix) {
  return svgContent.replace(
    /id=(["'])([^"']+)\1/g,
    (_match, quote, id) => `id=${quote}${prefix}${id}${quote}`
  ).replace(
    /url\(#([^\)]+)\)/g,
    (_match, id) => `url(#${prefix}${id})`
  ).replace(
    /href=(["'])#([^"']+)\1/g,
    (_match, quote, id) => `href=${quote}#${prefix}${id}${quote}`
  ).replace(
    /xlink:href=(["'])#([^"']+)\1/g,
    (_match, quote, id) => `xlink:href=${quote}#${prefix}${id}${quote}`
  ).replace(
    /\bclass=(["'])([^"']+)\1/g,
    (_match, quote, classes) => `class=${quote}${classes}${quote}`
  );
}
function zoomSvgContent(svg, factor = ICON_ZOOM_FACTOR) {
  const match = svg.match(
    /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i
  );
  if (!match) {
    return svg;
  }
  const minX = Number(
    match[1]
  );
  const minY = Number(
    match[2]
  );
  const width = Number(
    match[3]
  );
  const height = Number(
    match[4]
  );
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || factor <= 1) {
    return svg;
  }
  const newWidth = width / factor;
  const newHeight = height / factor;
  const newMinX = minX + (width - newWidth) / 2;
  const newMinY = minY + (height - newHeight) / 2;
  const format = (value) => value.toFixed(4).replace(
    /\.?0+$/,
    ""
  );
  const newViewBox = `viewBox="${format(newMinX)} ${format(newMinY)} ${format(newWidth)} ${format(newHeight)}"`;
  return svg.replace(
    match[0],
    newViewBox
  );
}
async function loadGithubSvg(filename) {
  if (!isValidSvgFilename(
    filename
  )) {
    throw new Error(
      `Ung\xFCltiger SVG-Dateiname: ${filename}`
    );
  }
  const upstream = await fetch(
    iconSourceUrl(
      filename
    ),
    {
      redirect: "follow",
      headers: {
        "user-agent": "uMap-roadworks-proxy/1.0"
      }
    }
  );
  if (!upstream.ok) {
    throw new Error(
      `Verkehrszeichen ${filename} konnte nicht geladen werden: ${upstream.status}`
    );
  }
  const originalSvg = await upstream.text();
  return stripSvgMetadata(
    originalSvg
  );
}
async function trafficSignResponse(filename) {
  const originalSvg = await loadGithubSvg(
    filename
  );
  const enlargedSvg = zoomSvgContent(
    originalSvg
  );
  return new Response(
    enlargedSvg,
    {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=86400",
        "content-type": "image/svg+xml; charset=utf-8"
      }
    }
  );
}
async function buildCombinedIcon(filenames, layout, gap, scales) {
  if (filenames.length < 1 || filenames.length > 3) {
    throw new Error(
      "Es k\xF6nnen 1 bis 3 SVG-Symbole kombiniert werden."
    );
  }
  for (const filename of filenames) {
    if (!isValidSvgFilename(
      filename
    )) {
      throw new Error(
        `Ung\xFCltiger SVG-Dateiname: ${filename}`
      );
    }
  }
  const cacheKey = JSON.stringify({
    filenames,
    layout,
    gap,
    scales
  });
  const now = Date.now();
  const cached = combinedIconCache.get(
    cacheKey
  );
  if (cached && cached.expires > now) {
    return cached.svg;
  }
  const sourceSvgs = await Promise.all(
    filenames.map(
      (filename) => loadGithubSvg(
        filename
      )
    )
  );
  const parsedSvgs = sourceSvgs.map(
    (svg) => parseSvg(svg)
  );
  const outerSize = COMBINED_ICON_CANVAS_SIZE;
  const outerPadding = COMBINED_ICON_CANVAS_PADDING;
  const innerGap = Math.max(
    0,
    Math.min(
      16,
      gap
    )
  );
  const slotWidth = layout === "vertical" ? outerSize - 2 * outerPadding : (outerSize - 2 * outerPadding - (parsedSvgs.length - 1) * innerGap) / parsedSvgs.length;
  const slotHeight = layout === "vertical" ? (outerSize - 2 * outerPadding - (parsedSvgs.length - 1) * innerGap) / parsedSvgs.length : outerSize - 2 * outerPadding;
  const combinedNamespaces = {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink"
  };
  for (const parsed of parsedSvgs) {
    for (const [
      key,
      value
    ] of Object.entries(
      parsed.namespaces
    )) {
      if (!combinedNamespaces[key]) {
        combinedNamespaces[key] = value;
      }
    }
  }
  const namespaceAttributes = Object.entries(
    combinedNamespaces
  ).map(
    ([
      key,
      value
    ]) => `${key}="${value}"`
  ).join("\n  ");
  const groups = parsedSvgs.map(
    (parsed, index) => {
      const slotX = layout === "vertical" ? outerPadding : outerPadding + index * (slotWidth + innerGap);
      const slotY = layout === "vertical" ? outerPadding + index * (slotHeight + innerGap) : outerPadding;
      const baseScale = Math.min(
        slotWidth / parsed.width,
        slotHeight / parsed.height
      );
      const relativeScale = scales[index] ?? 1;
      const scale = baseScale * relativeScale;
      const renderedWidth = parsed.width * scale;
      const renderedHeight = parsed.height * scale;
      const translateX = slotX + (slotWidth - renderedWidth) / 2 - parsed.minX * scale;
      const translateY = slotY + (slotHeight - renderedHeight) / 2 - parsed.minY * scale;
      const prefixedContent = prefixSvgIds(
        parsed.content,
        `icon${index}_`
      );
      return `
  <g transform="translate(${translateX} ${translateY}) scale(${scale})">
${prefixedContent}
  </g>`.trimEnd();
    }
  ).join("\n");
  const combinedSvg = `
<svg
  ${namespaceAttributes}
  width="${outerSize}"
  height="${outerSize}"
  viewBox="0 0 ${outerSize} ${outerSize}"
  preserveAspectRatio="xMidYMid meet"
  shape-rendering="geometricPrecision"
  text-rendering="geometricPrecision"
>
${groups}
</svg>`.trim();
  combinedIconCache.set(
    cacheKey,
    {
      svg: combinedSvg,
      expires: now + COMBINED_ICON_CACHE_TTL
    }
  );
  return combinedSvg;
}
async function combinedIconResponse(url) {
  const iconsParameter = url.searchParams.get("icons") ?? "";
  const filenames = iconsParameter.split(",").map(
    (value) => value.trim()
  ).filter(Boolean);
  if (filenames.length === 0) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: "Parameter 'icons' fehlt. Beispiel: ?icons=VZ_262_20t.svg,VZ_263_8t.svg&scales=1,0.7"
        },
        null,
        2
      ),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      }
    );
  }
  const layout = normalizeCombinedLayout(
    url.searchParams.get(
      "layout"
    )
  );
  const gap = normalizeGap(
    url.searchParams.get(
      "gap"
    )
  );
  const scales = normalizeScales(
    url.searchParams.get(
      "scales"
    ),
    filenames.length
  );
  try {
    const svg = await buildCombinedIcon(
      filenames,
      layout,
      gap,
      scales
    );
    return new Response(
      svg,
      {
        status: 200,
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=3600",
          "access-control-allow-origin": "*"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      }
    );
  }
}
var handleRequest = (async (req) => {
  const url = new URL(
    req.url
  );
  try {
    if (url.pathname === "/roadworks-datex.geojson") {
      return await preparedDatexResponse(req);
    }
    if (url.pathname === "/roadworks.geojson") {
      return new Response("Dieser Test stellt /roadworks-datex.geojson bereit.", { status: 404, headers: HEADERS });
    }
    if (url.pathname === "/roadworks.csv") {
      return new Response("Dieser Test stellt /roadworks-datex.geojson bereit.", { status: 404, headers: HEADERS });
    }
    if (url.pathname === "/icons/road-closed.svg") {
      return await trafficSignResponse(
        VZ250_FILE
      );
    }
    if (url.pathname === "/icons/construction.svg") {
      return await trafficSignResponse(
        VZ123_FILE
      );
    }
    if (url.pathname === "/icons/combine.svg") {
      return await combinedIconResponse(
        url
      );
    }
    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: "MobiData-BW \u2192 GitHub Actions \u2192 Cloudflare \u2192 uMap",
          filter: {
            enabled: FILTER_LANDKREIS_SIGMARINGEN,
            county: COUNTY_NAME,
            method: "eigene GeoJSON-Landkreisgrenze / Schnittpr\xFCfung",
            boundary: COUNTY_GEOJSON_SOURCE
          },
          grouping: {
            method: "Situation + AoA + geografische Endpunkte",
            endpoint_tolerance_m: ENDPOINT_MATCH_TOLERANCE_M,
            aoa_tolerance_m: AOA_MATCH_TOLERANCE_M
          },
          urls: {
            csv: "/roadworks.csv",
            geojson: "/roadworks.geojson",
            datex_geojson: "/roadworks-datex.geojson",
            vz250: "/icons/road-closed.svg",
            vz123: "/icons/construction.svg",
            combined_example_horizontal: `/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=${COMBINED_ICON_DEFAULT_LAYOUT}`,
            combined_example_vertical: "/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=vertical",
            combined_example_scaled: "/icons/combine.svg?icons=VZ_253.svg,Zusatzzeichen_1053-33_7_5t.svg&layout=vertical&scales=1,0.7"
          },
          combined_icons: {
            enabled: true,
            max_icons: 3,
            layouts: [
              "horizontal",
              "vertical"
            ],
            default_layout: COMBINED_ICON_DEFAULT_LAYOUT,
            default_gap: COMBINED_ICON_DEFAULT_GAP,
            scales_parameter: "Kommagetrennte Faktoren, z. B. scales=1,0.7"
          },
          styles: {
            Vollsperrung: COLOR_ROAD_CLOSED,
            Baustelle: COLOR_CONSTRUCTION,
            icon_zoom: ICON_ZOOM_FACTOR
          }
        },
        null,
        2
      ),
      {
        headers: {
          ...HEADERS,
          "content-type": "application/json; charset=utf-8"
        }
      }
    );
  } catch (error) {
    console.error(
      error
    );
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(
            error
          ),
          stack: error instanceof Error ? error.stack : ""
        },
        null,
        2
      ),
      {
        status: 502,
        headers: {
          ...HEADERS,
          "content-type": "application/json; charset=utf-8"
        }
      }
    );
  }
});
var hybrid_source_default = {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS" } });
    if (!["GET", "HEAD"].includes(req.method)) return new Response("Method not allowed", { status: 405, headers: { "Allow": "GET, HEAD, OPTIONS", "Access-Control-Allow-Origin": "*" } });
    const url = new URL(req.url);
    const isData = ["/roadworks-datex.geojson", "/roadworks.geojson", "/roadworks.csv"].includes(url.pathname);
    const isIcon = ["/icons/construction.svg", "/icons/road-closed.svg", "/icons/combine.svg"].includes(url.pathname);
    const cacheable = isData || isIcon;
    const keyUrl = new URL(url);
    keyUrl.searchParams.delete("v");
    keyUrl.searchParams.sort();
    const key = new Request(keyUrl.toString());
    const cache = typeof caches !== "undefined" ? caches.default : void 0;
    if (cacheable && cache) {
      const hit = await cache.match(key);
      if (hit) {
        const headers2 = new Headers(hit.headers);
        headers2.set("x-edge-cache", "HIT");
        return new Response(req.method === "HEAD" ? null : hit.body, { status: hit.status, headers: headers2 });
      }
    }
    const response = await handleRequest(new Request(req, { method: "GET" }));
    const headers = new Headers(response.headers);
    if (cacheable && response.ok) headers.set("Cache-Control", isData ? "public, max-age=300" : "public, max-age=3600");
    headers.set("x-edge-cache", "MISS");
    const result = new Response(response.body, { status: response.status, headers });
    if (cacheable && result.ok && cache) ctx.waitUntil(cache.put(key, result.clone()));
    return req.method === "HEAD" ? new Response(null, { status: result.status, headers: result.headers }) : result;
  }
};
async function preparedDatexResponse(req) {
  const upstream = await fetch("https://raw.githubusercontent.com/googie0815/umap-daten/main/data/roadworks-datex.geojson", { signal: AbortSignal.timeout(15e3) });
  if (!upstream.ok) return new Response(JSON.stringify({ ok: false, error: "Vorbereitete Baustellendaten nicht verf\xFCgbar", upstream_status: upstream.status }), { status: 502, headers: { ...HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  return new Response(upstream.body, { headers: { ...HEADERS, "content-type": "application/geo+json; charset=utf-8", "x-data-processing": "github-actions" } });
}
export {
  hybrid_source_default as default
};
