/* =========================================================
   CORE AUDIT TYPES
   ========================================================= */

export interface AuditMeta {
  id: string;
  created_at: string;
}

export interface AuditResponse {
  success?: boolean;
  auditId: string;
}

/* =========================================================
   CLUSTER INTELLIGENCE
   ========================================================= */

export type SeverityLevel =
  | "critical"
  | "high"
  | "moderate"
  | "low";

export type DominanceType =
  | "competitor_dominant"
  | "you_dominant"
  | "competitive";

export interface ClusterResult {
  id: string;
  audit_id: string;

  cluster_topic: string;

  my_total_frequency: number;
  competitor_total_frequency: number;

  gap_score: number;
  is_missing_cluster: boolean;

  /* Intelligence Enhancements */
  cluster_description?: string;
  recommendation?: string;
  top_phrases?: string[];
  semantic_score?: number;

  /* Advanced Scoring */
  severity?: SeverityLevel;
  dominance?: DominanceType;

  /* Future Expansion Ready */
  authority_index?: number;
  dominance_score?: number;
  weighted_score?: number;
  intent?: string;
  similarity_score?: number;
}

/* =========================================================
   EXECUTIVE SUMMARY
   ========================================================= */

export interface ExecutiveSummary {
  executive_summary: string;
  total_clusters: number;
  missing_clusters: number;
  high_severity_clusters: number;
  overall_authority_score?: number;
  competitive_position?: string;
}

/* =========================================================
   TREND TRACKING
   ========================================================= */

export interface TrendPoint {
  date: string;
  authority_score: number;
  total_gaps: number;
}

export interface TrendResponse {
  audit_id: string;
  trend: TrendPoint[];
}

/* =========================================================
   FULL AUDIT DETAIL RESPONSE
   ========================================================= */

export interface AuditDetailResponse {
  audit: AuditMeta;
  executive_summary?: string;
  clusters: ClusterResult[];
}

/* =========================================================
   PDF EXPORT
   ========================================================= */

export interface PdfExportOptions {
  includeExecutiveSummary?: boolean;
  includeClusterDetails?: boolean;
  includeSeverityBreakdown?: boolean;
  includeTrendData?: boolean;
}
