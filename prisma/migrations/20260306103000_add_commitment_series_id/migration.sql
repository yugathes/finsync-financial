ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS series_id UUID;

CREATE INDEX IF NOT EXISTS commitments_series_id_idx
ON commitments(series_id);
