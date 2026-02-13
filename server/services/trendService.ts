import { query } from "../db.js";

/* =========================================================
   TYPES
========================================================= */

export interface AuditTrendPoint {
  auditId: string;
  createdAt: string;
  totalGap: number;
  avgSemanticScore: number;
  avgDominanceScore: number;
  authorityIndex: number;
}

export interface ClusterTrendPoint {
  auditId: string;
  recordedAt: string;
  gapScore: number;
  semanticScore: number | null;
  dominanceScore: number | null;
  authorityIndex: number | null;
}

/* =========================================================
   AUDIT-LEVEL TREND (REAL TIMELINE)
   Returns trend history for same my_url across audits
========================================================= */

export async function getTrendData(auditId: string) {
  /* -------------------------------------------------------
     Step 1: Get the my_url for this audit
  ------------------------------------------------------- */
  const auditResult = await query(
    `SELECT my_url FROM audits WHERE id = $1`,
    [auditId]
  );

  if (auditResult.rowCount === 0) {
    throw new Error("Audit not found");
  }

  const myUrl = auditResult.rows[0].my_url;

  /* -------------------------------------------------------
     Step 2: Get all audits for same URL
  ------------------------------------------------------- */
  const auditsResult = await query(
    `
    SELECT id, created_at,
           weighted_gap_score,
           semantic_authority_index,
           competitive_dominance_index
    FROM audits
    WHERE my_url = $1
    ORDER BY created_at ASC
    `,
    [myUrl]
  );

  const audits = auditsResult.rows;

  if (audits.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
     Step 3: Build clean trend structure
  ------------------------------------------------------- */

  const timeline: AuditTrendPoint[] = audits.map((a) => ({
    auditId: a.id,
    createdAt: a.created_at,
    totalGap: Number(a.weighted_gap_score || 0),
    avgSemanticScore: Number(a.semantic_authority_index || 0),
    avgDominanceScore: Number(
      a.competitive_dominance_index || 0
    ),
    authorityIndex: Number(
      a.semantic_authority_index || 0
    ),
  }));

  return timeline;
}

/* =========================================================
   CLUSTER-LEVEL HISTORY (Optional Advanced Mode)
========================================================= */

export async function getClusterHistory(
  clusterTopic: string,
  myUrl: string
): Promise<ClusterTrendPoint[]> {
  const result = await query(
    `
    SELECT
      ct.audit_id,
      ct.gap_score,
      ct.semantic_score,
      ct.dominance_score,
      ct.authority_index,
      ct.recorded_at
    FROM cluster_trends ct
    JOIN audits a ON a.id = ct.audit_id
    WHERE ct.cluster_topic = $1
    AND a.my_url = $2
    ORDER BY ct.recorded_at ASC
    `,
    [clusterTopic, myUrl]
  );

  return result.rows.map((row) => ({
    auditId: row.audit_id,
    recordedAt: row.recorded_at,
    gapScore: Number(row.gap_score || 0),
    semanticScore:
      row.semantic_score !== null
        ? Number(row.semantic_score)
        : null,
    dominanceScore:
      row.dominance_score !== null
        ? Number(row.dominance_score)
        : null,
    authorityIndex:
      row.authority_index !== null
        ? Number(row.authority_index)
        : null,
  }));
}
