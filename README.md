# uMap-Baustellendaten – Landkreis Sigmaringen

MobiData-BW/DATEX-II wird durch GitHub Actions aufbereitet. Cloudflare liefert die fertige GeoJSON-Datei aus und erzeugt weiterhin Verkehrszeichenkombinationen. Die aufwendige XML-Auswertung erfolgt außerhalb des Workers.

## Betrieb

- Workflow: **Baustellendaten aktualisieren**, geplant alle 30 Minuten (Minute 17 und 47, UTC), zusätzlich manuell unter **Actions → Run workflow**.
- GitHub kann geplante Läufe verzögern oder auslassen. Das Intervall ist keine garantierte Aktualisierungsfrist. Bei längerer Inaktivität kann GitHub geplante Workflows deaktivieren; den Status regelmäßig prüfen.
- `data/status.json` enthält den letzten erfolgreichen Datenstand. `metadata.generated` steht außerdem im GeoJSON.
- Abruffehler, ungültiges GeoJSON und eine leere/unverstandene landesweite DATEX-Quelle brechen die Aktualisierung ab. Es wird dann kein Datencommit erzeugt; die vorherigen veröffentlichten Dateien bleiben bestehen. Null Treffer innerhalb des Landkreises sind zulässig.
- Standard-GitHub-Runner, keine kostenpflichtigen Zusatzdienste oder Zugangsschlüssel erforderlich.

## Cloudflare einrichten

1. `cloudflare/Cloudflare_uMap_Code.txt` öffnen und den vollständigen Inhalt kopieren.
2. Im bestehenden Worker `patient-pine-10b1` unter **Edit code** den Inhalt von `worker.js` vollständig ersetzen und **Deploy** wählen.
3. `https://patient-pine-10b1.iabfall.workers.dev/roadworks-datex.geojson?v=14` testen.
4. Erst nach erfolgreichem Test diese URL in der kopierten uMap-Karte unter **Externe Daten → URL** einsetzen. Format: GeoJSON.

Die bekannten Icon-Endpunkte bleiben erhalten:

- `/icons/construction.svg`
- `/icons/road-closed.svg`
- `/icons/combine.svg?icons=VZ_253.svg,Zusatzzeichen_1053-33_7_5t.svg&layout=vertical&scales=1,0.7&v=5`

Die alten alternativen CSV-/GeoJSON-Endpunkte sind in diesem Test nicht aktiv; verwendet wird ausschließlich `/roadworks-datex.geojson`. Die Icons werden weiterhin aus `googie0815/umap-icons` bezogen. Die Originalkarte und Deno sind unabhängig von dieser Einrichtung.

## Datenpfad und Cache

Der Worker liest `https://raw.githubusercontent.com/googie0815/umap-daten/main/data/roadworks-datex.geojson`. GitHub Pages muss für diesen Aufbau nicht aktiviert werden. GitHub und Cloudflare können Antworten zwischenspeichern, zusätzlich zur Zeit zwischen den Aktualisierungsläufen. Der Worker cached Daten fünf Minuten und erfolgreiche SVGs eine Stunde. Bei einem Cache-Miss wird nur die vorbereitete GeoJSON-Datei durchgereicht; es findet keine DATEX-Auswertung statt. `v` ist ein Cacheparameter des Clients, keine andere Datenvariante.

## Dateien und Wartung

- `scripts/generate.mjs`: Datenabruf, Validierung und Ausgabe; lokal mit Node 22: `node scripts/generate.mjs`.
- `scripts/engine.mjs`: gebündelte JavaScript-Fassung des bereitgestellten Deno-Codes einschließlich Bibliotheken, für die Datenaufbereitung. Keine Installation beim Aktualisierungslauf erforderlich.
- `scripts/deno-original.ts`: ursprünglicher Deno-Code als Referenz; wird nicht ausgeführt.
- `cloudflare/worker.js`: schlanker Worker ohne DATEX-Parser.
- `.github/workflows/update-roadworks.yml`: Zeitplan und Speicherung erfolgreicher Ergebnisse.

Die Landkreisgrenze, räumliche Schnittprüfung, Gegenrichtungszusammenführung, Detailtexte und Darstellung werden aus dem bereitgestellten Code übernommen. Bei Änderung der Worker-Domain muss `PUBLIC_ORIGIN` im Workflow angepasst und die Aufbereitung erneut ausgeführt werden, da die GeoJSON-Datei absolute Icon-Adressen enthält. Den Cloudflare-Worker zusätzlich mit der Testkarte auf Darstellung und kostenlose CPU-Grenze prüfen.

## Umleitungen BW

Zusätzliche uMap-Ebene: `https://raw.githubusercontent.com/googie0815/umap-daten/main/data/rerouting-datex.geojson` (Format GeoJSON, dynamisch laden). Die direkte URL benötigt keine Änderung am Cloudflare-Worker. Orange gestrichelte Linien werden über `_umap_options` vorgegeben.

Der bestehende Aktualisierungslauf erzeugt auch diese Datei mittels `python3 scripts/generate-rerouting.py` (Python-Standardbibliothek). Datenquelle ist der separate BEMaS-DATEX-Feed `rerouting_management_svzbw.datex2.xml`. Nur `originalRoute=false` wird ausgegeben. Originalstrecken werden ausschließlich zur räumlichen Zuordnung genutzt: Schneidet die Originalstrecke oder die Umleitung den Landkreis, bleibt die vollständige Umleitung einschließlich Abschnitten außerhalb des Landkreises erhalten. Routen derselben Meldung werden für die Darstellung zusammengefasst; gemeinsame Abschnitte mit identischen Koordinaten werden richtungsunabhängig nur einmal gezeichnet. Abzweige bleiben erhalten. Die ursprünglichen Routen samt Geometrie und Angaben bleiben im Feld `quellrouten` gespeichert.

Abgelaufene und ausgesetzte Meldungen werden ausgelassen; zukünftige Meldungen bleiben als „geplant“ sichtbar. Der angezeigte Gesamtzeitraum ist keine Zusicherung einer durchgehend aktiven Umleitung. Fahrzeugarten und Gewichtungswerte bleiben als unveränderte Quellangaben erhalten; daraus wird keine Lkw- oder GST-Eignung abgeleitet. Die Bezeichnung der zugehörigen Sperrung/Baumaßnahme wird über die identische `situation_id` aus dem Baustellen-DATEX-Feed übernommen. Fehlende Bezeichnungen werden ausdrücklich kenntlich gemacht; es erfolgt keine Zuordnung nach räumlicher Nähe.

Einzelne Quellrouten enthalten nur identische Punkte und keine darstellbare Linie. Diese werden ausgelassen und in `metadata.routes_without_line` gezählt. Bei Abruffehlern, unbekannten Geometrien oder unverstandenem Landesfeed bricht der Lauf ohne Datencommit ab. Die Umleitungsdatei hat einen eigenen Zeitstempel in `metadata.generated`.
