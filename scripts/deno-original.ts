import { parse, stringify } from "jsr:@std/csv";
import { XMLParser } from "npm:fast-xml-parser@4.5.3";


// ==================================================
// QUELLEN
// ==================================================

const CSV_SOURCE =
  "https://api.mobidata-bw.de/geoserver/MobiData-BW/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MobiData-BW%3Aroadworks&maxFeatures=20000&outputFormat=csv";

const GEOJSON_SOURCE =
  "https://api.mobidata-bw.de/datasets/traffic/roadworks/roadworks_geojson.json";

const DATEX_SOURCE =
  "https://api.mobidata-bw.de/datasets/traffic/roadworks/roadworks_svzbw.datex2.xml";


// ==================================================
// LANDKREIS SIGMARINGEN
// ==================================================

const FILTER_LANDKREIS_SIGMARINGEN =
  true;

const COUNTY_NAME =
  "Landkreis Sigmaringen";

const COUNTY_GEOJSON_SOURCE =
  "https://raw.githubusercontent.com/googie0815/umap-icons/main/landkreis-sigmaringen.geojson";


// ==================================================
// DARSTELLUNG
// ==================================================

const COLOR_CONSTRUCTION =
  "#EEAD2D";

const COLOR_ROAD_CLOSED =
  "#E6391D";

const ICON_ZOOM_FACTOR =
  1.08;

const ICON_VERSION =
  "6";


// ==================================================
// TOLERANZEN FÜR GEGENRICHTUNGEN
// ==================================================

const ENDPOINT_MATCH_TOLERANCE_M =
  40;

const AOA_MATCH_TOLERANCE_M =
  30;


// ==================================================
// CACHE
// ==================================================

const HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};

const DATEX_CACHE_MS =
  5 * 60 * 1000;

const COUNTY_CACHE_MS =
  24 * 60 * 60 * 1000;

const COMBINED_ICON_CACHE_TTL =
  60 * 60 * 1000;


let datexCache:
  | {
      origin: string;
      expires: number;
      body: string;
    }
  | null = null;


type BoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};


type CountyBoundary = {
  polygons: number[][][][];
  bbox: BoundingBox;
};


type CombinedIconLayout =
  "horizontal" |
  "vertical";


let countyCache:
  | {
      expires: number;
      boundary: CountyBoundary;
    }
  | null = null;


const combinedIconCache =
  new Map<
    string,
    {
      svg: string;
      expires: number;
    }
  >();


// ==================================================
// DATENTYPEN
// ==================================================

type AoaPoint = {
  corridor: string;
  corridorDisplay: string;
  distance: number | null;
  display: string;
};


type DatexPhase = {
  situationId: string;
  recordId: string;

  type: string;

  lineCoordinates: number[][];

  roadNumber: string;

  phaseName: string;
  overallName: string;
  measure: string;
  direction: string;

  length: number | null;
  width: number | null;
  height: number | null;
  maxVehicleWeight: number | null;

  lanesRestricted: number | null;
  lanesOriginal: number | null;

  speed: number | null;

  fromAoa: AoaPoint;
  toAoa: AoaPoint;

  validFrom: string;
  validUntil: string;
  validityDetails: string;
  versionTimeRaw: string;
};


// ==================================================
// ALLGEMEINE HILFSFUNKTIONEN
// ==================================================

function asArray<T>(
  value: T | T[] | undefined | null,
): T[] {

  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
}


function xmlText(
  value: any,
): string {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    Array.isArray(value)
  ) {

    return value.length
      ? xmlText(value[0])
      : "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(value);
  }

  if (
    typeof value === "object" &&
    value["#text"] !== undefined
  ) {

    return String(
      value["#text"],
    );
  }

  return "";
}


function findFirst(
  node: any,
  key: string,
): any {

  if (
    node === undefined ||
    node === null
  ) {
    return undefined;
  }

  if (
    Array.isArray(node)
  ) {

    for (
      const item
      of node
    ) {

      const found =
        findFirst(
          item,
          key,
        );

      if (
        found !== undefined
      ) {
        return found;
      }
    }

    return undefined;
  }

  if (
    typeof node !== "object"
  ) {
    return undefined;
  }

  if (
    Object.prototype
      .hasOwnProperty
      .call(
        node,
        key,
      )
  ) {

    return node[key];
  }

  for (
    const [
      childKey,
      child,
    ]
    of Object.entries(node)
  ) {

    if (
      childKey.startsWith("@_")
    ) {
      continue;
    }

    const found =
      findFirst(
        child,
        key,
      );

    if (
      found !== undefined
    ) {
      return found;
    }
  }

  return undefined;
}


function numberValue(
  value: any,
): number | null {

  const text =
    xmlText(value);

  if (!text) {
    return null;
  }

  const n =
    Number(text);

  return Number.isFinite(n)
    ? n
    : null;
}


function normalizeKeyText(
  value: string,
): string {

  return (
    value || ""
  )
    .toLocaleLowerCase(
      "de-DE",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


// ==================================================
// ÜBERSETZUNGEN
// ==================================================

function typeDe(
  value: string | undefined,
): string {

  return ({
    CONSTRUCTION:
      "Baustelle",

    ROAD_CLOSED:
      "Vollsperrung",
  } as Record<string, string>)[
    value ?? ""
  ] ?? value ?? "";
}


function directionDe(
  value: string | undefined,
): string {

  return ({
    ONE_DIRECTION:
      "eine Richtung",

    BOTH_DIRECTIONS:
      "beide Richtungen",
  } as Record<string, string>)[
    value ?? ""
  ] ?? value ?? "";
}


// ==================================================
// FARBEN
// ==================================================

function lineColor(
  type: string,
): string {

  return (
    type === "ROAD_CLOSED"
      ? COLOR_ROAD_CLOSED
      : COLOR_CONSTRUCTION
  );
}


// ==================================================
// DATUM
// ==================================================

function dateParts(
  value: string | undefined,
) {

  if (!value) {

    return {
      date: "",
      datetime: "",
    };
  }

  const d =
    new Date(value);

  if (
    Number.isNaN(
      d.getTime(),
    )
  ) {

    return {
      date: "",
      datetime: "",
    };
  }

  const parts =
    new Intl.DateTimeFormat(
      "de-DE",
      {
        timeZone:
          "Europe/Berlin",

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23",
      },
    ).formatToParts(d);


  const p:
    Record<string, string> = {};


  for (
    const part
    of parts
  ) {

    p[part.type] =
      part.value;
  }


  const date =
    `${p.day}.${p.month}.${p.year}`;


  return {

    date,

    datetime:
      `${date} ${p.hour}:${p.minute}`,
  };
}


function dateOnly(
  value: string | undefined,
): string {

  if (!value) {
    return "";
  }

  const d =
    new Date(value);

  if (
    Number.isNaN(
      d.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "de-DE",
    {
      timeZone:
        "Europe/Berlin",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "2-digit",
    },
  ).format(d);
}

function dateTimeShort(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(d);
}

function timeOnly(value: string | undefined): string {
  if (!value) return "";
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function findAll(node: any, key: string): any[] {
  const result: any[] = [];
  if (node === undefined || node === null) return result;
  if (Array.isArray(node)) {
    for (const item of node) result.push(...findAll(item, key));
    return result;
  }
  if (typeof node !== "object") return result;
  if (Object.prototype.hasOwnProperty.call(node, key)) {
    const value = node[key];
    if (Array.isArray(value)) result.push(...value);
    else result.push(value);
  }
  for (const [childKey, child] of Object.entries(node)) {
    if (childKey === key || childKey.startsWith("@_")) continue;
    result.push(...findAll(child, key));
  }
  return result;
}

function germanDays(values: string[]): string {
  const labels: Record<string, string> = {
    monday: "Mo", tuesday: "Di", wednesday: "Mi", thursday: "Do",
    friday: "Fr", saturday: "Sa", sunday: "So",
  };
  const order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const days = [...new Set(values.map((v) => v.toLocaleLowerCase().trim()).filter(Boolean))]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (days.length === 7 && order.every((d, i) => days[i] === d)) return "täglich";
  if (days.length === 5 && order.slice(0, 5).every((d, i) => days[i] === d)) return "Mo–Fr";
  if (days.length === 2 && days[0] === "saturday" && days[1] === "sunday") return "Sa–So";
  return days.map((d) => labels[d] ?? d).join(", ");
}

function formatPeriodRange(startRaw: string, endRaw: string): string {
  const startDate = dateOnly(startRaw);
  const endDate = dateOnly(endRaw);
  const startDT = dateTimeShort(startRaw);
  const endDT = dateTimeShort(endRaw);
  if (startDate && endDate && startDate === endDate) {
    const st = startDT.split(", ").pop() ?? "";
    const et = endDT.split(", ").pop() ?? "";
    if (st && et) return `${startDate} ${st}–${et} Uhr`;
  }
  if (startDate && endDate) return `${startDT} – ${endDT} Uhr`;
  return startDT || endDT || "";
}

function validityDetails(validity: any): string {
  if (!validity) return "";
  const specification = findFirst(validity, "validityTimeSpecification");
  if (!specification) return "";
  const details: string[] = [];

  for (const period of asArray(specification?.validPeriod)) {
    const parts: string[] = [];
    const startRaw = xmlText(findFirst(period, "startOfPeriod"));
    const endRaw = xmlText(findFirst(period, "endOfPeriod"));
    const range = formatPeriodRange(startRaw, endRaw);
    if (range) parts.push(range);

    const timeTexts: string[] = [];
    for (const recurring of findAll(period, "recurringTimePeriodOfDay")) {
      const start = timeOnly(xmlText(findFirst(recurring, "startTimeOfPeriod")));
      const end = timeOnly(xmlText(findFirst(recurring, "endTimeOfPeriod")));
      if (start && end) timeTexts.push(`${start}–${end} Uhr`);
    }

    const days = germanDays(
      findAll(period, "applicableDay").map(xmlText).filter(Boolean),
    );
    const uniqueTimes = [...new Set(timeTexts)];
    if (uniqueTimes.length) parts.push(`${days || "täglich"} ${uniqueTimes.join(", ")}`);
    else if (days) parts.push(days);

    const combined = parts.filter(Boolean).join(", ");
    if (combined) details.push(combined);
  }

  for (const exception of asArray(specification?.exceptionPeriod)) {
    const range = formatPeriodRange(
      xmlText(findFirst(exception, "startOfPeriod")),
      xmlText(findFirst(exception, "endOfPeriod")),
    );
    if (range) details.push(`Ausnahme: ${range}`);
  }

  return [...new Set(details)].join("; ");
}


// ==================================================
// STRASSENTEXTE
// ==================================================

function prettifyRoadText(
  value: string,
): string {

  if (!value) {
    return "";
  }

  return value
    .replace(
      /([A-Za-zÄÖÜäöüß])([ABKL]\d{1,4})\b/g,
      "$1 $2",
    )
    .replace(
      /\s{2,}/g,
      " ",
    )
    .trim();
}

function translatedWorkFallback(subjectType: string, workType: string): string {
  const subject = subjectType.trim().toLocaleLowerCase();
  const work = workType.trim().toLocaleLowerCase();

  if (subject === "bridge" && work === "repairwork") return "Brückeninstandsetzung";
  if (subject === "bridge") return "Brückenarbeiten";
  if (subject === "buriedcables") return "Leitungsarbeiten";
  if (subject === "levelcrossing") return "Arbeiten am Bahnübergang";
  if (subject === "tunnel") return "Tunnelarbeiten";
  if (subject === "junction") return "Arbeiten am Knotenpunkt";
  if (subject === "road" && work === "repairwork") return "Instandsetzungsarbeiten an der Straße";
  if (work === "repairwork") return "Instandsetzungsarbeiten";
  if (work === "constructionwork") return "Bauarbeiten";
  if (work === "maintenancework") return "Unterhaltungsarbeiten";
  if (subject === "road") return "Straßenarbeiten";
  return "";
}

function resolveMeasure(
  recordMeasure: string,
  overallMeasure: string,
  record: any,
  kind: string,
): string {
  const direct = (recordMeasure || overallMeasure || "").trim();
  if (direct && !/^sonstiges$/i.test(direct)) return direct;

  const subjectType = xmlText(findFirst(record, "subjectTypeOfWorks"));
  const workType = kind === "MaintenanceWorks"
    ? xmlText(findFirst(record, "roadMaintenanceType"))
    : xmlText(findFirst(record, "constructionWorkType"));

  return translatedWorkFallback(subjectType, workType) || direct;
}


// ==================================================
// LANDKREIS-GEOJSON LESEN
// ==================================================

function extractPolygons(
  node: any,
): number[][][][] {

  if (!node) {
    return [];
  }


  if (
    node.type ===
      "FeatureCollection"
  ) {

    const result:
      number[][][][] = [];


    for (
      const feature
      of node.features ?? []
    ) {

      result.push(
        ...extractPolygons(
          feature,
        ),
      );
    }


    return result;
  }


  if (
    node.type ===
      "Feature"
  ) {

    return extractPolygons(
      node.geometry,
    );
  }


  if (
    node.type ===
      "Polygon" &&
    Array.isArray(
      node.coordinates,
    )
  ) {

    return [
      node.coordinates,
    ];
  }


  if (
    node.type ===
      "MultiPolygon" &&
    Array.isArray(
      node.coordinates,
    )
  ) {

    return node.coordinates;
  }


  if (
    node.type ===
      "GeometryCollection"
  ) {

    const result:
      number[][][][] = [];


    for (
      const geometry
      of node.geometries ?? []
    ) {

      result.push(
        ...extractPolygons(
          geometry,
        ),
      );
    }


    return result;
  }


  return [];
}


// ==================================================
// LANDKREIS BOUNDING BOX
// ==================================================

function calculateCountyBBox(
  polygons: number[][][][],
): BoundingBox {

  let west =
    Infinity;

  let south =
    Infinity;

  let east =
    -Infinity;

  let north =
    -Infinity;


  for (
    const polygon
    of polygons
  ) {

    for (
      const ring
      of polygon
    ) {

      for (
        const point
        of ring
      ) {

        if (
          !Array.isArray(point) ||
          point.length < 2
        ) {
          continue;
        }


        const lon =
          Number(point[0]);

        const lat =
          Number(point[1]);


        if (
          !Number.isFinite(lon) ||
          !Number.isFinite(lat)
        ) {
          continue;
        }


        west =
          Math.min(
            west,
            lon,
          );

        east =
          Math.max(
            east,
            lon,
          );

        south =
          Math.min(
            south,
            lat,
          );

        north =
          Math.max(
            north,
            lat,
          );
      }
    }
  }


  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north)
  ) {

    throw new Error(
      "Landkreis-Grenze enthält keine gültigen Koordinaten.",
    );
  }


  return {
    west,
    south,
    east,
    north,
  };
}


// ==================================================
// LANDKREIS LADEN
// ==================================================

async function getCountyBoundary():
  Promise<CountyBoundary> {

  const now =
    Date.now();


  if (
    countyCache &&
    countyCache.expires >
      now
  ) {

    return countyCache
      .boundary;
  }


  const response =
    await fetch(
      COUNTY_GEOJSON_SOURCE,
      {
        headers: {

          "user-agent":
            "uMap-roadworks-proxy/1.0",

          "accept":
            "application/geo+json, application/json",
        },
      },
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Landkreis-Grenze GitHub: HTTP ${response.status}`,
    );
  }


  const geojson =
    await response.json();


  const polygons =
    extractPolygons(
      geojson,
    );


  if (
    polygons.length === 0
  ) {

    throw new Error(
      "landkreis-sigmaringen.geojson enthält kein Polygon.",
    );
  }


  const boundary:
    CountyBoundary = {

    polygons,

    bbox:
      calculateCountyBBox(
        polygons,
      ),
  };


  countyCache = {

    expires:
      now +
      COUNTY_CACHE_MS,

    boundary,
  };


  return boundary;
}


// ==================================================
// PUNKT IM RING
// ==================================================

function pointInRing(
  point: number[],
  ring: number[][],
): boolean {

  const x =
    point[0];

  const y =
    point[1];

  let inside =
    false;


  for (
    let i = 0,
      j = ring.length - 1;

    i < ring.length;

    j = i++
  ) {

    const xi =
      ring[i][0];

    const yi =
      ring[i][1];

    const xj =
      ring[j][0];

    const yj =
      ring[j][1];


    const crosses =
      (
        (yi > y) !==
        (yj > y)
      ) &&
      (
        x <
        (
          (xj - xi) *
          (y - yi)
        ) /
        (
          yj - yi
        ) +
        xi
      );


    if (crosses) {

      inside =
        !inside;
    }
  }


  return inside;
}


// ==================================================
// PUNKT IM POLYGON
// ==================================================

function pointInPolygon(
  point: number[],
  polygon: number[][][],
): boolean {

  if (
    polygon.length === 0
  ) {
    return false;
  }


  if (
    !pointInRing(
      point,
      polygon[0],
    )
  ) {

    return false;
  }


  for (
    let i = 1;
    i < polygon.length;
    i++
  ) {

    if (
      pointInRing(
        point,
        polygon[i],
      )
    ) {

      return false;
    }
  }


  return true;
}


function pointInCounty(
  point: number[],
  boundary: CountyBoundary,
): boolean {

  for (
    const polygon
    of boundary.polygons
  ) {

    if (
      pointInPolygon(
        point,
        polygon,
      )
    ) {

      return true;
    }
  }


  return false;
}


// ==================================================
// SEGMENT-SCHNITTPRÜFUNG
// ==================================================

function orientation(
  a: number[],
  b: number[],
  c: number[],
): number {

  return (
    (b[0] - a[0]) *
      (c[1] - a[1]) -
    (b[1] - a[1]) *
      (c[0] - a[0])
  );
}


function pointOnSegment(
  a: number[],
  b: number[],
  p: number[],
): boolean {

  const epsilon =
    1e-10;


  if (
    Math.abs(
      orientation(
        a,
        b,
        p,
      ),
    ) >
      epsilon
  ) {

    return false;
  }


  return (
    p[0] >=
      Math.min(
        a[0],
        b[0],
      ) -
        epsilon &&

    p[0] <=
      Math.max(
        a[0],
        b[0],
      ) +
        epsilon &&

    p[1] >=
      Math.min(
        a[1],
        b[1],
      ) -
        epsilon &&

    p[1] <=
      Math.max(
        a[1],
        b[1],
      ) +
        epsilon
  );
}


function segmentsIntersect(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): boolean {

  const epsilon =
    1e-10;


  const o1 =
    orientation(
      a,
      b,
      c,
    );

  const o2 =
    orientation(
      a,
      b,
      d,
    );

  const o3 =
    orientation(
      c,
      d,
      a,
    );

  const o4 =
    orientation(
      c,
      d,
      b,
    );


  if (
    (
      (
        o1 > epsilon &&
        o2 < -epsilon
      ) ||
      (
        o1 < -epsilon &&
        o2 > epsilon
      )
    ) &&
    (
      (
        o3 > epsilon &&
        o4 < -epsilon
      ) ||
      (
        o3 < -epsilon &&
        o4 > epsilon
      )
    )
  ) {

    return true;
  }


  if (
    Math.abs(o1) <= epsilon &&
    pointOnSegment(
      a,
      b,
      c,
    )
  ) {
    return true;
  }


  if (
    Math.abs(o2) <= epsilon &&
    pointOnSegment(
      a,
      b,
      d,
    )
  ) {
    return true;
  }


  if (
    Math.abs(o3) <= epsilon &&
    pointOnSegment(
      c,
      d,
      a,
    )
  ) {
    return true;
  }


  if (
    Math.abs(o4) <= epsilon &&
    pointOnSegment(
      c,
      d,
      b,
    )
  ) {
    return true;
  }


  return false;
}


// ==================================================
// BOUNDING BOX EINER LINIE
// ==================================================

function lineBBox(
  line: number[][],
): BoundingBox {

  let west =
    Infinity;

  let south =
    Infinity;

  let east =
    -Infinity;

  let north =
    -Infinity;


  for (
    const point
    of line
  ) {

    west =
      Math.min(
        west,
        point[0],
      );

    east =
      Math.max(
        east,
        point[0],
      );

    south =
      Math.min(
        south,
        point[1],
      );

    north =
      Math.max(
        north,
        point[1],
      );
  }


  return {
    west,
    south,
    east,
    north,
  };
}


function bboxIntersects(
  a: BoundingBox,
  b: BoundingBox,
): boolean {

  return !(
    a.east < b.west ||
    a.west > b.east ||
    a.north < b.south ||
    a.south > b.north
  );
}


// ==================================================
// BAUSTELLE IM LK SIGMARINGEN?
// ==================================================

function lineIntersectsCounty(
  line: number[][],
  boundary: CountyBoundary,
): boolean {

  if (
    line.length === 0
  ) {
    return false;
  }


  if (
    !bboxIntersects(
      lineBBox(line),
      boundary.bbox,
    )
  ) {

    return false;
  }


  for (
    const point
    of line
  ) {

    if (
      pointInCounty(
        point,
        boundary,
      )
    ) {

      return true;
    }
  }


  for (
    let i = 0;
    i < line.length - 1;
    i++
  ) {

    const a =
      line[i];

    const b =
      line[
        i + 1
      ];


    for (
      const polygon
      of boundary.polygons
    ) {

      for (
        const ring
        of polygon
      ) {

        for (
          let j = 0;
          j < ring.length;
          j++
        ) {

          const c =
            ring[j];

          const d =
            ring[
              (j + 1) %
              ring.length
            ];


          if (
            segmentsIntersect(
              a,
              b,
              c,
              d,
            )
          ) {

            return true;
          }
        }
      }
    }
  }


  return false;
}


// ==================================================
// ENTFERNUNG
// ==================================================

function distanceMeters(
  a: number[],
  b: number[],
): number {

  const earthRadius =
    6371000;


  const toRad =
    (
      degrees:
        number,
    ) =>
      degrees *
      Math.PI /
      180;


  const lat1 =
    toRad(
      a[1],
    );

  const lat2 =
    toRad(
      b[1],
    );


  const deltaLat =
    toRad(
      b[1] -
      a[1],
    );

  const deltaLon =
    toRad(
      b[0] -
      a[0],
    );


  const h =
    Math.sin(
      deltaLat / 2,
    ) ** 2 +

    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(
      deltaLon / 2,
    ) ** 2;


  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(h),
      Math.sqrt(
        1 - h,
      ),
    )
  );
}


// ==================================================
// ALTE CSV/GEOJSON-DATEN
// ==================================================

function enrichProperties(
  properties:
    Record<string, any> = {},
) {

  const start =
    dateParts(
      properties.starttime,
    );

  const end =
    dateParts(
      properties.endtime,
    );


  return {

    ...properties,

    type_de:
      typeDe(
        properties.type,
      ),

    direction_de:
      directionDe(
        properties.direction,
      ),

    startdate:
      start.date,

    enddate:
      end.date,

    startdatetime:
      start.datetime,

    enddatetime:
      end.datetime,
  };
}


function endpoints(
  geometry: any,
): [number[], number[]] | null {

  if (!geometry) {
    return null;
  }


  if (
    geometry.type ===
      "LineString" &&
    Array.isArray(
      geometry.coordinates,
    ) &&
    geometry.coordinates.length >=
      2
  ) {

    const line =
      geometry.coordinates;


    return [
      line[0],
      line[
        line.length - 1
      ],
    ];
  }


  if (
    geometry.type ===
      "MultiLineString" &&
    Array.isArray(
      geometry.coordinates,
    )
  ) {

    const lines =
      geometry.coordinates.filter(
        (line: any) =>
          Array.isArray(line) &&
          line.length > 0,
      );


    if (
      !lines.length
    ) {
      return null;
    }


    const first =
      lines[0];

    const last =
      lines[
        lines.length - 1
      ];


    return [
      first[0],
      last[
        last.length - 1
      ],
    ];
  }


  return null;
}


// ==================================================
// ICONS
// ==================================================

function iconPath(
  type: string,
): string {

  return (
    type ===
      "ROAD_CLOSED"
      ? "/icons/road-closed.svg"
      : "/icons/construction.svg"
  );
}


function buildIconUrl(
  origin: string,
  type: string,
): string {

  return (
    `${origin}${iconPath(type)}` +
    `?v=${ICON_VERSION}`
  );
}


function endpointFeature(
  original: any,
  pointCoordinate: number[],
  position:
    "start" | "end",
  origin: string,
) {

  const props =
    enrichProperties(
      original.properties,
    );


  return {

    type:
      "Feature",

    geometry: {

      type:
        "Point",

      coordinates:
        pointCoordinate,
    },

    properties: {

      ...props,

      name:
        `${props.type_de || "Baustelle"} – ${
          position ===
            "start"
            ? "Anfang"
            : "Ende"
        }`,

      _umap_options: {

        iconUrl:
          buildIconUrl(
            origin,
            props.type,
          ),

        iconClass:
          "Raw",
      },
    },
  };
}


// ==================================================
// ALTES GEOJSON
// ==================================================

async function geoJsonResponse(
  req: Request,
) {

  const upstream =
    await fetch(
      GEOJSON_SOURCE,
      {
        headers: {

          "user-agent":
            "uMap-roadworks-proxy/1.0",
        },
      },
    );


  if (
    !upstream.ok
  ) {

    throw new Error(
      `MobiData GeoJSON: ${upstream.status}`,
    );
  }


  const data =
    await upstream.json();


  const origin =
    new URL(
      req.url,
    ).origin;


  const features:
    any[] = [];


  for (
    const feature
    of data.features ?? []
  ) {

    features.push({

      ...feature,

      properties:
        enrichProperties(
          feature.properties,
        ),
    });


    const ends =
      endpoints(
        feature.geometry,
      );


    if (!ends) {
      continue;
    }


    features.push(

      endpointFeature(
        feature,
        ends[0],
        "start",
        origin,
      ),
    );


    if (
      ends[0][0] !==
        ends[1][0] ||

      ends[0][1] !==
        ends[1][1]
    ) {

      features.push(

        endpointFeature(
          feature,
          ends[1],
          "end",
          origin,
        ),
      );
    }
  }


  return new Response(

    JSON.stringify(
      {

        type:
          "FeatureCollection",

        features,
      },
    ),

    {
      headers: {

        ...HEADERS,

        "content-type":
          "application/geo+json; charset=utf-8",
      },
    },
  );
}


// ==================================================
// ALTES CSV
// ==================================================

async function csvResponse() {

  const upstream =
    await fetch(
      CSV_SOURCE,
      {
        headers: {

          "user-agent":
            "uMap-roadworks-proxy/1.0",
        },
      },
    );


  if (
    !upstream.ok
  ) {

    throw new Error(
      `MobiData CSV: ${upstream.status}`,
    );
  }


  const text =
    await upstream.text();


  const rows =
    parse(
      text,
      {
        skipFirstRow:
          true,
      },
    );


  const enriched =
    rows.map(
      (
        row:
          Record<string, string>,
      ) =>
        enrichProperties(
          row,
        ),
    );


  if (
    enriched.length === 0
  ) {

    return new Response(
      "",
      {
        headers: {

          ...HEADERS,

          "content-type":
            "text/csv; charset=utf-8",
        },
      },
    );
  }


  return new Response(

    stringify(
      enriched,
      {
        columns:
          Object.keys(
            enriched[0],
          ),
      },
    ),

    {
      headers: {

        ...HEADERS,

        "content-type":
          "text/csv; charset=utf-8",
      },
    },
  );
}


// ==================================================
// DATEX KOMMENTARE
// ==================================================

function commentsByType(
  node: any,
): Record<string, string[]> {

  const result:
    Record<string, string[]> = {};


  for (
    const item
    of asArray(
      node?.generalPublicComment,
    )
  ) {

    const comment =
      xmlText(
        findFirst(
          item?.comment,
          "value",
        ),
      );


    const commentType =
      xmlText(
        findFirst(
          item?.commentExtension,
          "commentType2",
        ),
      );


    if (!comment) {
      continue;
    }


    const key =
      commentType ||
      "comment";


    if (
      !result[key]
    ) {

      result[key] =
        [];
    }


    result[key].push(
      comment,
    );
  }


  return result;
}


function firstComment(
  comments:
    Record<string, string[]>,
  key: string,
): string {

  return (
    comments[key]?.[0] ??
    ""
  );
}


// ==================================================
// DATEX KOORDINATEN
// ==================================================

function coordinatesFromPosList(
  value: any,
): number[][] {

  const text =
    xmlText(value)
      .trim();


  if (!text) {
    return [];
  }


  const values =
    text
      .split(/\s+/)
      .map(Number)
      .filter(
        Number.isFinite,
      );


  const result:
    number[][] = [];


  for (
    let i = 0;
    i + 1 < values.length;
    i += 2
  ) {

    const latitude =
      values[i];

    const longitude =
      values[
        i + 1
      ];


    result.push(
      [
        longitude,
        latitude,
      ],
    );
  }


  return result;
}


// ==================================================
// AoA / STATION
// ==================================================

function readAoaPoint(
  point: any,
): AoaPoint {

  if (!point) {

    return {

      corridor:
        "",

      corridorDisplay:
        "",

      distance:
        null,

      display:
        "",
    };
  }


  const fromReferent =
    findFirst(
      point,
      "fromReferent",
    );


  const towardsReferent =
    findFirst(
      point,
      "towardsReferent",
    );


  const fromId =
    xmlText(
      findFirst(
        fromReferent,
        "referentIdentifier",
      ),
    );


  const towardsId =
    xmlText(
      findFirst(
        towardsReferent,
        "referentIdentifier",
      ),
    );


  const distance =
    numberValue(
      findFirst(
        point,
        "distanceAlong",
      ),
    );


  const corridor =
    `${fromId}${towardsId}`;


  const corridorDisplay =
    [fromId, towardsId]
      .filter(Boolean)
      .join(" → ");


  return {

    corridor,

    corridorDisplay,

    distance,

    display:
      corridorDisplay
        ? (
          distance !== null
            ? `${corridorDisplay} / ${Math.round(distance)} m`
            : corridorDisplay
        )
        : "",
  };
}


// ==================================================
// FORMATIERUNG
// ==================================================

function formatLength(
  value: number | null,
): string {

  return value === null
    ? ""
    : `${Math.round(value)} m`;
}


function formatWidth(
  value: number | null,
): string {

  return value === null
    ? ""
    : `${
        value
          .toFixed(2)
          .replace(
            ".",
            ",",
          )
      } m`;
}


function formatSpeed(
  value: number | null,
): string {

  return value === null
    ? ""
    : `${Math.round(value)} km/h`;
}

function formatWeight(value: number | null): string {
  if (value === null) return "";
  const text = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(".", ",");
  return `${text} t`;
}

function groupMinimum(
  phases: DatexPhase[],
  selector: (phase: DatexPhase) => number | null,
): number | null {
  const values = phases
    .map(selector)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return values.length ? Math.min(...values) : null;
}

function groupValidityDetails(phases: DatexPhase[]): string {
  return [...new Set(phases.map((phase) => phase.validityDetails).filter(Boolean))].join("; ");
}

function latestVersionTime(phases: DatexPhase[]): string {
  let latestRaw = "";
  let latestTime = -Infinity;
  for (const phase of phases) {
    const raw = phase.versionTimeRaw;
    const time = new Date(raw).getTime();
    if (raw && !Number.isNaN(time) && time > latestTime) {
      latestRaw = raw;
      latestTime = time;
    }
  }
  return latestRaw ? `${dateTimeShort(latestRaw)} Uhr` : "";
}


// ==================================================
// DATEX RECORD
// ==================================================

function recordType(
  record: any,
): string {

  return xmlText(
    record?.["@_type"] ??
    record?.["@_xsi:type"],
  );
}


function recordId(
  record: any,
): string {

  return xmlText(
    record?.["@_id"],
  );
}


function recordIsExpired(
  record: any,
  now: number,
): boolean {

  const endRaw =
    xmlText(
      findFirst(
        record?.validity,
        "overallEndTime",
      ),
    );


  if (!endRaw) {
    return false;
  }


  const endTime =
    new Date(
      endRaw,
    ).getTime();


  return (
    !Number.isNaN(
      endTime,
    ) &&
    endTime < now
  );
}


// ==================================================
// EXAKTE KOORDINATENPRÜFUNG
// ==================================================

function sameCoordinate(
  a: number[],
  b: number[],
): boolean {

  const tolerance =
    0.00001;


  return (
    Math.abs(
      a[0] - b[0],
    ) <= tolerance &&

    Math.abs(
      a[1] - b[1],
    ) <= tolerance
  );
}


// ==================================================
// AoA-PUNKTE VERGLEICHEN
// ==================================================

function aoaPointMatches(
  a: AoaPoint,
  b: AoaPoint,
): boolean {

  if (
    !a.corridor ||
    !b.corridor ||
    a.corridor !==
      b.corridor
  ) {

    return false;
  }


  if (
    a.distance === null ||
    b.distance === null
  ) {

    return false;
  }


  return (
    Math.abs(
      a.distance -
      b.distance,
    ) <=
      AOA_MATCH_TOLERANCE_M
  );
}


// ==================================================
// AoA-BEREICH IDENTISCH?
// ==================================================

function sameAoaSection(
  a: DatexPhase,
  b: DatexPhase,
): boolean {

  const direct =
    aoaPointMatches(
      a.fromAoa,
      b.fromAoa,
    ) &&
    aoaPointMatches(
      a.toAoa,
      b.toAoa,
    );


  const reverse =
    aoaPointMatches(
      a.fromAoa,
      b.toAoa,
    ) &&
    aoaPointMatches(
      a.toAoa,
      b.fromAoa,
    );


  return (
    direct ||
    reverse
  );
}


// ==================================================
// AoA GEGENRICHTUNG?
// ==================================================

function oppositeAoaSection(
  a: DatexPhase,
  b: DatexPhase,
): boolean {

  return (
    aoaPointMatches(
      a.fromAoa,
      b.toAoa,
    ) &&
    aoaPointMatches(
      a.toAoa,
      b.fromAoa,
    )
  );
}


// ==================================================
// GEOMETRIE-ENDPUNKTE VERGLEICHEN
// ==================================================

function endpointRelation(
  a: DatexPhase,
  b: DatexPhase,
):
  "same" |
  "opposite" |
  null {

  if (
    a.lineCoordinates.length <
      2 ||
    b.lineCoordinates.length <
      2
  ) {

    return null;
  }


  const aStart =
    a.lineCoordinates[0];

  const aEnd =
    a.lineCoordinates[
      a.lineCoordinates.length -
      1
    ];


  const bStart =
    b.lineCoordinates[0];

  const bEnd =
    b.lineCoordinates[
      b.lineCoordinates.length -
      1
    ];


  const directStart =
    distanceMeters(
      aStart,
      bStart,
    );

  const directEnd =
    distanceMeters(
      aEnd,
      bEnd,
    );


  if (
    directStart <=
      ENDPOINT_MATCH_TOLERANCE_M &&
    directEnd <=
      ENDPOINT_MATCH_TOLERANCE_M
  ) {

    return "same";
  }


  const oppositeStart =
    distanceMeters(
      aStart,
      bEnd,
    );

  const oppositeEnd =
    distanceMeters(
      aEnd,
      bStart,
    );


  if (
    oppositeStart <=
      ENDPOINT_MATCH_TOLERANCE_M &&
    oppositeEnd <=
      ENDPOINT_MATCH_TOLERANCE_M
  ) {

    return "opposite";
  }


  return null;
}


// ==================================================
// GLEICHER STRASSENABSCHNITT?
// ==================================================

function samePhysicalSection(
  a: DatexPhase,
  b: DatexPhase,
): boolean {

  if (
    sameAoaSection(
      a,
      b,
    )
  ) {

    return true;
  }


  return (
    endpointRelation(
      a,
      b,
    ) !== null
  );
}


// ==================================================
// GEGENRICHTUNG?
// ==================================================

function phasesAreOpposite(
  a: DatexPhase,
  b: DatexPhase,
): boolean {

  if (
    oppositeAoaSection(
      a,
      b,
    )
  ) {

    return true;
  }


  return (
    endpointRelation(
      a,
      b,
    ) ===
      "opposite"
  );
}


function hasOppositeDirection(
  phases:
    DatexPhase[],
): boolean {

  if (
    phases.length <
      2
  ) {

    return false;
  }


  for (
    let i = 0;
    i < phases.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < phases.length;
      j++
    ) {

      if (
        phasesAreOpposite(
          phases[i],
          phases[j],
        )
      ) {

        return true;
      }
    }
  }


  return false;
}


// ==================================================
// BASIS-SCHLÜSSEL FÜR BAUPHASEN
// ==================================================

function keyNumber(
  value:
    number | null,
  digits = 2,
): string {

  return value === null
    ? ""
    : value.toFixed(
        digits,
      );
}


function phaseBaseKey(
  phase:
    DatexPhase,
): string {

  return [

    normalizeKeyText(
      phase.situationId,
    ),

    normalizeKeyText(
      phase.roadNumber,
    ),

    normalizeKeyText(
      phase.phaseName,
    ),

    normalizeKeyText(
      phase.measure,
    ),

    phase.type,

    keyNumber(
      phase.width,
      2,
    ),

    keyNumber(
      phase.lanesRestricted,
      0,
    ),

    keyNumber(
      phase.lanesOriginal,
      0,
    ),

    keyNumber(
      phase.speed,
      0,
    ),

    phase.validFrom,

    phase.validUntil,

  ].join("|");
}


// ==================================================
// BAUPHASEN ROBUST GRUPPIEREN
// ==================================================

function groupDatexPhases(
  phases:
    DatexPhase[],
): DatexPhase[][] {

  const buckets =
    new Map<
      string,
      DatexPhase[][]
    >();


  for (
    const phase
    of phases
  ) {

    const key =
      phaseBaseKey(
        phase,
      );


    if (
      !buckets.has(
        key,
      )
    ) {

      buckets.set(
        key,
        [],
      );
    }


    const groups =
      buckets.get(
        key,
      )!;


    let matchingGroup:
      DatexPhase[] |
      null =
        null;


    for (
      const group
      of groups
    ) {

      const matches =
        group.some(
          (
            existingPhase,
          ) =>
            samePhysicalSection(
              existingPhase,
              phase,
            ),
        );


      if (matches) {

        matchingGroup =
          group;

        break;
      }
    }


    if (
      matchingGroup
    ) {

      matchingGroup.push(
        phase,
      );

    } else {

      groups.push(
        [
          phase,
        ],
      );
    }
  }


  const result:
    DatexPhase[][] = [];


  for (
    const groups
    of buckets.values()
  ) {

    result.push(
      ...groups,
    );
  }


  return result;
}


// ==================================================
// DETAILLIERTESTE GEOMETRIE AUSWÄHLEN
// ==================================================

function representativePhase(
  phases:
    DatexPhase[],
): DatexPhase {

  let best =
    phases[0];


  for (
    const phase
    of phases
  ) {

    if (
      phase.lineCoordinates.length >
      best.lineCoordinates.length
    ) {

      best =
        phase;
    }
  }


  return best;
}


// ==================================================
// RICHTUNG
// ==================================================

function displayDirection(
  phases:
    DatexPhase[],
): string {

  if (
    hasOppositeDirection(
      phases,
    )
  ) {

    return "beide Richtungen";
  }


  const direction =
    prettifyRoadText(
      phases[0]
        .direction,
    );


  if (direction) {

    return direction;
  }


  return "";
}


// ==================================================
// AoA BEI GEGENRICHTUNGEN
// ==================================================

function mergedAoaRange(
  phases:
    DatexPhase[],
): string {

  const points:
    AoaPoint[] = [];


  for (
    const phase
    of phases
  ) {

    if (
      phase.fromAoa
        .corridor
    ) {

      points.push(
        phase.fromAoa,
      );
    }


    if (
      phase.toAoa
        .corridor
    ) {

      points.push(
        phase.toAoa,
      );
    }
  }


  if (
    points.length ===
      0
  ) {
    return "";
  }


  const corridors =
    [
      ...new Set(
        points
          .map(
            (
              point,
            ) =>
              point.corridor,
          )
          .filter(Boolean),
      ),
    ];


  if (
    corridors.length ===
      1
  ) {

    const distances =
      points
        .map(
          (
            point,
          ) =>
            point.distance,
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        );


    const corridorDisplay =
      points.find(
        (point) =>
          point.corridor === corridors[0] &&
          point.corridorDisplay,
      )?.corridorDisplay ||
      corridors[0];


    if (
      distances.length ===
        0
    ) {

      return corridorDisplay;
    }


    const minimum =
      Math.round(
        Math.min(
          ...distances,
        ),
      );


    const maximum =
      Math.round(
        Math.max(
          ...distances,
        ),
      );


    if (
      minimum ===
        maximum
    ) {

      return (
        `${corridorDisplay} / ${minimum} m`
      );
    }


    return (
      `${corridorDisplay} / ${minimum}–${maximum} m`
    );
  }


  const displays =
    [
      ...new Set(
        points
          .map(
            (
              point,
            ) =>
              point.display,
          )
          .filter(Boolean),
      ),
    ];


  return displays.join(
    " ↔ ",
  );
}


// ==================================================
// AoA BEI EINER RICHTUNG
// ==================================================

function singleDirectionAoa(
  phase:
    DatexPhase,
): string {

  const from =
    phase.fromAoa;

  const to =
    phase.toAoa;


  if (
    from.corridor &&
    to.corridor &&
    from.corridor ===
      to.corridor &&
    from.distance !== null &&
    to.distance !== null
  ) {

    return (
      `${from.corridorDisplay || from.corridor} / ` +
      `${Math.round(from.distance)} → ${Math.round(to.distance)} m`
    );
  }


  if (
    from.display &&
    to.display
  ) {

    return (
      `${from.display} → ${to.display}`
    );
  }


  return (
    from.display ||
    to.display ||
    ""
  );
}


function displayAoa(
  phases:
    DatexPhase[],
): string {

  if (
    hasOppositeDirection(
      phases,
    )
  ) {

    return mergedAoaRange(
      phases,
    );
  }


  return singleDirectionAoa(
    phases[0],
  );
}


// ==================================================
// POPUP
// ==================================================

function popupTitle(
  phase:
    DatexPhase,
): string {

  let title =
    phase.overallName ||
    phase.phaseName ||
    `${phase.roadNumber} Baustelle`;


  const measure =
    phase.measure
      .trim();


  if (
    measure &&
    title
      .toLocaleLowerCase(
        "de-DE",
      )
      .endsWith(
        measure
          .toLocaleLowerCase(
            "de-DE",
          ),
      )
  ) {

    title =
      title
        .slice(
          0,
          title.length -
            measure.length,
        )
        .trim();
  }


  return prettifyRoadText(
    title,
  );
}


function popupLine(
  label: string,
  value: string,
): string {

  if (!value) {
    return "";
  }


  return (
    `**${label}:** ${value}`
  );
}


function popupDescription(
  phases: DatexPhase[],
): string {

  const phase = phases[0];

  const lanes =
    phase.lanesRestricted !== null &&
    phase.lanesOriginal !== null
      ? `${Math.round(phase.lanesRestricted)} von ${Math.round(phase.lanesOriginal)}`
      : "";

  const height = groupMinimum(phases, (item) => item.height);
  const maxVehicleWeight = groupMinimum(phases, (item) => item.maxVehicleWeight);
  const timeDetails = groupValidityDetails(phases);
  const lastChanged = latestVersionTime(phases);

  const lines: string[] = [];

  if (phase.phaseName) {
    lines.push(`**${phase.phaseName}**`);
    lines.push("");
  }

  lines.push(popupLine("Maßnahme", phase.measure));
  lines.push(popupLine("Art der Maßnahme", typeDe(phase.type)));
  lines.push(popupLine("Richtung", displayDirection(phases)));
  lines.push(popupLine("Länge", formatLength(phase.length)));
  lines.push(popupLine("Durchfahrtsbreite", formatWidth(phase.width)));
  lines.push(popupLine("Durchfahrtshöhe", formatWidth(height)));
  lines.push(popupLine("Max. Fahrzeuggewicht", formatWeight(maxVehicleWeight)));
  lines.push(popupLine("Spursperrung", lanes));
  lines.push(popupLine("Höchstgeschwindigkeit", formatSpeed(phase.speed)));

  const aoa = displayAoa(phases);

  if (aoa) {
    lines.push("");
    lines.push("### GROSSRAUM- UND SCHWERTRANSPORTE");
    lines.push("");
    lines.push(popupLine("AoA/Station", aoa));
  }

  lines.push("");
  lines.push(popupLine("Gültig ab", phase.validFrom));
  lines.push(popupLine("Gültig bis", phase.validUntil));

  if (timeDetails) {
    lines.push(
      popupLine(
        phase.type === "ROAD_CLOSED" ? "Sperrzeiten" : "Gültigkeitszeiten",
        timeDetails,
      ),
    );
  }

  if (lastChanged) {
    lines.push("");
    lines.push(popupLine("Letzte Änderung", lastChanged));
  }

  const cleaned: string[] = [];
  for (const line of lines) {
    if (line === "" && (cleaned.length === 0 || cleaned[cleaned.length - 1] === "")) continue;
    cleaned.push(line);
  }
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === "") cleaned.pop();

  return cleaned.join("\n");
}


// ==================================================
// DATEX PROPERTIES
// ==================================================

function datexProperties(
  phases: DatexPhase[],
) {

  const phase = phases[0];

  const lanes =
    phase.lanesRestricted !== null &&
    phase.lanesOriginal !== null
      ? `${Math.round(phase.lanesRestricted)} von ${Math.round(phase.lanesOriginal)}`
      : "";

  const height = groupMinimum(phases, (item) => item.height);
  const maxVehicleWeight = groupMinimum(phases, (item) => item.maxVehicleWeight);
  const timeDetails = groupValidityDetails(phases);
  const lastChanged = latestVersionTime(phases);

  return {
    name: popupTitle(phase),
    description: popupDescription(phases),
    bezeichnung: phase.phaseName,
    massnahme: phase.measure,
    strasse: phase.roadNumber,
    richtung: displayDirection(phases),
    laenge: formatLength(phase.length),
    durchfahrtsbreite: formatWidth(phase.width),
    durchfahrtshoehe: formatWidth(height),
    max_fahrzeuggewicht: formatWeight(maxVehicleWeight),
    spursperrung: lanes,
    hoechstgeschwindigkeit: formatSpeed(phase.speed),
    aoa_station: displayAoa(phases),
    aoa_von: phase.fromAoa.display,
    aoa_nach: phase.toAoa.display,
    gueltig_ab: phase.validFrom,
    gueltig_bis: phase.validUntil,
    zeitliche_gueltigkeit: timeDetails,
    sperrzeiten: phase.type === "ROAD_CLOSED" ? timeDetails : "",
    gueltigkeitszeiten: phase.type !== "ROAD_CLOSED" ? timeDetails : "",
    letzte_aenderung: lastChanged,
    art: typeDe(phase.type),
  };
}


// ==================================================
// DATEX MARKER
// ==================================================

function datexEndpointFeature(
  properties:
    Record<string, any>,

  pointCoordinate:
    number[],

  origin:
    string,

  type:
    string,
) {

  return {

    type:
      "Feature",

    geometry: {

      type:
        "Point",

      coordinates:
        pointCoordinate,
    },

    properties: {

      ...properties,

      _umap_options: {

        iconUrl:
          buildIconUrl(
            origin,
            type,
          ),

        iconClass:
          "Raw",
      },
    },
  };
}


// ==================================================
// DATEX → GEOJSON
// ==================================================

async function buildDatexGeoJson(
  origin: string,
) {

  let countyBoundary:
    CountyBoundary | null =
      null;


  if (
    FILTER_LANDKREIS_SIGMARINGEN
  ) {

    countyBoundary =
      await getCountyBoundary();
  }


  const upstream =
    await fetch(
      DATEX_SOURCE,
      {
        headers: {

          "user-agent":
            "uMap-roadworks-proxy/1.0",
        },
      },
    );


  if (
    !upstream.ok
  ) {

    throw new Error(
      `MobiData DATEX II: ${upstream.status}`,
    );
  }


  const xml =
    await upstream.text();


  const parser =
    new XMLParser(
      {

        ignoreAttributes:
          false,

        attributeNamePrefix:
          "@_",

        removeNSPrefix:
          true,

        trimValues:
          true,

        parseTagValue:
          false,

        parseAttributeValue:
          false,
      },
    );


  const parsed =
    parser.parse(
      xml,
    );


  const situations =
    asArray(
      parsed
        ?.d2LogicalModel
        ?.payloadPublication
        ?.situation,
    );


  const now =
    Date.now();


  const allPhases:
    DatexPhase[] = [];


  for (
    const situation
    of situations
  ) {

    const situationId =
      xmlText(
        situation?.["@_id"],
      );


    const records =
      asArray(
        situation
          ?.situationRecord,
      );


    const closedRecordIds =
      new Set<string>();


    for (
      const record
      of records
    ) {

      if (
        recordType(
          record,
        ) !==
          "RoadOrCarriagewayOrLaneManagement"
      ) {
        continue;
      }


      const managementType =
        xmlText(
          findFirst(
            record,
            "roadOrCarriagewayOrLaneManagementType",
          ),
        );


      if (
        managementType !==
          "roadClosed"
      ) {
        continue;
      }


      const managedCause =
        findFirst(
          record,
          "managedCause",
        );


      const targetId =
        xmlText(
          managedCause
            ?.["@_id"],
        );


      if (targetId) {

        closedRecordIds.add(
          targetId,
        );
      }


      const managementId =
        recordId(
          record,
        );


      if (
        managementId
          .toLocaleLowerCase()
          .endsWith(
            "-sperrung",
          )
      ) {

        closedRecordIds.add(
          managementId.slice(
            0,
            -"-sperrung".length,
          ),
        );
      }
    }


    const overallSituation =
      findFirst(
        situation
          ?.situationExtension,
        "overallSituation",
      );


    const overallComments =
      commentsByType(
        overallSituation ??
          {},
      );


    const overallName =
      firstComment(
        overallComments,
        "roadworksName",
      );


    const overallMeasure =
      firstComment(
        overallComments,
        "roadworksType",
      );


    const overallStartRaw =
      xmlText(
        findFirst(
          overallSituation,
          "overallStartTime",
        ),
      );


    const overallEndRaw =
      xmlText(
        findFirst(
          overallSituation,
          "overallEndTime",
        ),
      );


    for (
      const record
      of records
    ) {

      const kind =
        recordType(
          record,
        );


      if (
        kind !==
          "MaintenanceWorks" &&
        kind !==
          "ConstructionWorks"
      ) {
        continue;
      }


      if (
        recordIsExpired(
          record,
          now,
        )
      ) {
        continue;
      }


      const currentRecordId =
        recordId(
          record,
        );


      const comments =
        commentsByType(
          record,
        );


      const phaseName =
        firstComment(
          comments,
          "roadworksName",
        );


      const measure =
        resolveMeasure(
          firstComment(
            comments,
            "roadworksType",
          ),
          overallMeasure,
          record,
          kind,
        );


      const lineCoordinates =
        coordinatesFromPosList(
          findFirst(
            record,
            "posList",
          ),
        );


      if (
        lineCoordinates.length <
          2
      ) {
        continue;
      }


      const roadNumber =
        xmlText(
          findFirst(
            record,
            "roadNumber",
          ),
        );


      const roadName =
        findFirst(
          record,
          "roadName",
        );


      const direction =
        xmlText(
          findFirst(
            roadName,
            "value",
          ),
        );


      const length =
        numberValue(
          findFirst(
            record,
            "lengthAffected",
          ),
        );


      const width =
        numberValue(
          findFirst(
            record?.impact,
            "residualRoadWidth",
          ),
        );


      const height =
        numberValue(
          findFirst(
            record?.impact,
            "residualHeight",
          ),
        );


      const maxVehicleWeight =
        numberValue(
          findFirst(
            record?.impact,
            "maxVehicleWeight",
          ),
        );


      const lanesRestricted =
        numberValue(
          findFirst(
            record?.impact,
            "numberOfLanesRestricted",
          ),
        );


      const lanesOriginal =
        numberValue(
          findFirst(
            record?.impact,
            "originalNumberOfLanes",
          ),
        );


      const speed =
        numberValue(
          findFirst(
            record,
            "mainSpeedLimit",
          ),
        );


      const fromAoa =
        readAoaPoint(
          findFirst(
            record,
            "fromPoint",
          ),
        );


      const toAoa =
        readAoaPoint(
          findFirst(
            record,
            "toPoint",
          ),
        );


      const recordStartRaw =
        xmlText(
          findFirst(
            record?.validity,
            "overallStartTime",
          ),
        );


      const recordEndRaw =
        xmlText(
          findFirst(
            record?.validity,
            "overallEndTime",
          ),
        );


      const validFrom =
        dateOnly(
          overallStartRaw ||
          recordStartRaw,
        );


      const validUntil =
        dateOnly(
          overallEndRaw ||
          recordEndRaw,
        );


      const detailedValidity =
        validityDetails(
          record?.validity,
        );


      const versionTimeRaw =
        xmlText(
          findFirst(
            record,
            "situationRecordVersionTime",
          ),
        );


      const isClosed =

        closedRecordIds.has(
          currentRecordId,
        ) ||

        /vollsperrung/i.test(
          phaseName,
        ) ||

        /vollsperrung/i.test(
          measure,
        );


      allPhases.push({

        situationId,

        recordId:
          currentRecordId,

        type:
          isClosed
            ? "ROAD_CLOSED"
            : "CONSTRUCTION",

        lineCoordinates,

        roadNumber,

        phaseName,

        overallName,

        measure,

        direction,

        length,

        width,

        height,

        maxVehicleWeight,

        lanesRestricted,

        lanesOriginal,

        speed,

        fromAoa,

        toAoa,

        validFrom,

        validUntil,

        validityDetails:
          detailedValidity,

        versionTimeRaw,
      });
    }
  }


  // =================================================
  // LANDKREISFILTER
  // =================================================

  let filteredOut =
    0;


  const phases =
    !FILTER_LANDKREIS_SIGMARINGEN
      ? allPhases
      : allPhases.filter(
          (
            phase,
          ) => {

            const inside =
              lineIntersectsCounty(
                phase
                  .lineCoordinates,

                countyBoundary!,
              );


            if (!inside) {

              filteredOut++;
            }


            return inside;
          },
        );


  // =================================================
  // ROBUSTE GRUPPIERUNG
  // =================================================

  const groups =
    groupDatexPhases(
      phases,
    );


  // =================================================
  // GEOJSON AUSGABE
  // =================================================

  const features:
    any[] = [];


  let mergedGroups =
    0;

  let mergedRecords =
    0;


  for (
    const groupedPhases
    of groups
  ) {

    const phase =
      representativePhase(
        groupedPhases,
      );


    if (
      groupedPhases.length >
        1
    ) {

      mergedRecords +=
        groupedPhases.length -
        1;
    }


    if (
      hasOppositeDirection(
        groupedPhases,
      )
    ) {

      mergedGroups++;
    }


    const properties =
      datexProperties(
        groupedPhases,
      );


    features.push({

      type:
        "Feature",

      geometry: {

        type:
          "LineString",

        coordinates:
          phase
            .lineCoordinates,
      },

      properties: {

        ...properties,

        _umap_options: {

          color:
            lineColor(
              phase.type,
            ),
        },
      },
    });


    const firstPoint =
      phase
        .lineCoordinates[0];


    features.push(

      datexEndpointFeature(
        properties,
        firstPoint,
        origin,
        phase.type,
      ),
    );


    const lastPoint =
      phase
        .lineCoordinates[
          phase
            .lineCoordinates
            .length -
            1
        ];


    if (
      !sameCoordinate(
        firstPoint,
        lastPoint,
      )
    ) {

      features.push(

        datexEndpointFeature(
          properties,
          lastPoint,
          origin,
          phase.type,
        ),
      );
    }
  }


  return {

    type:
      "FeatureCollection",

    features,

    metadata: {

      source:
        "MobiData BW / BEMaS DATEX II",

      generated:
        new Date()
          .toISOString(),

      situations:
        situations.length,

      raw_phases:
        allPhases.length,

      county_filter: {

        enabled:
          FILTER_LANDKREIS_SIGMARINGEN,

        county:
          COUNTY_NAME,

        boundary_source:
          COUNTY_GEOJSON_SOURCE,

        phases_inside_or_crossing:
          phases.length,

        phases_filtered_out:
          filteredOut,
      },

      grouping: {

        method:
          "Situation + Fachdaten + AoA/Endpunkt-Toleranz",

        endpoint_tolerance_m:
          ENDPOINT_MATCH_TOLERANCE_M,

        aoa_tolerance_m:
          AOA_MATCH_TOLERANCE_M,

        grouped_phases:
          groups.length,

        merged_records:
          mergedRecords,

        merged_opposite_directions:
          mergedGroups,
      },

      features:
        features.length,

      colors: {

        ROAD_CLOSED:
          COLOR_ROAD_CLOSED,

        CONSTRUCTION:
          COLOR_CONSTRUCTION,
      },

      icon_zoom:
        ICON_ZOOM_FACTOR,
    },
  };
}


// ==================================================
// DATEX HTTP
// ==================================================

async function datexGeoJsonResponse(
  req: Request,
) {

  const origin =
    new URL(
      req.url,
    ).origin;


  const now =
    Date.now();


  if (
    datexCache &&
    datexCache.origin ===
      origin &&
    datexCache.expires >
      now
  ) {

    return new Response(
      datexCache.body,
      {
        headers: {

          ...HEADERS,

          "content-type":
            "application/geo+json; charset=utf-8",

          "x-cache":
            "HIT",
        },
      },
    );
  }


  const geojson =
    await buildDatexGeoJson(
      origin,
    );


  const body =
    JSON.stringify(
      geojson,
    );


  datexCache = {

    origin,

    expires:
      now +
      DATEX_CACHE_MS,

    body,
  };


  return new Response(
    body,
    {
      headers: {

        ...HEADERS,

        "content-type":
          "application/geo+json; charset=utf-8",

        "x-cache":
          "MISS",
      },
    },
  );
}


// ==================================================
// VERKEHRSZEICHEN
// ==================================================

const VZ250_FILE =
  "VZ_250.svg";


const VZ123_FILE =
  "VZ_123.svg";


const ICON_GITHUB_BASE =
  "https://raw.githubusercontent.com/googie0815/umap-icons/main";

const COMBINED_ICON_DEFAULT_LAYOUT:
  CombinedIconLayout =
    "horizontal";

const COMBINED_ICON_DEFAULT_GAP =
  8;

const COMBINED_ICON_DEFAULT_SIGN_SIZE =
  100;

const COMBINED_ICON_DEFAULT_PADDING =
  10;

const COMBINED_ICON_CANVAS_SIZE =
  120;

const COMBINED_ICON_CANVAS_PADDING =
  6;


function iconSourceUrl(
  filename: string,
): string {

  return (
    `${ICON_GITHUB_BASE}/${encodeURIComponent(filename)}`
  );
}

function isValidSvgFilename(
  filename: string,
): boolean {

  return /^[A-Za-z0-9_.-]+\.svg$/i
    .test(filename);
}

function normalizeCombinedLayout(
  value: string | null,
): CombinedIconLayout {

  return value === "vertical"
    ? "vertical"
    : "horizontal";
}

function normalizeGap(
  value: string | null,
): number {

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {

    return COMBINED_ICON_DEFAULT_GAP;
  }

  return Math.max(
    0,
    Math.min(
      40,
      Math.round(parsed),
    ),
  );
}

function normalizeScales(
  value: string | null,
  expectedLength: number,
): number[] {

  const rawValues =
    (value ?? "")
      .split(",")
      .map(
        (item) =>
          item.trim(),
      )
      .filter(Boolean);

  const result:
    number[] = [];

  for (
    let i = 0;
    i < expectedLength;
    i++
  ) {

    const parsed =
      Number(
        rawValues[i] ?? "1",
      );

    if (
      !Number.isFinite(parsed)
    ) {

      result.push(1);

      continue;
    }

    result.push(
      Math.max(
        0.2,
        Math.min(
          1.5,
          parsed,
        ),
      ),
    );
  }

  return result;
}

function stripSvgMetadata(
  svg: string,
): string {

  return svg
    .replace(
      /<metadata\b[\s\S]*?<\/metadata>\s*/gi,
      "",
    )
    .replace(
      /<\?xml[\s\S]*?\?>\s*/gi,
      "",
    )
    .trim();
}

function svgToDataUri(
  svg: string,
): string {

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type ParsedSvg = {
  minX: number;
  minY: number;
  width: number;
  height: number;
  content: string;
  namespaces: Record<string, string>;
};

function attributeNumber(
  svgTag: string,
  attribute: string,
): number | null {

  const match =
    svgTag.match(
      new RegExp(
        `${attribute}\\s*=\\s*["']([^"']+)["']`,
        "i",
      ),
    );

  if (!match) {
    return null;
  }

  const value =
    Number(
      String(match[1])
        .replace(
          /px$/i,
          "",
        ),
    );

  return Number.isFinite(value)
    ? value
    : null;
}

function extractSvgNamespaces(
  svgTag: string,
): Record<string, string> {

  const result:
    Record<string, string> = {};

  for (
    const match
    of svgTag.matchAll(
      /\s(xmlns(?::[A-Za-z_][\w.-]*)?)\s*=\s*["']([^"']+)["']/g,
    )
  ) {

    result[match[1]] =
      match[2];
  }

  return result;
}

function parseSvg(
  svg: string,
): ParsedSvg {

  const openTagMatch =
    svg.match(
      /<svg\b[^>]*>/i,
    );

  const closeTagMatch =
    svg.match(
      /<\/svg>\s*$/i,
    );

  if (
    !openTagMatch ||
    !closeTagMatch
  ) {

    throw new Error(
      "Ungültiges SVG: <svg>-Tag nicht gefunden.",
    );
  }

  const openTag =
    openTagMatch[0];

  const viewBoxMatch =
    openTag.match(
      /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i,
    );

  let minX = 0;
  let minY = 0;
  let width =
    attributeNumber(
      openTag,
      "width",
    );
  let height =
    attributeNumber(
      openTag,
      "height",
    );

  if (viewBoxMatch) {
    minX = Number(viewBoxMatch[1]);
    minY = Number(viewBoxMatch[2]);
    width = Number(viewBoxMatch[3]);
    height = Number(viewBoxMatch[4]);
  }

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {

    throw new Error(
      "SVG ohne brauchbare width/height bzw. viewBox-Angabe.",
    );
  }

  const start =
    openTagMatch.index! +
    openTag.length;

  const end =
    closeTagMatch.index!;

  const content =
    svg.slice(
      start,
      end,
    );

  return {
    minX,
    minY,
    width,
    height,
    content,
    namespaces:
      extractSvgNamespaces(
        openTag,
      ),
  };
}

function prefixSvgIds(
  svgContent: string,
  prefix: string,
): string {

  return svgContent
    .replace(
      /id=(["'])([^"']+)\1/g,
      (_match, quote, id) =>
        `id=${quote}${prefix}${id}${quote}`,
    )
    .replace(
      /url\(#([^\)]+)\)/g,
      (_match, id) =>
        `url(#${prefix}${id})`,
    )
    .replace(
      /href=(["'])#([^"']+)\1/g,
      (_match, quote, id) =>
        `href=${quote}#${prefix}${id}${quote}`,
    )
    .replace(
      /xlink:href=(["'])#([^"']+)\1/g,
      (_match, quote, id) =>
        `xlink:href=${quote}#${prefix}${id}${quote}`,
    )
    .replace(
      /\bclass=(["'])([^"']+)\1/g,
      (_match, quote, classes) =>
        `class=${quote}${classes}${quote}`,
    );
}


// ==================================================
// SVG ETWAS VERGRÖSSERN
// ==================================================

function zoomSvgContent(
  svg: string,
  factor =
    ICON_ZOOM_FACTOR,
): string {

  const match =
    svg.match(
      /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i,
    );


  if (!match) {
    return svg;
  }


  const minX =
    Number(
      match[1],
    );

  const minY =
    Number(
      match[2],
    );

  const width =
    Number(
      match[3],
    );

  const height =
    Number(
      match[4],
    );


  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    factor <= 1
  ) {

    return svg;
  }


  const newWidth =
    width /
    factor;

  const newHeight =
    height /
    factor;


  const newMinX =
    minX +
    (
      width -
      newWidth
    ) /
    2;


  const newMinY =
    minY +
    (
      height -
      newHeight
    ) /
    2;


  const format =
    (
      value:
        number,
    ) =>
      value
        .toFixed(4)
        .replace(
          /\.?0+$/,
          "",
        );


  const newViewBox =
    `viewBox="${format(newMinX)} ${format(newMinY)} ${format(newWidth)} ${format(newHeight)}"`;


  return svg.replace(
    match[0],
    newViewBox,
  );
}


// ==================================================
// VERKEHRSZEICHEN LADEN
// ==================================================

async function loadGithubSvg(
  filename: string,
): Promise<string> {

  if (
    !isValidSvgFilename(
      filename,
    )
  ) {

    throw new Error(
      `Ungültiger SVG-Dateiname: ${filename}`,
    );
  }

  const upstream =
    await fetch(
      iconSourceUrl(
        filename,
      ),
      {
        redirect:
          "follow",

        headers: {

          "user-agent":
            "uMap-roadworks-proxy/1.0",
        },
      },
    );

  if (
    !upstream.ok
  ) {

    throw new Error(
      `Verkehrszeichen ${filename} konnte nicht geladen werden: ${upstream.status}`,
    );
  }

  const originalSvg =
    await upstream.text();

  return stripSvgMetadata(
    originalSvg,
  );
}

async function trafficSignResponse(
  filename: string,
) {

  const originalSvg =
    await loadGithubSvg(
      filename,
    );

  const enlargedSvg =
    zoomSvgContent(
      originalSvg,
    );

  return new Response(
    enlargedSvg,
    {
      headers: {

        "access-control-allow-origin":
          "*",

        "cache-control":
          "public, max-age=86400",

        "content-type":
          "image/svg+xml; charset=utf-8",
      },
    },
  );
}


// ==================================================
// KOMBINIERTE VERKEHRSZEICHEN
// ==================================================

async function buildCombinedIcon(
  filenames: string[],
  layout: CombinedIconLayout,
  gap: number,
  scales: number[],
): Promise<string> {

  if (
    filenames.length < 1 ||
    filenames.length > 3
  ) {

    throw new Error(
      "Es können 1 bis 3 SVG-Symbole kombiniert werden.",
    );
  }

  for (
    const filename
    of filenames
  ) {

    if (
      !isValidSvgFilename(
        filename,
      )
    ) {

      throw new Error(
        `Ungültiger SVG-Dateiname: ${filename}`,
      );
    }
  }

  const cacheKey =
    JSON.stringify({
      filenames,
      layout,
      gap,
      scales,
    });

  const now =
    Date.now();

  const cached =
    combinedIconCache.get(
      cacheKey,
    );

  if (
    cached &&
    cached.expires > now
  ) {

    return cached.svg;
  }

  const sourceSvgs =
    await Promise.all(
      filenames.map(
        (
          filename,
        ) =>
          loadGithubSvg(
            filename,
          ),
      ),
    );

  const parsedSvgs =
    sourceSvgs.map(
      (
        svg,
      ) =>
        parseSvg(svg),
    );

  const outerSize =
    COMBINED_ICON_CANVAS_SIZE;

  const outerPadding =
    COMBINED_ICON_CANVAS_PADDING;

  const innerGap =
    Math.max(
      0,
      Math.min(
        16,
        gap,
      ),
    );

  const slotWidth =
    layout === "vertical"
      ? outerSize -
        2 * outerPadding
      : (
        outerSize -
        2 * outerPadding -
        (parsedSvgs.length - 1) * innerGap
      ) / parsedSvgs.length;

  const slotHeight =
    layout === "vertical"
      ? (
        outerSize -
        2 * outerPadding -
        (parsedSvgs.length - 1) * innerGap
      ) / parsedSvgs.length
      : outerSize -
        2 * outerPadding;

  const combinedNamespaces:
    Record<string, string> = {
      xmlns:
        "http://www.w3.org/2000/svg",
      "xmlns:xlink":
        "http://www.w3.org/1999/xlink",
    };

  for (
    const parsed
    of parsedSvgs
  ) {

    for (
      const [
        key,
        value,
      ]
      of Object.entries(
        parsed.namespaces,
      )
    ) {

      if (
        !combinedNamespaces[key]
      ) {

        combinedNamespaces[key] =
          value;
      }
    }
  }

  const namespaceAttributes =
    Object.entries(
      combinedNamespaces,
    )
      .map(
        (
          [
            key,
            value,
          ],
        ) =>
          `${key}="${value}"`,
      )
      .join("\n  ");

  const groups =
    parsedSvgs
      .map(
        (
          parsed,
          index,
        ) => {

          const slotX =
            layout === "vertical"
              ? outerPadding
              : outerPadding +
                index *
                  (slotWidth + innerGap);

          const slotY =
            layout === "vertical"
              ? outerPadding +
                index *
                  (slotHeight + innerGap)
              : outerPadding;

          const baseScale =
            Math.min(
              slotWidth /
                parsed.width,
              slotHeight /
                parsed.height,
            );

          const relativeScale =
            scales[index] ?? 1;

          const scale =
            baseScale *
            relativeScale;

          const renderedWidth =
            parsed.width *
            scale;

          const renderedHeight =
            parsed.height *
            scale;

          const translateX =
            slotX +
            (slotWidth -
              renderedWidth) / 2 -
            parsed.minX *
              scale;

          const translateY =
            slotY +
            (slotHeight -
              renderedHeight) / 2 -
            parsed.minY *
              scale;

          const prefixedContent =
            prefixSvgIds(
              parsed.content,
              `icon${index}_`,
            );

          return `
  <g transform="translate(${translateX} ${translateY}) scale(${scale})">
${prefixedContent}
  </g>`.trimEnd();
        },
      )
      .join("\n");

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
      svg:
        combinedSvg,
      expires:
        now +
        COMBINED_ICON_CACHE_TTL,
    },
  );

  return combinedSvg;
}

async function combinedIconResponse(
  url: URL,
): Promise<Response> {

  const iconsParameter =
    url.searchParams.get("icons") ??
    "";

  const filenames =
    iconsParameter
      .split(",")
      .map(
        (value) =>
          value.trim(),
      )
      .filter(Boolean);

  if (
    filenames.length === 0
  ) {

    return new Response(
      JSON.stringify(
        {
          ok:
            false,
          error:
            "Parameter 'icons' fehlt. Beispiel: ?icons=VZ_262_20t.svg,VZ_263_8t.svg&scales=1,0.7",
        },
        null,
        2,
      ),
      {
        status:
          400,
        headers: {
          "content-type":
            "application/json; charset=utf-8",
          "access-control-allow-origin":
            "*",
        },
      },
    );
  }

  const layout =
    normalizeCombinedLayout(
      url.searchParams.get(
        "layout",
      ),
    );

  const gap =
    normalizeGap(
      url.searchParams.get(
        "gap",
      ),
    );

  const scales =
    normalizeScales(
      url.searchParams.get(
        "scales",
      ),
      filenames.length,
    );

  try {

    const svg =
      await buildCombinedIcon(
        filenames,
        layout,
        gap,
        scales,
      );

    return new Response(
      svg,
      {
        status:
          200,
        headers: {
          "content-type":
            "image/svg+xml; charset=utf-8",
          "cache-control":
            "public, max-age=3600",
          "access-control-allow-origin":
            "*",
        },
      },
    );
  } catch (
    error
  ) {

    return new Response(
      JSON.stringify(
        {
          ok:
            false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
        null,
        2,
      ),
      {
        status:
          500,
        headers: {
          "content-type":
            "application/json; charset=utf-8",
          "access-control-allow-origin":
            "*",
        },
      },
    );
  }
}


// ==================================================
// SERVER
// ==================================================

Deno.serve(
  async (
    req: Request,
  ) => {

    const url =
      new URL(
        req.url,
      );


    try {

      if (
        url.pathname ===
          "/roadworks-datex.geojson"
      ) {

        return await datexGeoJsonResponse(
          req,
        );
      }


      if (
        url.pathname ===
          "/roadworks.geojson"
      ) {

        return await geoJsonResponse(
          req,
        );
      }


      if (
        url.pathname ===
          "/roadworks.csv"
      ) {

        return await csvResponse();
      }


      if (
        url.pathname ===
          "/icons/road-closed.svg"
      ) {

        return await trafficSignResponse(
          VZ250_FILE,
        );
      }


      if (
        url.pathname ===
          "/icons/construction.svg"
      ) {

        return await trafficSignResponse(
          VZ123_FILE,
        );
      }

      if (
        url.pathname ===
          "/icons/combine.svg"
      ) {

        return await combinedIconResponse(
          url,
        );
      }


      return new Response(

        JSON.stringify(
          {

            ok:
              true,

            service:
              "MobiData-BW / DATEX II → uMap",

            filter: {

              enabled:
                FILTER_LANDKREIS_SIGMARINGEN,

              county:
                COUNTY_NAME,

              method:
                "eigene GeoJSON-Landkreisgrenze / Schnittprüfung",

              boundary:
                COUNTY_GEOJSON_SOURCE,
            },

            grouping: {

              method:
                "Situation + AoA + geografische Endpunkte",

              endpoint_tolerance_m:
                ENDPOINT_MATCH_TOLERANCE_M,

              aoa_tolerance_m:
                AOA_MATCH_TOLERANCE_M,
            },

            urls: {

              csv:
                "/roadworks.csv",

              geojson:
                "/roadworks.geojson",

              datex_geojson:
                "/roadworks-datex.geojson",

              vz250:
                "/icons/road-closed.svg",

              vz123:
                "/icons/construction.svg",

              combined_example_horizontal:
                `/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=${COMBINED_ICON_DEFAULT_LAYOUT}`,

              combined_example_vertical:
                "/icons/combine.svg?icons=VZ_262_20t.svg,VZ_263_8t.svg&layout=vertical",

              combined_example_scaled:
                "/icons/combine.svg?icons=VZ_253.svg,Zusatzzeichen_1053-33_7_5t.svg&layout=vertical&scales=1,0.7",
            },

            combined_icons: {

              enabled:
                true,

              max_icons:
                3,

              layouts: [
                "horizontal",
                "vertical",
              ],

              default_layout:
                COMBINED_ICON_DEFAULT_LAYOUT,

              default_gap:
                COMBINED_ICON_DEFAULT_GAP,

              scales_parameter:
                "Kommagetrennte Faktoren, z. B. scales=1,0.7",
            },

            styles: {

              Vollsperrung:
                COLOR_ROAD_CLOSED,

              Baustelle:
                COLOR_CONSTRUCTION,

              icon_zoom:
                ICON_ZOOM_FACTOR,
            },
          },

          null,
          2,
        ),

        {
          headers: {

            ...HEADERS,

            "content-type":
              "application/json; charset=utf-8",
          },
        },
      );
    }


    catch (
      error
    ) {

      console.error(
        error,
      );


      return new Response(

        JSON.stringify(
          {

            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : String(
                    error,
                  ),

            stack:
              error instanceof Error
                ? error.stack
                : "",
          },

          null,
          2,
        ),

        {
          status:
            502,

          headers: {

            ...HEADERS,

            "content-type":
              "application/json; charset=utf-8",
          },
        },
      );
    }
  },
);
