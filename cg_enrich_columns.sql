-- Columns CG_ENRICH writes. Kept SEPARATE from the Overture columns on purpose: `email` is what
-- the dataset said, `email_found` is what the shop's own site said. When they disagree, that is a
-- fact worth having rather than an overwrite.
ALTER TABLE cg_business ADD COLUMN phone_found   TEXT;
ALTER TABLE cg_business ADD COLUMN artists       TEXT;
ALTER TABLE cg_business ADD COLUMN styles        TEXT;
ALTER TABLE cg_business ADD COLUMN understanding TEXT;
CREATE INDEX IF NOT EXISTS cg_crawled ON cg_business(crawled_at);
