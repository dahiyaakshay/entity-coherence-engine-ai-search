import React, { useEffect, useState } from "react";
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface ExecutiveSummaryResponse {
  auditId: string;
  executive_summary: string;
  semantic_authority_index: number;
  competitive_dominance_index: number;
  high_risk_clusters: number;
  opportunity_clusters: number;
  generated_at: string;
}

interface ExecutiveSummaryProps {
  auditId: string;
}

export const ExecutiveSummary: React.FC<
  ExecutiveSummaryProps
> = ({ auditId }) => {
  const [data, setData] =
    useState<ExecutiveSummaryResponse | null>(
      null
    );
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/audit/${auditId}/summary`
        );

        if (!res.ok) {
          throw new Error(
            "Failed to fetch executive summary"
          );
        }

        const json: ExecutiveSummaryResponse =
          await res.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [auditId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        Generating AI executive summary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No executive summary available.
      </div>
    );
  }

  return (
    <div className="bg-[#26262E] border border-[#3A3A45] rounded-xl p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-[#FF6B35]" />
        <h2 className="text-2xl font-semibold text-gray-100">
          Executive Summary
        </h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Authority */}
        <div className="bg-[#2D2D36] border border-[#3A3A45] p-5 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-2">
            Semantic Authority
          </div>
          <div className="text-3xl font-bold text-gray-100">
            {data.semantic_authority_index.toFixed(2)}
          </div>
        </div>

        {/* Dominance */}
        <div className="bg-[#2D2D36] border border-[#3A3A45] p-5 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-2">
            Competitive Dominance
          </div>
          <div className="text-3xl font-bold text-gray-100">
            {data.competitive_dominance_index.toFixed(2)}
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-[#2D2D36] border border-[#3A3A45] p-5 rounded-lg text-center">
          <div className="text-sm text-red-400 mb-2 flex items-center justify-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            High Risk Clusters
          </div>
          <div className="text-3xl font-bold text-red-400">
            {data.high_risk_clusters}
          </div>
        </div>

        {/* Opportunity */}
        <div className="bg-[#2D2D36] border border-[#3A3A45] p-5 rounded-lg text-center">
          <div className="text-sm text-[#FF6B35] mb-2 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Opportunity Clusters
          </div>
          <div className="text-3xl font-bold text-[#FF6B35]">
            {data.opportunity_clusters}
          </div>
        </div>

      </div>

      {/* Summary Narrative */}
      <div className="bg-[#2D2D36] border border-[#3A3A45] p-6 rounded-lg text-gray-300 leading-relaxed whitespace-pre-line">
        {data.executive_summary}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-gray-400" />
          AI Intelligence Engine
        </div>
        <div>
          Generated:{" "}
          {new Date(
            data.generated_at
          ).toLocaleString()}
        </div>
      </div>

    </div>
  );
};
