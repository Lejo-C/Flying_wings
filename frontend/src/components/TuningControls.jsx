import React, { useState } from 'react';
import { Sliders, AlertTriangle, Info, ToggleLeft, ToggleRight, Cpu } from 'lucide-react';

export default function TuningControls({
  confidenceThreshold,
  setConfidenceThreshold,
  smoothingWindow,
  setSmoothingWindow
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
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-5">
      
      {/* Title */}
      <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0]">
        <Sliders className="w-4.5 h-4.5 text-[#7D83FF]" />
        <span className="font-sans text-xs font-extrabold text-[#0F172A] tracking-wider uppercase">
          Operator Threshold & Latency Controls
        </span>
      </div>

      <div className="space-y-4">
        
        {/* Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#64748B] font-bold">Confidence Threshold Tuning</span>
            <span className="text-[#0F172A] font-bold bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-0.5 rounded">
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
          
          <div className="flex justify-between font-mono text-[9px] text-[#64748B] px-0.5">
            <span>0.0 (SENSITIVE)</span>
            <span>0.5 (BALANCED)</span>
            <span>1.0 (CONSERVATIVE)</span>
          </div>
        </div>

        {/* Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono text-[#64748B] font-bold">
            Temporal Smoothing Buffer
          </label>
          <div className="relative">
            <select
              value={smoothingWindow}
              onChange={(e) => setSmoothingWindow(parseInt(e.target.value))}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#7D83FF] text-[#0F172A] font-sans text-xs rounded-lg py-2 px-3.5 focus:outline-none focus:border-[#7D83FF] transition cursor-pointer appearance-none shadow-sm"
            >
              <option value={1}>1 Frame (No Accumulation)</option>
              <option value={3}>3 Frames (Fast Capture Lock)</option>
              <option value={5}>5 Frames (Standard Accumulator)</option>
              <option value={10}>10 Frames (High Smoothing - Slow Alert)</option>
              <option value={20}>20 Frames (Deep Integration)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#64748B] text-[8px]">
              ▼
            </div>
          </div>
          <p className="text-[9.5px] text-[#64748B] leading-tight font-sans">
            Accumulates multi-frame decision matrices to reduce ambient signal fading interference.
          </p>
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

        {/* Latency Compute Metrics */}
        <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
          <span className="block font-mono text-[10px] text-[#64748B] font-bold tracking-wider uppercase">
            Compute Baseline Metrics (Laptop CPU)
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
              <div className="flex justify-between items-center text-[#64748B] text-[9px] font-bold">
                <span>MODEL INFERENCE</span>
                <span className="bg-[#7D83FF]/15 text-[#7D83FF] text-[8px] px-1 rounded-sm">INT8</span>
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-[#0F172A]">
                &lt; 2.45 ms
              </div>
            </div>
            
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
              <div className="flex justify-between items-center text-[#64748B] text-[9px] font-bold">
                <span>FEATURE MAPPING</span>
                <span className="bg-[#7D83FF]/15 text-[#7D83FF] text-[8px] px-1 rounded-sm">FP16</span>
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-[#0F172A]">
                &lt; 142.5 ms
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
