import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Cpu, Database, AlertCircle, Grid } from 'lucide-react';

export default function PerformanceHud({ 
  pd = 0.0, 
  far = 0.0, 
  precision = 0.0,
  recall = 0.0,
  f1 = 0.0, 
  latency = 0.0, 
  libraryCount = 0,
  confusionMatrix = null
}) {
  // Render prediction summary table
  const renderPredictionSummary = () => {
    if (!confusionMatrix) {
      confusionMatrix = {
        "UAS-like": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0},
        "Non-UAS": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0},
        "Unknown": {"UAS-like": 0, "Non-UAS": 0, "Unknown": 0}
      };
    }

    const uasCount = confusionMatrix["UAS-like"]["UAS-like"] + confusionMatrix["Non-UAS"]["UAS-like"] + confusionMatrix["Unknown"]["UAS-like"];
    const nonUasCount = confusionMatrix["UAS-like"]["Non-UAS"] + confusionMatrix["Non-UAS"]["Non-UAS"] + confusionMatrix["Unknown"]["Non-UAS"];
    const unknownCount = confusionMatrix["UAS-like"]["Unknown"] + confusionMatrix["Non-UAS"]["Unknown"] + confusionMatrix["Unknown"]["Unknown"];
    
    return (
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#334155]">
        <div className="flex items-center space-x-1.5 mb-2">
          <Grid className="w-3.5 h-3.5 text-[#7D83FF]" />
          <span className="font-sans text-[10px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] uppercase tracking-wider">Detection Summary (Total Predictions)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center font-mono text-[9px] border border-[#E2E8F0] dark:border-[#334155]">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]">
                <th colSpan="3" className="px-2 py-1 font-extrabold uppercase text-center border-b border-[#E2E8F0] dark:border-[#334155] tracking-widest text-[10px]">
                  PREDICTED CLASS <span className="opacity-70 font-normal">(Model Output)</span>
                </th>
              </tr>
              <tr className="bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-b border-[#E2E8F0] dark:border-[#334155]">
                <th className="px-2 py-1 font-bold text-[#FF1744] w-1/3 border-r border-[#E2E8F0] dark:border-[#334155]">UAS-LIKE</th>
                <th className="px-2 py-1 font-bold text-emerald-600 w-1/3 border-r border-[#E2E8F0] dark:border-[#334155]">NON-UAS</th>
                <th className="px-2 py-1 font-bold text-amber-600 w-1/3">UNKNOWN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155] text-[#334155] dark:text-[#CBD5E1]">
              <tr className="hover:bg-[#F8FAFC] dark:hover:bg-[#334155] dark:bg-[#1E293B]">
                <td className={`px-2 py-2 border-r border-[#E2E8F0] dark:border-[#334155] font-semibold ${uasCount > 0 ? "bg-red-50 text-[#FF1744] font-bold text-lg" : "text-lg"}`}>{uasCount}</td>
                <td className={`px-2 py-2 border-r border-[#E2E8F0] dark:border-[#334155] font-semibold ${nonUasCount > 0 ? "bg-emerald-50 text-emerald-600 font-bold text-lg" : "text-lg"}`}>{nonUasCount}</td>
                <td className={`px-2 py-2 font-semibold ${unknownCount > 0 ? "bg-amber-50 text-amber-600 font-bold text-lg" : "text-lg"}`}>{unknownCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] rounded-lg p-5 shadow-sm">
      <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] dark:border-[#334155] mb-4">
        <Target className="w-4.5 h-4.5 text-[#7D83FF]" />
        <span className="font-sans text-xs font-extrabold tracking-wider text-[#0F172A] dark:text-[#F8FAFC] uppercase">
          Ternary Performance Metrics HUD
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Detection Probability Card */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase" title="Probability of Detection across all historical signals">Detection Prob (Pd)</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">PD ≥90%</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A] dark:text-[#F8FAFC]">{(pd * 100).toFixed(1)}%</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${pd >= 0.90 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <span className="text-[8px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono uppercase">FAR: {(far * 100).toFixed(1)}% (Limit ≤3%)</span>
        </div>

        {/* F1 Classification Performance */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase">Model F1-Score</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">F1 ≥0.85</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A] dark:text-[#F8FAFC]">{f1.toFixed(2)}</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${f1 >= 0.85 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <div className="text-[8px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono uppercase flex justify-between">
            <span>PR: {precision.toFixed(2)}</span>
            <span>RC: {recall.toFixed(2)}</span>
          </div>
        </div>

        {/* Alert Latency Metric */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase">Alert Latency</span>
            <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded-sm border border-emerald-200">LIMIT ≤2.0s</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A] dark:text-[#F8FAFC]">{latency.toFixed(3)}s</span>
            <CheckCircle2 className={`w-3.5 h-3.5 self-center ${latency <= 2.0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <span className="text-[8px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono uppercase">ONSET-TO-ALERT TIME</span>
        </div>

        {/* Target Signature Library */}
        <div className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase">Signature Library</span>
            <span className="text-[8px] bg-[#7D83FF]/10 text-[#7D83FF] font-bold px-1 rounded-sm border border-[#7D83FF]/25">MATCH ACTIVE</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-lg font-black text-[#0F172A] dark:text-[#F8FAFC]">{libraryCount}</span>
            <Database className="w-3.5 h-3.5 text-[#7D83FF] self-center ml-1" />
          </div>
          <span className="text-[8px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono uppercase">Similarity threshold 80%</span>
        </div>

      </div>

      {/* Render the Prediction Summary */}
      {renderPredictionSummary()}
    </div>
  );
}
