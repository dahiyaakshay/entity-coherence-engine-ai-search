import PDFDocument from "pdfkit";
import { Writable } from "stream";

/* ============================================================
   TYPES
============================================================ */

export interface ClusterPDFModel {
  cluster_topic: string;
  my_total_frequency: number;
  competitor_total_frequency: number;
  gap_score: number;
  semantic_score?: number | null;
  recommendation?: string | null;
}

export interface ExecutiveSummaryModel {
  overallSemanticAuthority: number;
  competitiveDominanceIndex: number;
  totalClusters: number;
  missingClusters: number;
  strongestCluster?: string;
  weakestCluster?: string;
  summaryText: string;
}

export interface AuditPDFPayload {
  auditId: string;
  createdAt: string;
  summary: ExecutiveSummaryModel;
  clusters: ClusterPDFModel[];
}

/* ============================================================
   INTERNAL SERVICE CLASS
============================================================ */

class PDFService {
  static buildPDF(payload: AuditPDFPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: "A4",
        });

        const buffers: Buffer[] = [];

        const stream = new Writable({
          write(chunk, _encoding, callback) {
            buffers.push(chunk);
            callback();
          },
        });

        doc.pipe(stream);

        /* ============================================================
           HEADER
        ============================================================ */

        doc
          .fontSize(20)
          .text("AI Search Intelligence Report", { align: "center" });

        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .fillColor("gray")
          .text(`Audit ID: ${payload.auditId}`, { align: "center" })
          .text(`Generated: ${payload.createdAt}`, { align: "center" });

        doc.moveDown(2);
        doc.fillColor("black");

        /* ============================================================
           EXECUTIVE SUMMARY
        ============================================================ */

        doc
          .fontSize(16)
          .text("Executive Summary", { underline: true });

        doc.moveDown(1);
        doc.fontSize(11);

        doc.text(payload.summary.summaryText);

        doc.moveDown(1.5);

        doc.text(
          `Overall Semantic Authority Index: ${payload.summary.overallSemanticAuthority}`
        );
        doc.text(
          `Competitive Dominance Index: ${payload.summary.competitiveDominanceIndex}`
        );
        doc.text(
          `Total Clusters Identified: ${payload.summary.totalClusters}`
        );
        doc.text(
          `Missing Strategic Clusters: ${payload.summary.missingClusters}`
        );

        if (payload.summary.strongestCluster) {
          doc.text(`Strongest Cluster: ${payload.summary.strongestCluster}`);
        }

        if (payload.summary.weakestCluster) {
          doc.text(`Largest Gap Cluster: ${payload.summary.weakestCluster}`);
        }

        doc.addPage();

        /* ============================================================
           CLUSTER BREAKDOWN
        ============================================================ */

        doc
          .fontSize(16)
          .text("Cluster Intelligence Breakdown", { underline: true });

        doc.moveDown(1);

        payload.clusters.slice(0, 20).forEach((cluster, index) => {
          doc
            .fontSize(13)
            .fillColor("black")
            .text(`${index + 1}. ${cluster.cluster_topic}`);

          doc.moveDown(0.5);
          doc.fontSize(10);

          doc.text(`Your Coverage: ${cluster.my_total_frequency}`);
          doc.text(
            `Competitor Coverage: ${cluster.competitor_total_frequency}`
          );
          doc.text(`Gap Score: ${cluster.gap_score}`);

          if (cluster.semantic_score !== undefined) {
            doc.text(
              `Semantic Authority Score: ${cluster.semantic_score}`
            );
          }

          if (cluster.recommendation) {
            doc.moveDown(0.3);
            doc.fillColor("blue").text("Strategic Recommendation:");
            doc.fillColor("black").text(cluster.recommendation);
          }

          doc.moveDown(1.5);
        });

        doc.end();

        stream.on("finish", () => {
          resolve(Buffer.concat(buffers));
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

/* ============================================================
   NAMED EXPORT (MATCHES index.ts IMPORT)
============================================================ */

export async function generateAuditPDF(
  auditId: string,
  clusters: ClusterPDFModel[]
): Promise<Buffer> {

  const summary: ExecutiveSummaryModel = {
    overallSemanticAuthority: 0,
    competitiveDominanceIndex: 0,
    totalClusters: clusters.length,
    missingClusters: clusters.filter(c => c.gap_score > 0 && c.my_total_frequency === 0).length,
    strongestCluster: clusters[0]?.cluster_topic,
    weakestCluster: clusters[clusters.length - 1]?.cluster_topic,
    summaryText:
      "This report outlines semantic coverage gaps, authority weaknesses, and competitive dominance insights identified during the AI Search Intelligence audit.",
  };

  const payload: AuditPDFPayload = {
    auditId,
    createdAt: new Date().toISOString(),
    summary,
    clusters,
  };

  return PDFService.buildPDF(payload);
}
