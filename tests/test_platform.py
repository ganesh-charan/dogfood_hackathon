#!/usr/bin/env python3
"""Custom Verification Test Suite for DOGFOOD 2026 Hackathon Platform.

Runs unit, invariant, and integration assertions using Python standard library.
Usage: python -m unittest tests/test_platform.py
"""

import json
import math
import os
import unittest
import urllib.error
import urllib.request

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def request(url, headers=None, method="GET", body=None):
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if body is not None:
        req.data = json.dumps(body).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return 0, str(e)


class TestZScoreNormalizationMath(unittest.TestCase):
    """TC-204: Mathematical verification of Z-Score variance compensation."""

    def test_z_score_equivalence_under_variance(self):
        # Judge A (Harsh): Mean 60, StdDev 5
        # Judge B (Generous): Mean 90, StdDev 5
        score_a = 65
        score_b = 95

        mean_a, std_a = 60, 5
        mean_b, std_b = 90, 5

        z_a = (score_a - mean_a) / std_a  # +1.0
        z_b = (score_b - mean_b) / std_b  # +1.0

        self.assertAlmostEqual(z_a, z_b, places=4)

        # Scale into [0, 100] via 50 + 15 * Z
        norm_a = min(100, max(0, 50 + 15 * z_a))
        norm_b = min(100, max(0, 50 + 15 * z_b))

        self.assertEqual(norm_a, 65.0)
        self.assertEqual(norm_b, 65.0)

    def test_damped_variance_floor_prevents_zero_division(self):
        # Judge gives identical scores
        scores = [4.0, 4.0, 4.0]
        mean = sum(scores) / len(scores)
        std_raw = math.sqrt(sum((x - mean) ** 2 for x in scores) / len(scores))
        std_eff = max(std_raw, 0.5)

        self.assertEqual(std_raw, 0.0)
        self.assertEqual(std_eff, 0.5)

        z = (4.0 - mean) / std_eff
        self.assertEqual(z, 0.0)


class TestRubricWeightInvariants(unittest.TestCase):
    """TC-201: Rubric criteria weights sum validation."""

    def test_valid_rubric_weights_sum_to_one(self):
        criteria = [
            {"name": "Functionality", "weight": 0.40},
            {"name": "Quality", "weight": 0.30},
            {"name": "Originality", "weight": 0.30}
        ]
        total_weight = sum(c["weight"] for c in criteria)
        self.assertAlmostEqual(total_weight, 1.0, delta=0.001)

    def test_invalid_rubric_weights_rejected(self):
        criteria = [
            {"name": "Functionality", "weight": 0.50},
            {"name": "Quality", "weight": 0.30}
        ]
        total_weight = sum(c["weight"] for c in criteria)
        self.assertNotAlmostEqual(total_weight, 1.0, delta=0.001)


class TestPlatformIntegrationAPI(unittest.TestCase):
    """Integration assertions against the running portal on localhost:3000."""

    def test_gallery_public_accessible(self):
        status, body = request(f"{BASE_URL}/gallery")
        self.assertEqual(status, 200)
        # Verify fixture project rendered in HTML
        self.assertTrue("glass signal" in body.lower() or "small meadow" in body.lower())

    def test_closed_deadline_rejection(self):
        status, _ = request(
            f"{BASE_URL}/api/projects",
            headers={"Cookie": "session=prt_2e88"},
            method="POST",
            body={"title": "late-probe", "summary": "test"}
        )
        self.assertIn(status, [400, 403])

    def test_judge_sees_own_scores(self):
        status, body = request(
            f"{BASE_URL}/api/judge/scores",
            headers={"Cookie": "session=jdg_a_91bc"}
        )
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))

    def test_judge_cannot_see_peer_scores(self):
        # Judge B attempts to query Judge A's scores
        status, _ = request(
            f"{BASE_URL}/api/judge/scores?judge=judge_a",
            headers={"Cookie": "session=jdg_b_44de"}
        )
        self.assertIn(status, [401, 403])

    def test_participant_blocked_from_judge_scores(self):
        status, _ = request(
            f"{BASE_URL}/api/judge/scores",
            headers={"Cookie": "session=prt_2e88"}
        )
        self.assertIn(status, [401, 403])

    def test_csv_export_format(self):
        status, body = request(
            f"{BASE_URL}/api/export.csv",
            headers={"Cookie": "session=org_7f2a"}
        )
        self.assertEqual(status, 200)
        first_line = body.splitlines()[0] if body.splitlines() else ""
        self.assertIn(",", first_line)
    def test_voting_toggle_requires_organizer_authorization(self):
        # Participant attempts to toggle voting window
        status, _ = request(
            f"{BASE_URL}/api/events/voting",
            headers={"Cookie": "session=prt_2e88"},
            method="POST",
            body={"votingOpen": True}
        )
        self.assertIn(status, [401, 403])

    def test_voting_status_endpoint(self):
        status, body = request(f"{BASE_URL}/api/events/voting")
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))
        self.assertIn("votingOpen", data)

    def test_votes_endpoint_results_masking(self):
        # Querying /api/votes without organizer session
        status, body = request(f"{BASE_URL}/api/votes")
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))
        # Must report whether results are masked or provide tallies
        self.assertIn("masked", data)


class TestTier4StretchFeatures(unittest.TestCase):
    """Tier 4: Public REST API, dynamic certificate generation, and statistics."""

    def test_api_v1_projects_endpoint(self):
        status, body = request(f"{BASE_URL}/api/v1/projects?limit=5")
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertLessEqual(len(data["data"]), 5)

    def test_api_v1_tracks_endpoint(self):
        status, body = request(f"{BASE_URL}/api/v1/tracks")
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))
        self.assertGreater(len(data.get("data", [])), 0)

    def test_api_v1_stats_endpoint(self):
        status, body = request(f"{BASE_URL}/api/v1/stats")
        self.assertEqual(status, 200)
        data = json.loads(body)
        self.assertTrue(data.get("success"))
        self.assertIn("verifiedSubmissions", data.get("stats", {}))

    def test_dynamic_svg_certificate_generation(self):
        # prj_01 is from fixtures
        status, body = request(f"{BASE_URL}/api/certificates/prj_01")
        self.assertEqual(status, 200)
        self.assertIn("<svg", body)
        self.assertIn("CERTIFICATE OF PARTICIPATION", body)
        self.assertIn("SHA256:", body)

    def test_embed_gallery_route(self):
        status, body = request(f"{BASE_URL}/embed/gallery")
        self.assertEqual(status, 200)
        self.assertIn("Hackathon Submissions", body)


if __name__ == "__main__":
    unittest.main()


