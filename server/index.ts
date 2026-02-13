import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { query, withTransaction } from "./db.js";

// Services
import { getTrendData } from "./services/trendService.ts";
import { generateAuditPDF } from "./services/pdfService.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* =========================================================
   UTIL: Run Python Engine
========================================================= */
function runPythonAudit(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(
      __dirname,
      "../engine/audit.py"
    );

    const pythonProcess = spawn(
      process.env.PYTHON_PATH || "python",
      [pythonScriptPath]
    );

    let outputBuffer = "";
    let errorBuffer = "";

    pythonProcess.stdin.write(JSON.stringify(payload));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      outputBuffer += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorBuffer += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(errorBuffer || "Python engine failed")
        );
      }

      try {
        const parsed = JSON.parse(outputBuffer);
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch {
        reject(
          new Error("Failed to parse Python response")
        );
      }
    });
  });
}

/* =========================================================
   RUN AUDIT
========================================================= */
app.post("/api/run-audit", async (req, res) => {
  const { myUrl, competitorUrls = [] } = req.body;

  if (!myUrl || typeof myUrl !== "string") {
    return res
      .status(400)
      .json({ error: "Valid myUrl is required" });
  }

  try {
    const result = await runPythonAudit({
      myUrl,
      competitorUrls,
    });

    const {
      executive_summary,
      semantic_authority_index,
      competitive_dominance_index,
      concept_clusters,
    } = result;

    const clusters = Array.isArray(concept_clusters)
      ? concept_clusters
      : [];

    const totalClusters = clusters.length;
    const totalMissingClusters = clusters.filter(
      (c: any) => c.is_missing_cluster
    ).length;

    const weightedGapScore = clusters.reduce(
      (sum: number, c: any) =>
        sum + (Number(c.weighted_gap_score) || 0),
      0
    );

    const auditId = await withTransaction(
      async (client) => {
        /* ===============================
           INSERT AUDIT RECORD
        =============================== */
        const auditInsert =
          await client.query(
            `
            INSERT INTO audits
            (
              my_url,
              competitor_urls,
              executive_summary,
              semantic_authority_index,
              competitive_dominance_index,
              weighted_gap_score,
              total_clusters,
              total_missing_clusters
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id
            `,
            [
              myUrl,
              JSON.stringify(competitorUrls),
              executive_summary || null,
              semantic_authority_index ?? 0,
              competitive_dominance_index ?? 0,
              weightedGapScore,
              totalClusters,
              totalMissingClusters,
            ]
          );

        const id = auditInsert.rows[0].id;

        /* ===============================
           INSERT CLUSTERS
        =============================== */
        for (const raw of clusters) {
          await client.query(
            `
            INSERT INTO concept_clusters
            (
              audit_id,
              cluster_topic,
              my_total_frequency,
              competitor_total_frequency,
              gap_score,
              weighted_gap_score,
              dominance_type,
              competitive_dominance_score,
              semantic_score,
              semantic_similarity_score,
              authority_weight,
              severity_level,
              severity_score,
              search_intent,
              is_missing_cluster,
              cluster_description,
              recommendation,
              top_phrases,
              competitor_breakdown
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19::jsonb)
            `,
            [
              id,
              raw.cluster_topic || "",
              Number(raw.my_total_frequency || 0),
              Number(raw.competitor_total_frequency || 0),
              Number(raw.gap_score || 0),
              raw.weighted_gap_score ?? null,
              raw.dominance_type || null,
              raw.competitive_dominance_score ?? null,
              raw.semantic_score ?? null,
              raw.semantic_similarity_score ?? null,
              raw.authority_weight ?? null,
              raw.severity_level || null,
              raw.severity_score ?? null,
              raw.search_intent || null,
              Boolean(raw.is_missing_cluster),
              raw.cluster_description || null,
              raw.recommendation || null,
              JSON.stringify(raw.top_phrases || []),
              JSON.stringify(raw.competitor_breakdown || {}),
            ]
          );

          /* ===============================
             TREND SNAPSHOT
          =============================== */
          await client.query(
            `
            INSERT INTO cluster_trends
            (
              cluster_topic,
              audit_id,
              gap_score,
              semantic_score,
              dominance_score,
              authority_index
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            `,
            [
              raw.cluster_topic,
              id,
              raw.gap_score ?? 0,
              raw.semantic_score ?? null,
              raw.competitive_dominance_score ?? null,
              semantic_authority_index ?? 0,
            ]
          );
        }

        return id;
      }
    );

    return res.json({
      success: true,
      auditId,
      semantic_authority_index,
      competitive_dominance_index,
    });
  } catch (err: any) {
    console.error("Audit Error:", err.message);
    return res.status(500).json({
      error: err.message || "Audit failed",
    });
  }
});

/* =========================================================
   GET AUDIT DETAILS
========================================================= */
app.get("/api/audit/:id", async (req, res) => {
  try {
    const audit = await query(
      `SELECT * FROM audits WHERE id = $1`,
      [req.params.id]
    );

    if (audit.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Audit not found" });
    }

    const clusters = await query(
      `SELECT * FROM concept_clusters
       WHERE audit_id = $1
       ORDER BY gap_score DESC`,
      [req.params.id]
    );

    return res.json({
      audit: audit.rows[0],
      clusters: clusters.rows,
    });
  } catch {
    return res.status(500).json({
      error: "Failed to fetch audit",
    });
  }
});

/* =========================================================
   EXECUTIVE SUMMARY
========================================================= */
app.get("/api/audit/:id/summary", async (req, res) => {
  const { id } = req.params;

  try {
    const auditResult = await query(
      `SELECT * FROM audits WHERE id = $1`,
      [id]
    );

    if (auditResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Audit not found" });
    }

    const audit = auditResult.rows[0];

    const clusterResult = await query(
      `SELECT severity_level, is_missing_cluster
       FROM concept_clusters
       WHERE audit_id = $1`,
      [id]
    );

    const clusters = clusterResult.rows;

    const highRiskClusters = clusters.filter(
      (c: any) =>
        c.severity_level === "critical" ||
        c.severity_level === "high"
    ).length;

    const opportunityClusters = clusters.filter(
      (c: any) => c.is_missing_cluster === true
    ).length;

    return res.json({
      auditId: audit.id,
      executive_summary: audit.executive_summary,
      semantic_authority_index:
        Number(audit.semantic_authority_index) || 0,
      competitive_dominance_index:
        Number(audit.competitive_dominance_index) || 0,
      high_risk_clusters: highRiskClusters,
      opportunity_clusters: opportunityClusters,
      generated_at: audit.created_at,
    });
  } catch {
    return res.status(500).json({
      error: "Failed to generate executive summary",
    });
  }
});

/* =========================================================
   TRENDS
========================================================= */
app.get("/api/audit/:id/trends", async (req, res) => {
  try {
    const trends = await getTrendData(req.params.id);
    return res.json(trends);
  } catch {
    return res.status(500).json({
      error: "Trend fetch failed",
    });
  }
});

/* =========================================================
   PDF EXPORT
========================================================= */
app.get("/api/audit/:id/export", async (req, res) => {
  try {
    const clusters = await query(
      `SELECT * FROM concept_clusters WHERE audit_id = $1`,
      [req.params.id]
    );

    const pdfBuffer = await generateAuditPDF(
      req.params.id,
      clusters.rows
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-${req.params.id}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch {
    return res.status(500).json({
      error: "Export failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `🚀 AI Search Intelligence Engine running at http://localhost:${PORT}`
  );
});
