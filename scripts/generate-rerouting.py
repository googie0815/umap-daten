"""Convert BEMaS strategic detours to uMap GeoJSON (Python standard library)."""
import argparse
import json
import math
import os
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

SOURCE = 'https://dev-ipl.mobidata-bw.de/datasets/traffic/rerouting_management/rerouting_management_svzbw.datex2.xml'
BOUNDARY = 'https://raw.githubusercontent.com/googie0815/umap-icons/main/landkreis-sigmaringen.geojson'
NS = {'d': 'http://datex2.eu/schema/2/2_0'}
NOTE = 'Allgemeine Umleitungsinformation; Eignung für Großraum- und Schwertransporte gesondert prüfen.'


def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'uMap-Sigmaringen/1.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def text(element, path):
    return element.findtext(path, default='', namespaces=NS).strip()


def display_date(value):
    if not value:
        return "nicht angegeben"
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(ZoneInfo("Europe/Berlin")).strftime("%d.%m.%Y, %H:%M Uhr")


def coordinate(element):
    if element is None:
        raise ValueError('Fehlender Routenpunkt')
    point = element.find('.//d:pointCoordinates', NS)
    if point is None:
        raise ValueError('Fehlende Koordinaten')
    p = [float(text(point, 'd:longitude')), float(text(point, 'd:latitude'))]
    if not all(math.isfinite(v) for v in p) or not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90):
        raise ValueError('Ungültige Koordinaten')
    return p


def route_lines(route):
    lines = []
    locations = route.findall('d:itinerary/d:locationContainedInItinerary', NS)
    for location in sorted(locations, key=lambda x: int(x.get('index', '0'))):
        elements = location.findall('.//d:linearElement', NS)
        if not elements:
            raise ValueError('Unverstandene Routengeometrie')
        for element in elements:
            middle = sorted(element.findall('d:intermediatePointOnLinearElement', NS), key=lambda x: int(x.get('index', '0')))
            points = [coordinate(element.find('d:startPointOfLinearElement', NS))]
            points += [coordinate(x) for x in middle]
            points += [coordinate(element.find('d:endPointOfLinearElement', NS))]
            points = [p for i, p in enumerate(points) if i == 0 or p != points[i-1]]
            if len(points) >= 2:
                lines.append(points)
    return lines


def cross(a, b, c):
    return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])


def on_segment(p, a, b):
    return abs(cross(a, b, p)) < 1e-12 and min(a[0], b[0])-1e-12 <= p[0] <= max(a[0], b[0])+1e-12 and min(a[1], b[1])-1e-12 <= p[1] <= max(a[1], b[1])+1e-12


def intersects(a, b, c, d):
    return (cross(a,b,c)*cross(a,b,d) < 0 and cross(c,d,a)*cross(c,d,b) < 0) or any((on_segment(c,a,b), on_segment(d,a,b), on_segment(a,c,d), on_segment(b,c,d)))


def in_ring(p, ring):
    inside = False
    for a, b in zip(ring, ring[1:]):
        if on_segment(p, a, b):
            return True
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:
            inside = not inside
    return inside


def county_polygons(boundary):
    geometries = [f['geometry'] for f in boundary['features']] if boundary['type'] == 'FeatureCollection' else [boundary['geometry']] if boundary['type'] == 'Feature' else [boundary]
    polygons = []
    for geometry in geometries:
        if geometry['type'] == 'Polygon':
            polygons.append(geometry['coordinates'])
        elif geometry['type'] == 'MultiPolygon':
            polygons.extend(geometry['coordinates'])
        else:
            raise ValueError('Ungültige Landkreisgrenze')
    if not polygons:
        raise ValueError('Leere Landkreisgrenze')
    return polygons


def touches_county(lines, polygons):
    for polygon in polygons:
        ring = polygon[0]
        xmin, xmax = min(p[0] for p in ring), max(p[0] for p in ring)
        ymin, ymax = min(p[1] for p in ring), max(p[1] for p in ring)
        for line in lines:
            if max(p[0] for p in line) < xmin or min(p[0] for p in line) > xmax or max(p[1] for p in line) < ymin or min(p[1] for p in line) > ymax:
                continue
            if any(in_ring(p, ring) and not any(in_ring(p, hole) for hole in polygon[1:]) for p in line):
                return True
            if any(intersects(a,b,c,d) for a,b in zip(line,line[1:]) for edge in polygon for c,d in zip(edge,edge[1:])):
                return True
    return False


def roadworks_names(xml):
    root = ET.fromstring(xml)
    situations = root.findall('.//d:situation', NS)
    if not situations:
        raise ValueError('Baustellenquelle leer oder unverstanden')
    names = {}
    for situation in situations:
        for comment in situation.findall('d:situationExtension//d:overallSituation/d:generalPublicComment', NS):
            if text(comment, './/d:commentType2') == 'roadworksName':
                value = text(comment, 'd:comment/d:values/d:value')
                if value:
                    names[situation.get('id', '')] = value
    return names


def unique_lines(lines):
    """Union exact undirected edges; join degree-two vertices into trails."""
    adjacency, edges = {}, set()
    for line in lines:
        for a, b in zip(line, line[1:]):
            a, b = tuple(a), tuple(b)
            if a == b:
                continue
            edges.add(tuple(sorted((a, b))))
            adjacency.setdefault(a, set()).add(b)
            adjacency.setdefault(b, set()).add(a)
    remaining, result = set(edges), []
    def walk(a, b):
        path = [a, b]
        remaining.remove(tuple(sorted((a, b))))
        while len(adjacency[b]) == 2:
            candidates = [c for c in sorted(adjacency[b]) if tuple(sorted((b,c))) in remaining]
            if not candidates:
                break
            c = candidates[0]
            remaining.remove(tuple(sorted((b,c))))
            path.append(c)
            a, b = b, c
        result.append([list(p) for p in path])
    for a in sorted(adjacency):
        if len(adjacency[a]) != 2:
            for b in sorted(adjacency[a]):
                if tuple(sorted((a,b))) in remaining:
                    walk(a,b)
    while remaining:
        walk(*min(remaining))
    return result


def combine_routes(features, names):
    groups = {}
    for feature in features:
        groups.setdefault(feature['properties']['record_id'], []).append(feature)
    result = []
    for record_id, members in groups.items():
        sources = json.dumps(members, ensure_ascii=False, separators=(',', ':'))
        props = dict(members[0]['properties'])
        labels = list(dict.fromkeys(f['properties']['name'] for f in members))
        closure = names.get(props['situation_id'], '')
        props['zugehoerige_sperrung'] = closure
        props['routen'] = ' / '.join(labels)
        props['quellrouten'] = sources
        props['name'] = f'Umleitung – {closure}' if closure else ' / '.join(labels)
        reference = closure or 'Keine Bezeichnung in der Baustellenquelle verfügbar.'
        props['description'] = f'**Zugehörige Sperrung / Baumaßnahme:** {reference}\n\n**Routen:** {props["routen"]}\n\n' + props['description']
        props['fahrzeugangaben_quelle'] = json.dumps([{'route': f['properties']['name'], 'angaben': json.loads(f['properties']['fahrzeugangaben_quelle'])} for f in members], ensure_ascii=False)
        lines = unique_lines([line for f in members for line in f['geometry']['coordinates']])
        result.append({'type': 'Feature', 'id': f'{record_id}:combined', 'geometry': {'type': 'MultiLineString', 'coordinates': lines}, 'properties': props})
    return result


def convert(xml, boundary, now=None, names=None):
    root = ET.fromstring(xml)
    records = root.findall('.//d:situationRecord', NS)
    if not records:
        raise ValueError('Leere oder unverstandene DATEX-Quelle')
    polygons = county_polygons(boundary)
    features = []
    total = 0
    expired = 0
    missing_geometry = 0
    now = now or datetime.now(timezone.utc)
    for situation in root.findall('.//d:situation', NS):
        for record in situation.findall('d:situationRecord', NS):
            routes = record.findall('.//d:generalNetworkManagementExtended/d:route', NS)
            if not routes:
                raise ValueError('Datensatz ohne verstandene Routen')
            original, detours = [], []
            for i, route in enumerate(routes):
                flag = text(route, 'd:originalRoute')
                if flag not in ('true', 'false'):
                    raise ValueError('Unbekannter Routentyp')
                lines = route_lines(route)
                if not lines:
                    missing_geometry += 1
                    continue
                if flag == 'true':
                    original.extend(lines)
                else:
                    total += 1
                    detours.append((i, route, lines))
            start = text(record, 'd:validity/d:validityTimeSpecification/d:overallStartTime')
            end = text(record, 'd:validity/d:validityTimeSpecification/d:overallEndTime')
            if end and datetime.fromisoformat(end.replace('Z', '+00:00')) < now:
                expired += len(detours)
                continue
            status = text(record, 'd:validity/d:validityStatus')
            if status == 'suspended':
                continue
            relevant_original = touches_county(original, polygons)
            for i, route, lines in detours:
                if not relevant_original and not touches_county(lines, polygons):
                    continue
                name = text(route, 'd:nameOfRoute/d:values/d:value') or 'Umleitung'
                vehicle_data = []
                for item in route.findall('d:weightingAndVehicleClassification/d:weightingAndVehicleClassification', NS):
                    vehicle_data.append({'vehicle_type': text(item, 'd:validForVehiclesWithCharacteristics/d:vehicleType'), 'weight': text(item, 'd:weight')})
                record_id = record.get('id', '')
                state = 'geplant' if start and datetime.fromisoformat(start.replace('Z', '+00:00')) > now else 'im Gültigkeitszeitraum'
                description = '\n\n'.join([f'**Gültig ab:** {display_date(start)}', f'**Gültig bis:** {display_date(end)}', f'**Status:** {state}', f'**Letzte Änderung:** {display_date(text(record, "d:situationRecordVersionTime"))}', f'**Hinweis:** {NOTE}'])
                features.append({'type': 'Feature', 'id': f'{record_id}:route:{i}', 'geometry': {'type': 'MultiLineString', 'coordinates': lines}, 'properties': {'name': name, 'description': description, 'situation_id': situation.get('id', ''), 'record_id': record_id, 'gueltig_ab': start, 'gueltig_bis': end, 'status': state, 'validity_status': status, 'letzte_aenderung': text(record, 'd:situationRecordVersionTime'), 'fahrzeugangaben_quelle': json.dumps(vehicle_data, ensure_ascii=False), 'hinweis': NOTE, '_umap_options': {'color': '#E88A14', 'weight': 5, 'opacity': 0.85, 'dashArray': '12,14'}}})
    if total == 0:
        raise ValueError('Keine verstandenen Umleitungen im Landesfeed')
    source_features = len(features)
    features = combine_routes(features, names or {})
    return {'type': 'FeatureCollection', 'metadata': {'generated': now.isoformat(), 'source': SOURCE, 'county': 'Landkreis Sigmaringen', 'records': len(records), 'statewide_detours': total, 'expired_detours': expired, 'routes_without_line': missing_geometry, 'features': len(features), 'source_routes': source_features, 'filter': 'Originalstrecke oder Umleitung schneidet Landkreis; vollständige Umleitung bleibt erhalten', 'note': NOTE}, 'features': features}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--xml')
    parser.add_argument('--boundary')
    parser.add_argument('--roadworks')
    args = parser.parse_args()
    xml = Path(args.xml).read_bytes() if args.xml else download(SOURCE)
    boundary = json.loads(Path(args.boundary).read_text() if args.boundary else download(BOUNDARY))
    roadworks = Path(args.roadworks).read_bytes() if args.roadworks else download('https://dev-ipl.mobidata-bw.de/datasets/traffic/roadworks/roadworks_svzbw.datex2.xml')
    data = convert(xml, boundary, names=roadworks_names(roadworks))
    target = Path(__file__).resolve().parent.parent / 'data' / 'rerouting-datex.geojson'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    os.replace(temporary, target)
    print(json.dumps(data['metadata'], ensure_ascii=False))


if __name__ == '__main__':
    main()
