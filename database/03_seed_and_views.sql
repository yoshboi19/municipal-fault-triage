CREATE OR REPLACE VIEW cluster_map_view AS
SELECT 
    cluster_id,
    fault_category,
    severity_level,
    status,
    report_count,
    ST_Y(centroid_location::geometry) AS latitude,
    ST_X(centroid_location::geometry) AS longitude,
    assigned_dispatch_id,
    created_at,
    updated_at
FROM incident_cluster;

ALTER TABLE citizen disable ROW LEVEL SECURITY;
ALTER TABLE dispatch_user disable ROW LEVEL SECURITY;
ALTER TABLE incident_cluster disable ROW LEVEL SECURITY;
ALTER TABLE fault_report disable ROW LEVEL SECURITY;

INSERT INTO citizen (citizen_id, full_name, phone_number, email)
VALUES ('11111111-1111-1111-1111-111111111111', 'Thabo Mokoena', '0821234567', 'thabo@example.co.za')
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO dispatch_user (dispatch_id, full_name, department, role, email)
VALUES ('22222222-2222-2222-2222-222222222222', 'Sipho Ndlovu', 'Roads', 'Senior Dispatcher', 'sipho@joburg.org.za')
ON CONFLICT (email) DO NOTHING;
