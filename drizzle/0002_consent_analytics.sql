-- Consent-gated aggregate analytics. No IP address, full user-agent or account ID is stored.
CREATE TABLE IF NOT EXISTS visitor_consents (
  visitor_hash varchar(64) PRIMARY KEY,
  analytics boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS site_analytics_events (
  id serial PRIMARY KEY,
  visitor_hash varchar(64) NOT NULL REFERENCES visitor_consents(visitor_hash) ON DELETE CASCADE,
  purpose varchar(12) NOT NULL,
  kind varchar(12) NOT NULL,
  page_path varchar(300) NOT NULL,
  country_code varchar(2),
  device_class varchar(12) NOT NULL,
  metric_name varchar(8),
  metric_value_milli integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_analytics_created_idx ON site_analytics_events (created_at);
CREATE INDEX IF NOT EXISTS site_analytics_country_idx ON site_analytics_events (country_code, created_at);
CREATE INDEX IF NOT EXISTS site_analytics_device_idx ON site_analytics_events (device_class, created_at);
