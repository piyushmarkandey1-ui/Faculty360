import pytest
import httpx
from app.services.connectors.google_scholar import GoogleScholarConnector
from app.core.config import settings


def test_validate_google_scholar_ids():
    connector = GoogleScholarConnector()

    # Raw ID
    assert connector.validate("QCgDx7AAAAAJ") == "QCgDx7AAAAAJ"
    assert connector.validate("  QCgDx7AAAAAJ  ") == "QCgDx7AAAAAJ"

    # Full URLs
    assert connector.validate("https://scholar.google.com/citations?user=QCgDx7AAAAAJ&hl=en") == "QCgDx7AAAAAJ"
    assert connector.validate("https://scholar.google.co.in/citations?user=QCgDx7AAAAAJ") == "QCgDx7AAAAAJ"
    assert connector.validate("scholar.google.com/citations?user=QCgDx7AAAAAJ") == "QCgDx7AAAAAJ"
    assert connector.validate("user=QCgDx7AAAAAJ") == "QCgDx7AAAAAJ"
    assert connector.validate("https://scholar.google.com/citations/QCgDx7AAAAAJ") == "QCgDx7AAAAAJ"


def test_serpapi_parsing(monkeypatch):
    connector = GoogleScholarConnector()

    mock_serpapi_response = {
        "author": {
            "name": "Dr. Alan Turing",
            "affiliations": "University of Manchester",
        },
        "cited_by": {
            "table": [
                {"citations": {"all": 12500}},
                {"h_index": {"all": 42}},
                {"i10_index": {"all": 88}}
            ]
        },
        "articles": [
            {
                "title": "Computing Machinery and Intelligence",
                "publication": "Mind 59 (236), 433-460",
                "year": "1950",
                "cited_by": {"value": 8500}
            },
            {
                "title": "On Computable Numbers, with an Application to the Entscheidungsproblem",
                "publication": "Proceedings of the London Mathematical Society 2 (1), 230-265",
                "year": "1936",
                "cited_by": {"value": 4000}
            }
        ]
    }

    class MockResponse:
        status_code = 200
        def json(self):
            return mock_serpapi_response

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, params=None, headers=None):
            return MockResponse()

    monkeypatch.setattr(httpx, "Client", MockClient)
    monkeypatch.setattr(settings, "SERPAPI_API_KEY", "test_serpapi_key")

    res = connector._fetch_serpapi("alan_turing_123")
    assert res["status"] == "completed"
    assert res["author"]["name"] == "Dr. Alan Turing"
    assert res["author"]["h_index"] == 42
    assert res["author"]["total_citations"] == 12500
    assert len(res["publications"]) == 2
    assert res["publications"][0]["title"] == "Computing Machinery and Intelligence"
    assert res["publications"][0]["year"] == 1950
    assert res["publications"][0]["citation_count"] == 8500


def test_direct_scrape_parsing(monkeypatch):
    connector = GoogleScholarConnector()

    sample_html = """
    <html>
    <body>
        <div id="gsc_prf_in">Ada Lovelace</div>
        <div class="gsc_prf_il">Analytic Engine Pioneer</div>
        <table id="gsc_rsb_st">
            <tr><td class="gsc_rsb_std">3200</td></tr>
            <tr><td class="gsc_rsb_std">1500</td></tr>
            <tr><td class="gsc_rsb_std">18</td></tr>
        </table>
        <table id="gsc_a_t">
            <tbody id="gsc_a_b">
                <tr class="gsc_a_tr">
                    <td class="gsc_a_t">
                        <a class="gsc_a_at" href="/citations?view_op=view_citation">Sketch of the Analytical Engine</a>
                        <div class="gs_gray">A Lovelace, LF Menabrea</div>
                        <div class="gs_gray">Scientific Memoirs 3, 666-731</div>
                    </td>
                    <td class="gsc_a_c"><a class="gsc_a_ac gs_ibl">2100</a></td>
                    <td class="gsc_a_y"><span class="gsc_a_h gsc_a_hc gs_ibl">1843</span></td>
                </tr>
            </tbody>
        </table>
    </body>
    </html>
    """

    class MockResponse:
        status_code = 200
        text = sample_html

    class MockClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, headers=None, follow_redirects=True):
            return MockResponse()

    monkeypatch.setattr(httpx, "Client", MockClient)

    res = connector._fetch_direct_scrape("ada_lovelace_123")
    assert res["status"] == "completed"
    assert res["author"]["name"] == "Ada Lovelace"
    assert res["author"]["total_citations"] == 3200
    assert res["author"]["h_index"] == 18
    assert len(res["publications"]) == 1
    assert res["publications"][0]["title"] == "Sketch of the Analytical Engine"
    assert res["publications"][0]["year"] == 1843
    assert res["publications"][0]["citation_count"] == 2100


def test_no_fallback_raises_error_on_failure(monkeypatch):
    connector = GoogleScholarConnector()

    monkeypatch.setattr(settings, "SERPAPI_API_KEY", "")
    monkeypatch.setattr(settings, "APIFY_API_TOKEN", "")

    class MockFailingClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, headers=None, follow_redirects=True):
            class FailedResponse:
                status_code = 404
                text = "Not Found"
            return FailedResponse()

    monkeypatch.setattr(httpx, "Client", MockFailingClient)

    # Must raise ValueError with explicit message instead of silently returning fake data
    with pytest.raises(ValueError) as excinfo:
        connector.fetch_and_normalize("nonexistent_id_999")

    assert "Failed to fetch live Google Scholar data" in str(excinfo.value)
