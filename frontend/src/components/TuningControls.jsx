import React, { useState } from 'react';
import { Sliders, AlertTriangle, Info, ToggleLeft, ToggleRight, Cpu } from 'lucide-react';

export default function TuningControls({
  confidenceThreshold,
  setConfidenceThreshold
}) {
  const [adaptiveNoise, setAdaptiveNoise] = useState(true);

  const getSensitivityStatus = () => {
    if (confidenceThreshold < 0.50) {
      return {
        text: 'HIGH SENSITIVITY / FALSE ALARM RATE RISK',
        colorClass: 'text-[#FF1744] bg-[#FF1744]/10 border-[#FF1744]/20',
        alert: true
      };
    } else if (confidenceThreshold >= 0.85) {
      return {
        text: 'HIGH CONFIDENCE LOCK / CONSERVATIVE MODE',
        colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        alert: false
      };
    } else {
      return {
        text: 'OPTIMAL OPERATING BAND (BALANCED)',
        colorClass: 'text-[#7D83FF] bg-[#7D83FF]/10 border-[#7D83FF]/20',
        alert: false
      };
    }
  };

  const status = getSensitivityStatus();

  return (
    <div className="bg-white dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] rounded-lg p-5 shadow-sm space-y-5">
      
      {/* Title */}
      <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
        <Sliders className="w-4.5 h-4.5 text-[#7D83FF]" />
        <span className="font-sans text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-wider uppercase">
          Operator Threshold & Latency Controls
        </span>
      </div>

      <div className="space-y-4">
        
        {/* Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-bold">Confidence Threshold Tuning</span>
            <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] px-2 py-0.5 rounded">
              {confidenceThreshold.toFixed(2)}
            </span>
          </div>
          
          <input 
            type="range" 
            min="0.00" 
            max="1.00" 
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#7D83FF] focus:outline-none"
          />
          
          <div className="flex justify-between font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] px-0.5">
            <span>0.0 (SENSITIVE)</span>
            <span>0.5 (BALANCED)</span>
            <span>1.0 (CONSERVATIVE)</span>
          </div>
        </div>

        {/* Status indicator banner */}
        <div className={`border p-2.5 rounded-lg font-mono text-[10px] flex items-center space-x-2.5 leading-snug transition-all ${status.colorClass}`}>
          {status.alert ? (
            <AlertTriangle className="w-4 h-4 text-[#FF1744] shrink-0 animate-bounce" />
          ) : (
            <Info className="w-4 h-4 text-[#7D83FF] shrink-0" />
          )}
          <div>
            <span className="font-bold uppercase">Sensitivity Alert:</span> {status.text}
          </div>
        </div>

      </div>

    </div>
  );
}
