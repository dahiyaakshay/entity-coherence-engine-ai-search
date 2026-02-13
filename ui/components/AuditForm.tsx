import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface AuditFormProps {
  onAuditComplete: (auditId: string) => void;
}

export const AuditForm: React.FC<AuditFormProps> = ({
  onAuditComplete,
}) => {
  const [myUrl, setMyUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    const cleanedMyUrl = myUrl.trim();

    if (!cleanedMyUrl || !isValidUrl(cleanedMyUrl)) {
      setError("Please enter a valid URL for your page.");
      setLoading(false);
      return;
    }

    const competitors = competitorUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    for (const url of competitors) {
      if (!isValidUrl(url)) {
        setError(`Invalid competitor URL: ${url}`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/run-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          myUrl: cleanedMyUrl,
          competitorUrls: competitors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Audit failed.");
      }

      onAuditComplete(data.auditId);

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#1F1F24] border border-[#2a2a30] p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">
        Start New Entity Audit
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* My URL */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            My Page URL
          </label>
          <input
            type="url"
            required
            value={myUrl}
            onChange={(e) => setMyUrl(e.target.value)}
            placeholder="https://mysite.com/page"
            className="w-full px-4 py-3 bg-[#2a2a30] border border-[#3a3a42] text-white rounded-xl focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] outline-none transition"
          />
        </div>

        {/* Competitors */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Competitor URLs (One per line)
          </label>
          <textarea
            value={competitorUrls}
            onChange={(e) => setCompetitorUrls(e.target.value)}
            rows={5}
            placeholder="https://competitor1.com/page
https://competitor2.com/page"
            className="w-full px-4 py-3 bg-[#2a2a30] border border-[#3a3a42] text-white rounded-xl focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to run audit without competitors.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/40 border border-red-700 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#ff6b35] hover:bg-[#ff5a20] text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Audit...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Audit
            </>
          )}
        </button>
      </form>
    </div>
  );
};
