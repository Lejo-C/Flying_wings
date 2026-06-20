import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Cpu, Database, AlertCircle } from 'lucide-react';

export default function PerformanceHud({ 
  pd = 0, 
  far = 0, 
  f1 = 0, 
  latency = 0, 
  libraryCount = 0 
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
      <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] mb-4">
        <Target className="w-4.5 h-4.5 text-[#7D83FF]" />
        <span className="font-sans text-xs font-extrabold tracking-wider text-[#0F172A] uppercase">
          Prototype Performance Metrics HUD
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Detection Probability Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">UAS Detection (Pd)</span>
            <span className="text-[8px] bg-[#00E676]/10 text-emerald-600 font-bold px-1 rounded-sm">TARGET ≥90%</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-xl font-black text-[#0F172A]">{(pd * 100).toFixed(1)}%</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 self-center" />
          </div>
          <span className="text-[8.5px] text-[#64748B] mt-1 font-mono uppercase">FAR: {(far * 100).toFixed(1)}% (Limit ≤3%)</span>
        </div>

        {/* F1 Classification Performance */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">UAS F1-Score</span>
            <span className="text-[8px] bg-[#00E676]/10 text-emerald-600 font-bold px-1 rounded-sm">TARGET ≥0.85</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-xl font-black text-[#0F172A]">{f1.toFixed(2)}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 self-center" />
          </div>
          <span className="text-[8.5px] text-[#64748B] mt-1 font-mono uppercase">Ternary Output Classifier</span>
        </div>

        {/* Alert Latency Metric */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">Alert Latency</span>
            <span className="text-[8px] bg-[#00E676]/10 text-emerald-600 font-bold px-1 rounded-sm">LIMIT ≤2.0s</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-xl font-black text-[#0F172A]">{latency.toFixed(2)}s</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 self-center" />
          </div>
          <span className="text-[8.5px] text-[#64748B] mt-1 font-mono uppercase">ONSET-TO-ALERT TIME</span>
        </div>

        {/* Target Signature Library */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[9px] text-[#64748B] font-bold uppercase">Signature Library</span>
            <span className="text-[8px] bg-[#7D83FF]/15 text-[#7D83FF] font-bold px-1 rounded-sm">MATCH ACTIVE</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="font-mono text-xl font-black text-[#0F172A]">{libraryCount}</span>
            <Database className="w-3.5 h-3.5 text-[#7D83FF] self-center ml-1" />
          </div>
          <span className="text-[8.5px] text-[#64748B] mt-1 font-mono uppercase">Re-occurrence matching</span>
        </div>

      </div>
    </div>
  );
}
