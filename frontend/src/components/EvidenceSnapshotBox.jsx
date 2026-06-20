import React, { useState, useEffect, useRef } from 'react';
import { Target, Layers, Download, Compass, HelpCircle } from 'lucide-react';

export default function EvidenceSnapshotBox({ selectedAlert }) {
  const [activeTab, setActiveTab] = useState('red'); // 'red' | 'green' | 'blue'
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, show: false });

  useEffect(() => {
    if (!selectedAlert || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 320;
    const height = canvas.height = 160;

    // Draw dark background inside visualizer to keep heatmap color clarity
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    const drawHeatmap = () => {
      const imgData = ctx.createImageData(width, height);
      const isUas = selectedAlert.category === 'UAS-like';
      const isNonUas = selectedAlert.category === 'Non-UAS';
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIdx = (y * width + x) * 4;
          const nx = (x / width) * 2 - 1;
          const ny = (y / height) * 2 - 1;
          
          let intensity = 0;

          if (isUas) {
            if (activeTab === 'red') {
              const comb = Math.abs(Math.sin(nx * 12)) * 0.4;
              const envelope = Math.max(0, 1 - Math.abs(nx * 1.5));
              const noise = Math.random() * 0.15;
              const pulses = Math.max(0, Math.sin(ny * 8 + nx * 4)) * 0.35;
              intensity = (comb * envelope + pulses + noise) * 1.1;
            } else if (activeTab === 'green') {
              const phaseLines = Math.sin(nx * 20 + ny * 10) * 0.5 + 0.5;
              const envelope = Math.max(0, 1 - Math.abs(nx * 1.2));
              const noise = Math.random() * 0.15;
              intensity = (phaseLines * envelope + noise);
            } else {
              const nodeX = Math.abs(Math.sin(nx * 8)) > 0.85 ? 1 : 0.1;
              const nodeY = Math.abs(Math.sin(ny * 8)) > 0.85 ? 1 : 0.1;
              const envelope = Math.max(0, 1 - (nx * nx + ny * ny) * 0.8);
              const noise = Math.random() * 0.1;
              intensity = (nodeX * nodeY * envelope + noise) * 1.3;
            }
          } else if (isNonUas) {
            if (activeTab === 'red') {
              const wifiDome = Math.abs(nx) < 0.6 ? 0.75 : Math.max(0, 0.75 - (Math.abs(nx) - 0.6) * 4);
              const noise = Math.random() * 0.12;
              intensity = (wifiDome * 0.8 + noise);
            } else if (activeTab === 'green') {
              intensity = (Math.random() * 0.7 + (1 - Math.abs(nx)) * 0.25);
            } else {
              const line = Math.max(0, 1 - Math.abs(nx) * 15);
              const noise = Math.random() * 0.15;
              intensity = (line * 0.7 + noise);
            }
          } else {
            const blobs = Math.sin(nx * 4) * Math.cos(ny * 4) * 0.3 + 0.35;
            const noise = Math.random() * 0.35;
            intensity = (blobs + noise);
          }

          intensity = Math.min(1.0, Math.max(0, intensity));

          if (activeTab === 'red') {
            imgData.data[pixelIdx] = Math.floor(intensity * 255);
            imgData.data[pixelIdx + 1] = Math.floor(Math.max(0, intensity - 0.4) * 200);
            imgData.data[pixelIdx + 2] = Math.floor(Math.max(0, intensity - 0.7) * 255);
            imgData.data[pixelIdx + 3] = 255;
          } else if (activeTab === 'green') {
            imgData.data[pixelIdx] = Math.floor(Math.max(0, intensity - 0.8) * 150);
            imgData.data[pixelIdx + 1] = Math.floor(intensity * 230);
            imgData.data[pixelIdx + 2] = Math.floor(Math.max(0, intensity - 0.5) * 180);
            imgData.data[pixelIdx + 3] = 255;
          } else {
            imgData.data[pixelIdx] = Math.floor(Math.max(0, intensity - 0.7) * 255);
            imgData.data[pixelIdx + 1] = Math.floor(Math.max(0, intensity - 0.25) * 210);
            imgData.data[pixelIdx + 2] = Math.floor(intensity * 255);
            imgData.data[pixelIdx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Grid overlays
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      for (let i = 1; i < 8; i++) {
        const x = (i / 8) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let i = 1; i < 6; i++) {
        const y = (i / 6) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Corners target markers
      ctx.strokeStyle = isUas ? '#FF1744' : '#7D83FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 10); ctx.lineTo(25, 10);
      ctx.moveTo(10, 10); ctx.lineTo(10, 25);
      ctx.moveTo(width - 10, 10); ctx.lineTo(width - 25, 10);
      ctx.moveTo(width - 10, 10); ctx.lineTo(width - 10, 25);
      ctx.stroke();
    };

    drawHeatmap();

  }, [selectedAlert, activeTab]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates
    const normX = ((x / canvas.width) * 2 - 1).toFixed(3);
    const normY = ((1 - (y / canvas.height)) * 2 - 1).toFixed(3);
    setMousePos({ x: normX, y: normY, show: true, pxX: x, pxY: y });
  };

  const handleMouseLeave = () => {
    setMousePos(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4.5 h-4.5 text-[#7D83FF]" />
          <span className="font-sans text-xs font-extrabold text-[#0F172A] tracking-wider uppercase">
            Evidence Snapshot & Summary Features
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
          
          {/* Channel Selector Tab Switcher */}
          <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg text-[10px] font-sans font-bold">
            <button
              onClick={() => setActiveTab('red')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'red'
                  ? 'bg-white text-[#FF1744] border border-[#FF1744]/20 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              LOG-MAG [RED]
            </button>
            <button
              onClick={() => setActiveTab('green')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'green'
                  ? 'bg-white text-emerald-600 border border-emerald-500/20 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              DIFF PHASE [GREEN]
            </button>
            <button
              onClick={() => setActiveTab('blue')}
              className={`flex-1 py-1.5 px-2 text-center rounded-md transition ${
                activeTab === 'blue'
                  ? 'bg-white text-[#7D83FF] border border-[#7D83FF]/20 shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              CYCLIC CSD [BLUE]
            </button>
          </div>

          {/* Heatmap Canvas */}
          <div className="relative border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#0F172A]">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-[160px] block cursor-crosshair"
            />

            {mousePos.show && (
              <>
                {/* Horizontal guide */}
                <div 
                  className="absolute left-0 right-0 border-t border-dashed border-white/20 pointer-events-none" 
                  style={{ top: `${mousePos.pxY}px` }}
                />
                {/* Vertical guide */}
                <div 
                  className="absolute top-0 bottom-0 border-l border-dashed border-white/20 pointer-events-none" 
                  style={{ left: `${mousePos.pxX}px` }}
                />
                {/* Reticle Lock Coordinate Display */}
                <div 
                  className="absolute bg-[#0F172A] border border-[#334155] text-[9px] font-mono text-white px-2 py-1 rounded shadow-md pointer-events-none"
                  style={{ 
                    left: `${Math.min(mousePos.pxX + 12, 210)}px`, 
                    top: `${Math.min(mousePos.pxY + 12, 110)}px` 
                  }}
                >
                  <div className="text-[#7D83FF] font-bold">RF LOCK COORDS</div>
                  <div>f_norm: {mousePos.x}</div>
                  <div>τ_delay: {mousePos.y} μs</div>
                </div>
              </>
            )}
          </div>

          {/* Event Metadata Summary Features */}
          <div className="space-y-2">
            <span className="block font-mono text-[10px] text-[#64748B] font-bold tracking-wider uppercase">
              Extraction Summary Features
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-lg">
              
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Center Freq:</span>
                  <span className="text-[#0F172A] font-bold">{selectedAlert.centerFreq.toFixed(2)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Bandwidth:</span>
                  <span className="text-[#0F172A] font-bold">{selectedAlert.bandwidth.toFixed(1)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Peak SNR:</span>
                  <span className="text-emerald-600 font-bold">N/A</span>
                </div>
              </div>

              <div className="space-y-1.5 border-l border-[#E2E8F0] pl-3">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Doppler:</span>
                  <span className="text-[#0F172A] font-bold">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Modulation:</span>
                  <span className="text-[#7D83FF] font-bold text-[10px] truncate">
                    {selectedAlert.category === 'UAS-like' ? 'DSSS (UAS)' : 'OFDM/AP'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Lock Status:</span>
                  <span className="text-[#7D83FF] font-bold flex items-center">
                    <span className="w-1.5 h-1.5 bg-[#7D83FF] rounded-full mr-1 animate-ping"></span>
                    COHERENT
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
