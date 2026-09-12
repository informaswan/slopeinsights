# app/scrapers/base.py
import asyncio
import logging
from abc import ABC
from datetime import datetime, timezone
from typing import Callable, Awaitable

import httpx
from sqlalchemy.orm import Session

from app.models.scraper_health import ScraperHealth

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
CIRCUIT_BREAK_AFTER = 5
CIRCUIT_SKIP_RUNS = 6
RETRY_BACKOFF_BASE = 5  # exponential backoff: 5s, 10s, 20s


class ScraperError(Exception):
    pass


class BaseScraper(ABC):
    name: str  # subclasses must set this

    def __init__(self, db: Session):
        self.db = db
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=30.0,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (PowderPass/1.0; ski conditions app)"},
            )
        return self._client

    async def _fetch_json(self, url: str, headers: dict | None = None) -> dict:
        return await self._fetch(url, headers=headers, mode="json")

    async def _fetch_html(self, url: str, headers: dict | None = None) -> str:
        return await self._fetch(url, headers=headers, mode="html")

    async def _fetch(self, url: str, headers: dict | None = None, mode: str = "json"):
        last_exc: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self.client.get(url, headers=headers or {})
                resp.raise_for_status()
                return resp.json() if mode == "json" else resp.text
            except (httpx.NetworkError, httpx.TimeoutException, httpx.HTTPStatusError) as exc:
                last_exc = exc
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_BACKOFF_BASE * (2 ** attempt))
        raise ScraperError(f"Failed after {MAX_RETRIES} attempts: {last_exc}") from last_exc

    def _record_success(self) -> None:
        h = self._get_or_create_health()
        h.consecutive_failures = 0
        h.skip_until_run = 0
        h.status = "ok"
        h.last_run_at = datetime.now(timezone.utc)
        self.db.commit()

    def _record_failure(self, error: str) -> None:
        h = self._get_or_create_health()
        h.consecutive_failures = (h.consecutive_failures or 0) + 1
        h.status = "degraded"
        h.last_error = error
        h.last_run_at = datetime.now(timezone.utc)
        if h.consecutive_failures >= CIRCUIT_BREAK_AFTER:
            h.skip_until_run = CIRCUIT_SKIP_RUNS
        self.db.commit()

    def is_circuit_open(self) -> bool:
        h = self.db.query(ScraperHealth).filter_by(scraper_name=self.name).first()
        return bool(h and h.skip_until_run and h.skip_until_run > 0)

    def decrement_skip(self) -> None:
        h = self.db.query(ScraperHealth).filter_by(scraper_name=self.name).first()
        if h and h.skip_until_run and h.skip_until_run > 0:
            h.skip_until_run -= 1
            self.db.commit()

    def _get_or_create_health(self) -> ScraperHealth:
        h = self.db.query(ScraperHealth).filter_by(scraper_name=self.name).first()
        if not h:
            h = ScraperHealth(scraper_name=self.name, consecutive_failures=0,
                              skip_until_run=0, status="ok")
            self.db.add(h)
        return h

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()


async def run_concurrently(
    tasks: list[Callable[[], Awaitable[None]]],
    concurrency: int,
) -> None:
    """Run async callables with a bounded concurrency limit."""
    sem = asyncio.Semaphore(concurrency)

    async def _run(task):
        async with sem:
            await task()

    await asyncio.gather(*[_run(t) for t in tasks])
