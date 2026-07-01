import React from 'react';
import { Database, ShieldAlert, Wifi, Search, HelpCircle, HardDrive, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AlertLogTable({ 
  alerts, 
  selectedAlertId, 
  onSelectAlert, 
  confidenceThreshold 
}) {
  const filteredAlerts = alerts.filter(a => a.confidence >= confidenceThreshold);

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'UAS-like':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-sans font-extrabold bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744]">
            <ShieldAlert className="w-3 h-3 mr-1" />
            UAS-LIKE
          </span>
        );
      case 'Non-UAS':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-sans font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            <Wifi className="w-3 h-3 mr-1" />
            NON-UAS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-sans font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-600">
            <HelpCircle className="w-3 h-3 mr-1" />
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] rounded-lg flex flex-col h-full shadow-sm">
      
      {/* Header */}
      <div className="bg-[#F8FAFC] dark:bg-[#1E293B] px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#7D83FF]" />
          <span className="font-sans text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC] tracking-wider uppercase">
            Actionable Alert Timeline Log
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-bold">
          CONFIDENCE CUTOFF: <span className="text-[#7D83FF]">{(confidenceThreshold * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-[300px] flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#64748B] dark:text-[#94A3B8] border-b border-[#E2E8F0] dark:border-[#334155] font-mono text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-sm">
              <th className="px-4 py-2 font-bold uppercase">Signal Details</th>
              <th className="px-4 py-2 font-bold uppercase">Time Bounds (Dataset Onset &gt; Offset)</th>
              <th className="px-4 py-2 font-bold uppercase text-center">Output Class</th>
              <th className="px-4 py-2 font-bold uppercase text-right">Confidence</th>
              <th className="px-4 py-2 font-bold uppercase text-right">Freq / BW</th>
              <th className="px-2 py-2 font-bold uppercase text-center">HUD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155] font-mono text-xs text-[#334155] dark:text-[#CBD5E1]">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[#64748B] dark:text-[#94A3B8] italic text-[11px]">
                  No emissions exceed confidence threshold. Adjust threshold slider.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = alert.id === selectedAlertId;
                const isUas = alert.category === 'UAS-like';
                
                return (
                  <tr 
                    key={alert.id}
                    onClick={() => onSelectAlert(alert)}
                    className={`cursor-pointer transition-colors duration-150 group hover:bg-[#7D83FF]/5 ${
                      isSelected 
                        ? 'bg-[#7D83FF]/10 border-l-2 border-[#7D83FF]' 
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className={`font-sans font-bold text-xs ${isSelected ? 'text-[#7D83FF]' : 'text-[#0F172A] dark:text-[#F8FAFC]'} group-hover:text-[#7D83FF]`}>
                          {alert.matchingLibrary !== 'None' ? alert.matchingLibrary : 'Unidentified Emission'}
                        </span>
                        <div className="flex items-center space-x-1.5 text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          {alert.matchingLibrary !== 'None' ? (
                            <span className="flex items-center text-[#7D83FF] font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> LIB MATCH
                            </span>
                          ) : (
                            <span className="flex items-center text-amber-600 font-bold">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> NEW EMISSION
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center">
                            <HardDrive className="w-2.5 h-2.5 mr-0.5" /> 
                            {alert.cached ? 'DB CACHED' : 'UNCACHED'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                      <div className="flex items-center space-x-1">
                        <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{alert.onset}</span>
                        <span>&gt;</span>
                        <span>{alert.offset}</span>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-center">
                      {getCategoryBadge(alert.category)}
                    </td>

                    <td className={`px-4 py-2 text-right font-bold text-sm ${
                      isUas 
                        ? 'text-[#FF1744]' 
                        : alert.confidence >= 0.8 
                        ? 'text-[#7D83FF]' 
                        : 'text-[#0F172A] dark:text-[#F8FAFC]'
                    }`}>
                      {(alert.confidence * 100).toFixed(1)}%
                    </td>

                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{alert.centerFreq.toFixed(1)} MHz</span>
                        <span className="text-[#64748B] dark:text-[#94A3B8] text-[9px]">BW: {alert.bandwidth.toFixed(1)} MHz</span>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center text-[#64748B] dark:text-[#94A3B8]">
                      <Search className={`w-4 h-4 mx-auto ${
                        isSelected 
                          ? 'text-[#7D83FF]' 
                          : 'group-hover:text-[#7D83FF] transition-colors'
                      }`} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics info */}
      <div className="bg-[#F8FAFC] dark:bg-[#1E293B] px-4 py-2 border-t border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
        <div>
          TIMELINE EMISSIONS: {filteredAlerts.length} OF {alerts.length} DISPLAYED
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#FF1744] mr-1"></span>UAS</span>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>NON-UAS</span>
        </div>
      </div>
    </div>
  );
}
