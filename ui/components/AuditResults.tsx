import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
} from "lucide-react";

import { ExecutiveSummary } from "./ExecutiveSummary";
import { ClusterSeverityBadge } from "./ClusterSeverityBadge";
import { DominanceIndicator } from "./DominanceIndicator";
import { SemanticScoreBar } from "./SemanticScoreBar";
import { TrendChart } from "./TrendChart";

/* =========================================================
   TYPES
========================================================= */

type SeverityLevel = "critical" | "high" | "moderate" | "low";

type DominanceType =
  | "competitor_dominant"
  | "you_dominant"
  | "competitive";

interface ClusterResult {
  id: string;
  cluster_topic: string;

  my_total_frequency: number;
  competitor_total_frequency: number;

  gap_score: number;
  semantic_score?: number;
  competitive_dominance_score?: number;

  dominance_type?: DominanceType;
  severity_level?: SeverityLevel;
  search_intent?: string;

  is_missing_cluster: boolean;

  cluster_description?: string;
  recommendation?: string;
}

interface AuditDetailResponse {
  audit: {
    id: string;
    created_at: string;
  };
  clusters: ClusterResult[];
}

interface TrendPoint {
  auditId: string;
  createdAt: string;
  totalGap: number;
  avgSemanticScore: number;
  avgDominanceScore: number;
  authorityIndex: number;
}

interface Props {
  auditId: string;
  onBack: () => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export const AuditResults: React.FC<Props> = ({
  auditId,
  onBack,
}) => {
  const [data, setData] =
    useState<AuditDetailResponse | null>(null);

  const [trendData, setTrendData] =
    useState<TrendPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [expanded, setExpanded] =
    useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const auditRes = await fetch(
          `/api/audit/${auditId}`
        );

        if (!auditRes.ok)
          throw new Error("Failed to fetch audit");

        const auditJson =
          await auditRes.json();

        const normalizedClusters =
          (auditJson.clusters || []).map(
            (c: any) => ({
              ...c,
              my_total_frequency:
                Number(c.my_total_frequency) || 0,
              competitor_total_frequency:
                Number(
                  c.competitor_total_frequency
                ) || 0,
              gap_score:
                Number(c.gap_score) || 0,
              semantic_score:
                Number(c.semantic_score) || 0,
              competitive_dominance_score:
                Number(
                  c.competitive_dominance_score
                ) || 0,
              dominance_type:
                c.dominance_type || "competitive",
              is_missing_cluster:
                Boolean(c.is_missing_cluster),
            })
          );

        setData({
          audit: auditJson.audit,
          clusters: normalizedClusters,
        });

        const trendRes = await fetch(
          `/api/audit/${auditId}/trends`
        );

        if (trendRes.ok) {
          const trendJson =
            await trendRes.json();
          setTrendData(trendJson || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auditId]);

  if (loading)
    return (
      <div className="text-center py-20 text-gray-400">
        Running Semantic Intelligence...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-red-500">
        {error}
      </div>
    );

  if (!data) return null;

  const { clusters } = data;

  return (
    <div className="space-y-10">

      {/* Back + PDF */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-gray-200 transition"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>

        <button
          onClick={() =>
            window.open(`/api/audit/${auditId}/export`, "_blank")
          }
          className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white rounded-lg transition"
        >
          Download PDF
        </button>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary auditId={auditId} />

      {/* Trend Section */}
      {trendData.length > 1 && (
        <div className="bg-[#26262E] border border-[#3A3A45] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 font-semibold text-gray-200">
            <TrendingUp size={16} className="text-[#FF6B35]" />
            Historical Performance Trend
          </div>

          <TrendChart data={trendData} />
        </div>
      )}

      {/* Cluster Intelligence */}
      <div className="bg-[#26262E] border border-[#3A3A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#3A3A45] font-semibold flex items-center gap-2 text-gray-200">
          <Activity size={16} className="text-[#FF6B35]" />
          Cluster-Level Intelligence
        </div>

        <div className="divide-y divide-[#3A3A45]">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="px-6 py-6"
            >
              <div className="flex justify-between items-center">

                <div>
                  <div className="font-semibold text-lg text-gray-100">
                    {cluster.cluster_topic}
                  </div>

                  <div className="text-sm text-gray-400 mt-1">
                    Yours: {cluster.my_total_frequency} | 
                    Competitors: {cluster.competitor_total_frequency} | 
                    Gap: {cluster.gap_score}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {cluster.severity_level && (
                    <ClusterSeverityBadge
                      severityLevel={
                        cluster.severity_level
                      }
                      size="sm"
                    />
                  )}

                  <button
                    onClick={() =>
                      setExpanded(
                        expanded === cluster.id
                          ? null
                          : cluster.id
                      )
                    }
                    className="text-gray-400 hover:text-gray-200 transition"
                  >
                    {expanded === cluster.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
              </div>

              {expanded === cluster.id && (
                <div className="mt-6 bg-[#2D2D36] border border-[#3A3A45] p-6 rounded-lg space-y-6 text-sm text-gray-300">

                  <SemanticScoreBar
                    score={
                      cluster.semantic_score || 0
                    }
                    label="Cluster Importance"
                  />

                  <DominanceIndicator
                    dominanceType={
                      cluster.dominance_type ||
                      "competitive"
                    }
                    dominanceScore={
                      cluster.competitive_dominance_score || 0
                    }
                  />

                  {cluster.search_intent && (
                    <div>
                      <strong className="text-gray-100">
                        Search Intent:
                      </strong>{" "}
                      {cluster.search_intent}
                    </div>
                  )}

                  {cluster.cluster_description && (
                    <div>
                      <strong className="text-gray-100">
                        Intelligence Insight:
                      </strong>
                      <p className="mt-1 text-gray-400">
                        {cluster.cluster_description}
                      </p>
                    </div>
                  )}

                  {cluster.recommendation && (
                    <div>
                      <strong className="text-gray-100">
                        Strategic Recommendation:
                      </strong>
                      <p className="mt-1 text-gray-400">
                        {cluster.recommendation}
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
