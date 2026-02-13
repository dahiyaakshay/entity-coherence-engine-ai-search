import React, { useState } from "react";
import { AuditForm } from "./components/AuditForm";
import { AuditResults } from "./components/AuditResults";
import { LayoutDashboard } from "lucide-react";

const App: React.FC = () => {
  const [currentAuditId, setCurrentAuditId] =
    useState<string | null>(null);

  const handleBack = () => {
    setCurrentAuditId(null);
  };

  return (
    <div className="min-h-screen bg-[#1F1F24] text-gray-100 font-sans">

      {/* =========================
          Header
      ========================== */}
      <header className="bg-[#26262E] border-b border-[#3A3A45] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-[#FF6B35]" />
            <h1 className="text-xl font-semibold tracking-tight">
              Entity Coherence Engine
            </h1>
          </div>

          {currentAuditId && (
            <div className="text-sm text-gray-400">
              Audit ID:{" "}
              <span className="font-mono text-gray-300">
                {currentAuditId.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>
      </header>

      {/* =========================
          Main Content
      ========================== */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {currentAuditId ? (
          <AuditResults
            auditId={currentAuditId}
            onBack={handleBack}
          />
        ) : (
          <div className="space-y-14">

            {/* Intro Section */}
            <div className="text-center max-w-3xl mx-auto space-y-6">

              <h2 className="text-4xl font-bold tracking-tight">
                Analyze Your{" "}
                <span className="text-[#FF6B35]">
                  AI-Search Entity Coverage
                </span>
              </h2>

              <p className="text-lg text-gray-400 leading-relaxed">
                Run a local entity coherence audit to identify semantic gaps,
                topical dominance weaknesses, and competitive visibility risks —
                fully offline, no external AI APIs required.
              </p>

            </div>

            {/* Form Section */}
            <div className="bg-[#26262E] border border-[#3A3A45] rounded-xl p-8 shadow-sm">
              <AuditForm
                onAuditComplete={setCurrentAuditId}
              />
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;
