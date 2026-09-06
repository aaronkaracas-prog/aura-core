-- Where a still-running crawl is parked so CG_ENRICH COLLECT can finish it later. A healthy fresh
-- domain out-runs any synchronous poll; the job keeps for 14 days, so the id is the valuable thing.
ALTER TABLE cg_business ADD COLUMN crawl_job     TEXT;
ALTER TABLE cg_business ADD COLUMN crawl_started TEXT;
CREATE INDEX IF NOT EXISTS cg_job ON cg_business(crawl_job);
