-- Where the source crawl lives in R2. The row points at the text it was extracted from, so a better
-- model later can re-read the original instead of re-crawling a site that has since changed.
ALTER TABLE cg_business ADD COLUMN raw_key TEXT;
