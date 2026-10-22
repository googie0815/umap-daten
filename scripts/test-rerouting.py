import importlib.util
import unittest
from pathlib import Path
from datetime import datetime, timezone

spec = importlib.util.spec_from_file_location('rerouting', Path(__file__).with_name('generate-rerouting.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def route(original, points):
    nodes = ''.join(f'<intermediatePointOnLinearElement index="{i}"><referent><pointCoordinates><longitude>{x}</longitude><latitude>{y}</latitude></pointCoordinates></referent></intermediatePointOnLinearElement>' for i,(x,y) in enumerate(points[1:-1]))
    def endpoint(name, p):
        return f'<{name}><pointCoordinates><longitude>{p[0]}</longitude><latitude>{p[1]}</latitude></pointCoordinates></{name}>'
    return f'<route><originalRoute>{str(original).lower()}</originalRoute><itinerary><locationContainedInItinerary index="0"><location><linearElement>{endpoint("startPointOfLinearElement",points[0])}{nodes}{endpoint("endPointOfLinearElement",points[-1])}</linearElement></location></locationContainedInItinerary></itinerary></route>'


class ConversionTests(unittest.TestCase):
    def test_crossing_original_keeps_full_external_detour_and_excludes_original(self):
        # Original endpoints are outside; only the segment crosses the county.
        xml = f'<d2LogicalModel xmlns="{m.NS["d"]}"><situation id="42"><situationRecord id="42-1"><validity><validityTimeSpecification><overallStartTime>2027-01-01T00:00:00Z</overallStartTime><overallEndTime>2028-01-01T00:00:00Z</overallEndTime></validityTimeSpecification></validity><generalNetworkManagementExtension><generalNetworkManagementExtended>{route(True,[[-1,0.5],[2,0.5]])}{route(False,[[-1,2],[2,2]])}</generalNetworkManagementExtended></generalNetworkManagementExtension></situationRecord></situation></d2LogicalModel>'
        county = {'type':'Polygon','coordinates':[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}
        result = m.convert(xml, county, datetime(2026,1,1,tzinfo=timezone.utc))
        self.assertEqual(len(result['features']),1)
        self.assertEqual(result['features'][0]['geometry']['coordinates'],[[[-1,2],[2,2]]])
        self.assertEqual(result['features'][0]['properties']['status'],'geplant')
        self.assertEqual(m.convert(xml,county,datetime(2029,1,1,tzinfo=timezone.utc))['features'],[])

    def test_shared_reverse_edges_are_drawn_once_and_branches_survive(self):
        lines = [[[0,0],[1,0],[2,0]], [[2,0],[1,0],[0,0]], [[1,0],[1,1]]]
        output = m.unique_lines(lines)
        edges = [tuple(sorted((tuple(a),tuple(b)))) for line in output for a,b in zip(line,line[1:])]
        self.assertEqual(len(edges), 3)
        self.assertEqual(len(set(edges)), 3)

    def test_closure_name_is_joined_by_id(self):
        xml = f'<d2LogicalModel xmlns="{m.NS["d"]}"><situation id="42"><situationExtension><overallSituation><generalPublicComment><comment><values><value>B311 Test</value></values></comment><commentExtension><commentType2>roadworksName</commentType2></commentExtension></generalPublicComment></overallSituation></situationExtension></situation></d2LogicalModel>'
        self.assertEqual(m.roadworks_names(xml), {'42': 'B311 Test'})

    def test_invalid_feed_does_not_publish_empty_result(self):
        with self.assertRaises(ValueError):
            m.convert('<empty/>', {})

    def test_collinear_disjoint_segments_do_not_intersect(self):
        self.assertFalse(m.intersects([0,0],[1,0],[2,0],[3,0]))
        self.assertTrue(m.intersects([0,0],[2,0],[1,0],[3,0]))


if __name__ == '__main__':
    unittest.main()
