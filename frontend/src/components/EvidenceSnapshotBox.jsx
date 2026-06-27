import React, { useState } from 'react';
import { Target, Layers, Download, Compass, HelpCircle, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function EvidenceSnapshotBox({ selectedAlert }) {
  const [activeTab, setActiveTab] = useState('spectrogram'); // 'spectrogram' | 'breakdown' | 'similarity'

  const BACKEND_URL = 'http://localhost:8000';

  const renderSpectrogramTab = () => {
    if (!selectedAlert.evidencePath) {
      return (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC]">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <span className="font-sans text-xs text-[#64748B] font-bold uppercase">No Spectrogram Image Found</span>
        </div>
      );
    }

    const imgUrl = `${BACKEND_URL}/${selectedAlert.evidencePath}`;

    return (
      <div className="space-y-3">
        {/* Heatmap Image Container */}
        <div className="relative border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#0F172A] flex justify-center items-center">
          <img 
            src={imgUrl} 
            alt="RF Spectrogram Plot" 
            className="w-full max-h-[160px] object-contain block"
            onError={(e) => {
              // fallback if server fails
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none' }} className="w-full h-[160px] flex-col items-center justify-center bg-[#0F172A] text-white font-mono text-[10px]">
            <span>LOADING ERROR OR EXPIRED FILE</span>
          </div>
        </div>
        <div className="text-[9px] font-mono text-[#64748B] text-center uppercase tracking-wide">
          Real RF Heatmap // Resized to 320x160 bilinear 
        </div>
      </div>
    );
  };

  const renderBreakdownTab = () => {
    const bd = selectedAlert.latency_breakdown || {
      loading: 0,
      preprocessing: 0,
      spectrogram: 0,
      onnx: 0,
      postprocessing: 0,
      total: 0
    };

    const items = [
      { name: "Dataset Loading Time", val: bd.loading },
      { name: "Preprocessing (DC & Normalization) Time", val: bd.preprocessing },
      { name: "Spectrogram (STFT & Resize) Gen Time", val: bd.spectrogram },
      { name: "ONNX MobileNetV3 Inference Time", val: bd.onnx },
      { name: "Postprocessing (Temporal Voting) Time", val: bd.postprocessing },
    ];

    return (
      <div className="space-y-2 font-mono text-[10px] text-[#334155]">
        <span className="block font-sans text-[10px] text-[#64748B] font-extrabold tracking-wider uppercase mb-1">
          Detailed Latency Breakdown (ms)
        </span>
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-lg divide-y divide-[#E2E8F0] space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between pt-1.5 first:pt-0">
              <span className="text-[#64748B]">{item.name}:</span>
              <span className="font-bold text-[#0F172A]">{item.val.toFixed(2)} ms</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-[#CBD5E1] font-bold text-xs text-[#7D83FF]">
            <span>Total End-to-End Latency:</span>
            <span>{bd.total.toFixed(2)} ms</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSimilarityTab = () => {
    const matches = selectedAlert.similar_matches || [];

    if (matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-center font-mono text-[10px] text-[#64748B]">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="font-sans text-xs font-bold text-emerald-600 uppercase mb-0.5">Unique Signature</span>
          <span>No historical re-occurrence matched &gt; 80%.</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <span className="block font-sans text-[10px] text-[#64748B] font-extrabold tracking-wider uppercase mb-1">
          Re-occurrence Cosine Similarity Search
        </span>
        <div className="space-y-2">
          {matches.map((match, i) => (
            <div key={i} className="border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 rounded-lg font-mono text-[10px] hover:border-[#7D83FF] transition">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#7D83FF] text-[10.5px]">Match #{i+1} // {match.event_id.slice(0,8)}</span>
                <span className="bg-[#7D83FF]/15 text-[#7D83FF] font-bold px-1.5 py-0.5 rounded text-[9.5px]">
                  SIMILARITY: {(match.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[#64748B] text-[9.5px]">
                <div>Freq: <span className="text-[#0F172A] font-bold">{match.center_freq.toFixed(1)} MHz</span></div>
                <div>BW: <span className="text-[#0F172A] font-bold">{match.bandwidth.toFixed(1)} MHz</span></div>
                <div className="col-span-2 mt-0.5">Logged: <span className="text-[#0F172A] font-bold">{new Date(match.timestamp).toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4.5 h-4.5 text-[#7D83FF]" />
          <span className="font-sans text-xs font-extrabold text-[#0F172A] tracking-wider uppercase">
            Evidence Snapshot & Signature Matching
          </span>
        </div>
      </div>

      {!selectedAlert ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 border border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC] text-center">
          <Layers className="w-8 h-8 text-[#CBD5E1] mb-3" />
          <p className="font-sans text-xs text-[#64748B] font-bold max-w-[250px] uppercase leading-relaxed">
            Select an alert emission row to load feature tensor details
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tab Switcher */}
          <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg text-[10px] font-sans font-bold">
            <button
              onClick={() => setActiveTab('spectrogram')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'spectrogram'
                  ? 'bg-white text-[#7D83FF] border border-[#7D83FF]/10 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              SPECTROGRAM EVIDENCE
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'breakdown'
                  ? 'bg-white text-[#7D83FF] border border-[#7D83FF]/10 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              LATENCY BREAKDOWN
            </button>
            <button
              onClick={() => setActiveTab('similarity')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'similarity'
                  ? 'bg-white text-[#7D83FF] border border-[#7D83FF]/10 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              PREVIOUS MATCHES
            </button>
          </div>

          {/* Render Active Tab */}
          {activeTab === 'spectrogram' && renderSpectrogramTab()}
          {activeTab === 'breakdown' && renderBreakdownTab()}
          {activeTab === 'similarity' && renderSimilarityTab()}

          {/* Event Metadata Summary Features */}
          <div className="space-y-2">
            <span className="block font-mono text-[9px] text-[#64748B] font-bold tracking-wider uppercase">
              Extraction Summary Features
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-lg">
              
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Center Freq:</span>
                  <span className="text-[#0F172A] font-bold">{selectedAlert.centerFreq.toFixed(1)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Bandwidth:</span>
                  <span className="text-[#0F172A] font-bold">{selectedAlert.bandwidth.toFixed(1)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Sample Rate:</span>
                  <span className="text-[#0F172A] font-bold">{(selectedAlert.sampleRate / 1e6).toFixed(1)} MHz</span>
                </div>
              </div>

              <div className="space-y-1.5 border-l border-[#E2E8F0] pl-3">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Ground Truth:</span>
                  <span className={`font-bold ${
                    selectedAlert.groundTruth === 'UAS-like' ? 'text-[#FF1744]' : 'text-[#64748B]'
                  }`}>{selectedAlert.groundTruth || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Lock Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-ping"></span>
                    LOCK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Database ID:</span>
                  <span className="text-[#7D83FF] font-bold truncate max-w-[50px]">{selectedAlert.event_id ? selectedAlert.event_id.slice(0, 8) : selectedAlert.id}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
