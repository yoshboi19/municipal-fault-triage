-- 1. Enable the PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create CITIZEN Table
CREATE TABLE citizen (
    citizen_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create DISPATCH_USER Table
CREATE TABLE dispatch_user (
    dispatch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(30) DEFAULT 'Technician',
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create INCIDENT_CLUSTER Table
CREATE TABLE incident_cluster (
    cluster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fault_category VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'Open',
    report_count INT DEFAULT 1,
    centroid_location GEOGRAPHY(Point, 4326) NOT NULL,
    assigned_dispatch_id UUID REFERENCES dispatch_user(dispatch_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create FAULT_REPORT Table
CREATE TABLE fault_report (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizen(citizen_id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES incident_cluster(cluster_id) ON DELETE SET NULL,
    raw_description TEXT NOT NULL,
    ai_summary VARCHAR(255),
    fault_category VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    photo_url TEXT,
    gps_coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Spatial Indexes
CREATE INDEX idx_cluster_location ON incident_cluster USING GIST (centroid_location);
CREATE INDEX idx_report_location ON fault_report USING GIST (gps_coordinates);
