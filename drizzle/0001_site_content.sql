-- Additive migration for organiser-managed page content blocks.
CREATE TABLE IF NOT EXISTS site_content (
  id serial PRIMARY KEY,
  page_path varchar(300) NOT NULL,
  placement varchar(10) NOT NULL DEFAULT 'bottom',
  title varchar(200) NOT NULL DEFAULT '',
  body text NOT NULL,
  link_label varchar(80),
  link_url varchar(500),
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_content_page_pub_idx ON site_content (page_path, published);
