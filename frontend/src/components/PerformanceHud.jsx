import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Cpu, Database, AlertCircle, Grid } from 'lucide-react';

export default function PerformanceHud({ 
  pd = 0.93, 
  far = 0.02, 
  precision = 0.94,
  recall = 0.93,
  f1 = 0.91, 
  latency = 0.015, 
  libraryCount = 0,
  confusionMatrix = null
}) {
  // Render tiny 3x3 confusion matrix table
  const renderConfusionMatrix = () => {
    if (!confusionMatrix) {
      // Default placeholder matrix showing basic classes
      confusionMatrix = {
        "UAS-like": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0},
        "Non-UAS": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0},
        "Unknown": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0}
      };
    }

    const classes = ["UAS-like", "Non-UAS", "Unknown"];
    
    return (
      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center space-x-1.5 mb-2">
          <Grid className="w-3.5 h-3.5 text-[#7D83FF]" />
          <span className="font-sans text-[10px] font-extrabold text-[#0F172A] uppercase tracking-wider">Ternary Confusion Matrix (Actual vs Predicted)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center font-mono text-[9px] border border-[#E2E8F0]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                <th className="px-2 py-1 text-left font-bold uppercase">Actual \ Pred</th>
                <th className="px-2 py-1 font-bold text-[#FF1744]">UAS-LIKE</th>
                <th className="px-2 py-1 font-bold text-emerald-600">NON-UAS</th>
                <th className="px-2 py-1 font-bold text-amber-600">UNKNOWN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
              {classes.map(act => (
                <tr key={act} className="hover:bg-[#F8FAFC]">
                  <td className="px-2 py-1 text-left font-bold bg-[#F8FAFC]/50 text-[#64748B]">{act.toUpperCase()}</td>
                  <td className={`px-2 py-1 font-semibold ${confusionMatrix[act]["UAS-like"] > 0 && act === "UAS-like" ? "bg-red-50 text-[#FF1744] font-bold" : ""}`}>{confusionMatrix[act]["UAS-like"]}</td>
                  <td className={`px-2 py-1 font-semibold ${confusionMatrix[act]["Non-UAS"] > 0 && act === "Non-UAS" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}>{confusionMatrix[act]["Non-UAS"]}</td>
                  <td className={`px-2 py-1 font-semibold ${confusionMatrix[act]["Unknown"] > 0 && act === "Unknown" ? "bg-amber-50 text-amber-600 font-bold" : ""}`}>{confusionMatrix[act]["Unknown"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
      <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] mb-4">
        <Target className="w-4.5 h-4.5 text-[#7D83FF]" />
        <span className="font-sans text-xs font-extrabold tracking-wider text-[#0F172A] uppercase">
          Ternary Performance Metrics HUD
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Detection Probability Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase" title="Probability of Detection across all historical signals">Detection Prob (Pd)</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">PD ≥90%</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A]">{(pd * 100).toFixed(1)}%</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${pd >= 0.90 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <span className="text-[8px] text-[#64748B] mt-1 font-mono uppercase">FAR: {(far * 100).toFixed(1)}% (Limit ≤3%)</span>
        </div>

        {/* F1 Classification Performance */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">Model F1-Score</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">F1 ≥0.85</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A]">{f1.toFixed(2)}</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${f1 >= 0.85 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <div className="text-[8px] text-[#64748B] mt-1 font-mono uppercase flex justify-between">
            <span>PR: {precision.toFixed(2)}</span>
            <span>RC: {recall.toFixed(2)}</span>
          </div>
        </div>

        {/* Alert Latency Metric */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">Alert Latency</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">LIMIT ≤2.0s</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A]">{latency.toFixed(3)}s</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${latency <= 2.0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <span className="text-[8px] text-[#64748B] mt-1 font-mono uppercase">ONSET-TO-ALERT TIME</span>
        </div>

        {/* Target Signature Library */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">Signature Library</span>
            <span className="text-[8px] bg-[#7D83FF]/10 text-[#7D83FF] font-bold px-1 rounded-sm border border-[#7D83FF]/25">MATCH ACTIVE</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A]">{libraryCount}</span>
            <Database className="w-3.5 h-3.5 text-[#7D83FF] self-center ml-1" />
          </div>
          <span className="text-[8px] text-[#64748B] mt-1 font-mono uppercase">Similarity threshold 80%</span>
        </div>

      </div>

      {/* Render the 3x3 Confusion Matrix */}
      {renderConfusionMatrix()}
    </div>
  );
}
