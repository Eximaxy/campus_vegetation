CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    nickname VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user',
    care_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    plant_type VARCHAR(32) NOT NULL,
    species VARCHAR(80),
    campus_zone VARCHAR(80),
    health_status VARCHAR(24) NOT NULL,
    care_level VARCHAR(24) NOT NULL,
    last_care_at TIMESTAMP,
    description TEXT,
    photo_url TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE care_records (
    id BIGSERIAL PRIMARY KEY,
    plant_id BIGINT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id),
    care_type VARCHAR(32) NOT NULL,
    location_desc VARCHAR(160),
    note TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE TABLE issue_reports (
    id BIGSERIAL PRIMARY KEY,
    plant_id BIGINT REFERENCES plants(id) ON DELETE SET NULL,
    reporter_id BIGINT NOT NULL REFERENCES app_users(id),
    issue_type VARCHAR(32) NOT NULL,
    risk_level VARCHAR(16) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pending',
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_plants_geom ON plants USING GIST (geom);
CREATE INDEX idx_care_records_geom ON care_records USING GIST (geom);
CREATE INDEX idx_issue_reports_geom ON issue_reports USING GIST (geom);

CREATE VIEW v_plant_heatmap AS
SELECT
    ST_Centroid(ST_Collect(geom)) AS geom,
    COUNT(*) AS point_count,
    SUM(weight) AS heat_weight
FROM (
    SELECT geom, 2.0 AS weight FROM plants
    UNION ALL
    SELECT geom, 1.0 AS weight FROM care_records WHERE status = 'approved' AND geom IS NOT NULL
    UNION ALL
    SELECT geom, 1.5 AS weight FROM issue_reports WHERE status IN ('approved', 'processing', 'resolved')
) t
GROUP BY ST_SnapToGrid(geom, 0.00035);

CREATE VIEW v_issue_summary AS
SELECT
    issue_type,
    risk_level,
    status,
    COUNT(*) AS total
FROM issue_reports
GROUP BY issue_type, risk_level, status;
