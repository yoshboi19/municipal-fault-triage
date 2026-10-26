CREATE OR REPLACE FUNCTION submit_fault_with_clustering(
    p_citizen_id UUID,
    p_raw_description TEXT,
    p_ai_summary VARCHAR,
    p_fault_category VARCHAR,
    p_severity_level VARCHAR,
    p_photo_url TEXT,
    p_longitude DOUBLE PRECISION,
    p_latitude DOUBLE PRECISION
) RETURNS JSON AS $$
DECLARE
    v_point GEOGRAPHY(Point, 4326);
    v_cluster_id UUID;
    v_report_id UUID;
    v_is_new_cluster BOOLEAN := FALSE;
BEGIN
    v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

    SELECT cluster_id INTO v_cluster_id
    FROM incident_cluster
    WHERE fault_category = p_fault_category
      AND status IN ('Open', 'Dispatched')
      AND ST_DWithin(centroid_location, v_point, 50)
    ORDER BY ST_Distance(centroid_location, v_point) ASC
    LIMIT 1;

    IF v_cluster_id IS NOT NULL THEN
        UPDATE incident_cluster
        SET report_count = report_count + 1,
            updated_at = NOW()
        WHERE cluster_id = v_cluster_id;
    ELSE
        INSERT INTO incident_cluster (
            fault_category, severity_level, status, report_count, centroid_location
        ) VALUES (
            p_fault_category, p_severity_level, 'Open', 1, v_point
        ) RETURNING cluster_id INTO v_cluster_id;
        
        v_is_new_cluster := TRUE;
    END IF;

    INSERT INTO fault_report (
        citizen_id, cluster_id, raw_description, ai_summary,
        fault_category, severity_level, photo_url, gps_coordinates
    ) VALUES (
        p_citizen_id, v_cluster_id, p_raw_description, p_ai_summary,
        p_fault_category, p_severity_level, p_photo_url, v_point
    ) RETURNING report_id INTO v_report_id;

    RETURN json_build_object(
        'report_id', v_report_id,
        'cluster_id', v_cluster_id,
        'is_new_cluster', v_is_new_cluster
    );
END;
$$ LANGUAGE plpgsql;
