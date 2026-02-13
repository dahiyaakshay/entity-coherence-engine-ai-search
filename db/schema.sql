-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- =========================================================
-- AUDITS
-- =========================================================
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core metadata
    my_url TEXT NOT NULL,
    competitor_urls JSONB NOT NULL,

    -- Executive Intelligence
    executive_summary TEXT,
    semantic_authority_index NUMERIC(6,2),
    competitive_dominance_index NUMERIC(6,2),

    -- Weighted intelligence
    weighted_gap_score NUMERIC(8,2),
    total_clusters INT DEFAULT 0,
    total_missing_clusters INT DEFAULT 0,

    -- Trend tracking snapshot
    previous_audit_id UUID REFERENCES audits(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audits_created_at
ON audits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audits_authority
ON audits(semantic_authority_index DESC);


-- =========================================================
-- CONCEPT CLUSTERS
-- =========================================================
CREATE TABLE IF NOT EXISTS concept_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- Core semantic topic
    cluster_topic TEXT NOT NULL,

    -- Frequencies
    my_total_frequency INT NOT NULL DEFAULT 0,
    competitor_total_frequency INT NOT NULL DEFAULT 0,

    -- Gap analysis
    gap_score INT NOT NULL DEFAULT 0,
    weighted_gap_score NUMERIC(8,2),

    -- Competitive intelligence
    dominance_type TEXT CHECK (
        dominance_type IN (
            'competitor_dominant',
            'you_dominant',
            'competitive'
        )
    ),
    competitive_dominance_score NUMERIC(6,2),

    -- Authority & semantic metrics
    semantic_score NUMERIC(6,2),
    semantic_similarity_score NUMERIC(6,2),
    authority_weight NUMERIC(6,2),

    -- Severity mapping
    severity_level TEXT CHECK (
        severity_level IN ('critical','high','moderate','low')
    ),
    severity_score NUMERIC(6,2),

    -- AI classification
    search_intent TEXT CHECK (
        search_intent IN (
            'informational',
            'commercial',
            'transactional',
            'navigational',
            'mixed'
        )
    ),

    -- Flags
    is_missing_cluster BOOLEAN NOT NULL DEFAULT FALSE,

    -- Intelligence metadata
    cluster_description TEXT,
    recommendation TEXT,

    -- Structured JSON intelligence
    top_phrases JSONB,
    competitor_breakdown JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clusters_audit
ON concept_clusters(audit_id);

CREATE INDEX IF NOT EXISTS idx_clusters_topic
ON concept_clusters USING gin (cluster_topic gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clusters_gap
ON concept_clusters(gap_score DESC);

CREATE INDEX IF NOT EXISTS idx_clusters_severity
ON concept_clusters(severity_level);

CREATE INDEX IF NOT EXISTS idx_clusters_intent
ON concept_clusters(search_intent);

CREATE INDEX IF NOT EXISTS idx_clusters_missing
ON concept_clusters(is_missing_cluster);


-- =========================================================
-- TREND TRACKING
-- =========================================================
CREATE TABLE IF NOT EXISTS cluster_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    cluster_topic TEXT NOT NULL,
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    gap_score INT,
    semantic_score NUMERIC(6,2),
    dominance_score NUMERIC(6,2),
    authority_index NUMERIC(6,2),

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trends_topic
ON cluster_trends(cluster_topic);

CREATE INDEX IF NOT EXISTS idx_trends_time
ON cluster_trends(recorded_at DESC);


-- =========================================================
-- ENTITIES (Optional Evidence Layer)
-- =========================================================
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    entity_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    entity_type TEXT,
    frequency INT DEFAULT 1,
    snippet TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entities_audit
ON entities(audit_id);

CREATE INDEX IF NOT EXISTS idx_entities_normalized
ON entities(normalized_name);


-- =========================================================
-- PAGES (Scrape Tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    page_type TEXT CHECK (page_type IN ('mine','competitor')),

    word_count INT,
    content_hash TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_audit
ON pages(audit_id);
