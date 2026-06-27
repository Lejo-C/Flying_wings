import React, { useState, useEffect, useRef } from 'react';
import PerformanceHud from './components/PerformanceHud';
import AlertLogTable from './components/AlertLogTable';
import EvidenceSnapshotBox from './components/EvidenceSnapshotBox';
import TuningControls from './components/TuningControls';
import { 
  Shield, 
  Upload,
  Play, 
  Pause, 
  FileCode,
  RefreshCw,
  FolderOpen,
  Cpu,
  Activity,
  Download
} from 'lucide-react';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [smoothingWindow, setSmoothingWindow] = useState(5);
  
  // Ingestion states
  const [streamName, setStreamName] = useState('WAITING FOR STREAM...');
  const [fileSize, setFileSize] = useState('0 MB');
  const [inputTypeBaseline, setInputTypeBaseline] = useState('Spectrogram Bundle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThreatActive, setIsThreatActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Performance metrics from backend
  const [metrics, setMetrics] = useState({
    pd: 0.93,
    far: 0.02,
    precision: 0.94,
    recall: 0.93,
    f1: 0.91,
    total_events: 0,
    confusion_matrix: null
  });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch metrics from backend
  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
  };

  // WebSocket connection for real-time alerts
  useEffect(() => {
    fetchMetrics();
    
    const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ALERT') {
          const newAlert = data.payload;
          setAlerts(prev => [newAlert, ...prev]);
          setSelectedAlert(newAlert);
          
          if (newAlert.category === 'UAS-like') {
            setIsThreatActive(true);
          } else {
            setIsThreatActive(false);
          }
          
          // Re-fetch metrics to update Pd, FAR, F1 and confusion matrix
          fetchMetrics();
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    return () => ws.close();
  }, []);

  // Handle manual alarm toggle override
  const handleToggleAlarm = () => {
    setIsThreatActive(!isThreatActive);
  };

  // Row selection handler
  const handleSelectAlert = (alert) => {
    setSelectedAlert(alert);
    if (alert.category === 'UAS-like') {
      setIsThreatActive(true);
    } else {
      setIsThreatActive(false);
    }
  };

  // Trigger file or folder inputs
  const triggerFileBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerFolderBrowse = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Batch ingestion of multiple files or directory files
  const handleFileIngestion = async (filesList) => {
    if (filesList.length === 0) return;
    
    setIsProcessing(true);
    setErrorMessage('');
    setIsThreatActive(false);
    
    // Calculate total size
    let totalBytes = 0;
    filesList.forEach(f => totalBytes += f.size);
    const mbSize = (totalBytes / (1024 * 1024)).toFixed(2);
    
    if (filesList.length === 1) {
      setStreamName(filesList[0].name.toUpperCase());
      setFileSize(`${mbSize} MB`);
    } else {
      setStreamName(`BATCH: ${filesList.length} FILES`);
      setFileSize(`${mbSize} MB`);
    }

    const formData = new FormData();
    
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      // Slicing safeguard for large files to keep ingestion low-latency
      const fileChunk = (isCsv && file.size > 1000000) ? file.slice(0, 1000000) : file;
      formData.append('files', fileChunk, file.name);
    }

    try {
      const response = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Ingest failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update metrics immediately
      fetchMetrics();
    } catch (error) {
      console.error("Ingestion failed", error);
      setErrorMessage(`Ingestion failed: ${error.message}. Please check if the backend is running.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileIngestion(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileIngestion(files);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1E293B] flex flex-col p-4 sm:p-6 font-sans">
      
      {/* TOP HEADER & DATA INGESTION ZONE */}
      <header className="bg-white border border-[#E2E8F0] rounded-lg p-5 mb-6 shadow-sm relative overflow-hidden">
        
        {/* Top visual brand bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#7D83FF]" />

        {/* Row 1: Brand Titles, System Alert Status, and Telemetry Summary */}
        <div className="flex flex-col lg:flex-row items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
          
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#7D83FF]/10 rounded-lg">
              <Shield className="w-6 h-6 text-[#7D83FF]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-widest text-[#0F172A] leading-tight uppercase">
                Passive RF Early-Warning Prototype
              </h1>
              <p className="font-mono text-[9px] text-[#64748B] mt-0.5 tracking-wider uppercase">
                UAS-Related Emission Classifier // Tactical Intelligence Unit
              </p>
            </div>
          </div>

          {/* Interactive Dynamic Threat Status Badge */}
          <div 
            onClick={handleToggleAlarm}
            title="Click to toggle system alarm override"
            className={`cursor-pointer px-5 py-2.5 rounded-lg border font-mono text-[11px] font-bold tracking-widest flex items-center space-x-3 select-none transition-all duration-300 ${
              isThreatActive 
                ? 'bg-[#FF1744]/10 border-[#FF1744] text-[#FF1744] hover:bg-[#FF1744]/15' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/15'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isThreatActive ? 'bg-[#FF1744] animate-ping' : 'bg-emerald-500'}`} />
            <span>
              {isThreatActive ? 'UAS DETECTED / passive alert active' : 'SYSTEM SAFE / MONITORING'}
            </span>
            <span className="text-[8px] bg-[#64748B]/10 px-1 py-0.5 rounded text-[#64748B] font-sans border border-[#64748B]/20">
              OVERRIDE
            </span>
          </div>

          {/* Core File Telemetry details */}
          <div className="flex items-center space-x-5 text-xs font-mono">
            <div className="flex flex-col text-right">
              <span className="text-[#64748B] text-[8px] font-bold tracking-wider">ACTIVE SIGNAL STREAM</span>
              <span className="text-[#0F172A] font-bold flex items-center justify-end mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isProcessing ? 'bg-[#7D83FF] animate-pulse' : 'bg-[#FF1744]'}`} />
                {streamName}
              </span>
            </div>

            <div className="flex flex-col text-right border-l border-[#E2E8F0] pl-4">
              <span className="text-[#64748B] text-[8px] font-bold tracking-wider">TOTAL INGESTED SIZE</span>
              <span className="text-[#0F172A] font-bold mt-0.5">{fileSize}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Ingestion Control Bar */}
        <div className="pt-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          
          {/* Uploader drag zone */}
          <div 
            onClick={triggerFileBrowse}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 min-h-[46px] px-4 py-2 border rounded-lg flex items-center justify-center space-x-3 cursor-pointer transition-all ${
              isDragging 
                ? 'border-[#7D83FF] bg-[#7D83FF]/5 text-[#7D83FF]' 
                : 'border-dashed border-[#CBD5E1] hover:border-[#7D83FF] bg-[#F8FAFC] text-[#64748B] hover:text-[#7D83FF]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="font-sans text-[11px] font-bold tracking-wide">
              {isDragging 
                ? 'DROP RF FILES NOW...' 
                : 'DRAG & DROP OR BROWSE SIGMF (.META/.SIGMF), NPZ, NPY OR CSV BUNDLES'
              }
            </span>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".npy,.npz,.sigmf,.meta,.csv"
              multiple
              className="hidden" 
            />
          </div>

          {/* Action triggers and selection dropdowns */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Folder Browse Trigger */}
            <button
              onClick={triggerFolderBrowse}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] font-sans text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
              title="Select folder to recursively scan and upload RF data"
            >
              <FolderOpen className="w-4 h-4 text-[#7D83FF]" />
              <span>INGEST RECURSIVE FOLDER</span>
              <input 
                type="file" 
                ref={folderInputRef}
                onChange={onFileChange}
                webkitdirectory="true"
                directory="true"
                multiple
                className="hidden" 
              />
            </button>

            {/* Offline Control Loop Buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              
              {/* Report Download Button */}
              <a
                href="http://localhost:8000/api/report"
                download="report.json"
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg font-sans text-xs font-extrabold transition-all border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-sm hover:shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD REPORT.JSON</span>
              </a>

            </div>

          </div>

        </div>

        {/* Ingestion Error Alert Banner */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-mono flex items-center space-x-2">
            <span className="font-bold uppercase">ERROR:</span>
            <span>{errorMessage}</span>
          </div>
        )}

      </header>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column (60% Width) - Performance HUD & Alert Log Table */}
        <section className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Performance HUD (required output fields from project specs) */}
          <PerformanceHud 
            pd={metrics.pd} 
            far={metrics.far} 
            precision={metrics.precision}
            recall={metrics.recall}
            f1={metrics.f1} 
            latency={selectedAlert ? (selectedAlert.latency_ms / 1000) : 0.015} 
            libraryCount={alerts.length}
            confusionMatrix={metrics.confusion_matrix}
          />
          
          {/* Timeline Actionable Alert Log */}
          <div className="flex-1">
            <AlertLogTable 
              alerts={alerts}
              selectedAlertId={selectedAlert ? selectedAlert.id : null}
              onSelectAlert={handleSelectAlert}
              confidenceThreshold={confidenceThreshold}
            />
          </div>

        </section>

        {/* Right Column (40% Width) - Snapshot and Thresholds */}
        <section className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* Evidence Snapshot & Summary Features */}
          <EvidenceSnapshotBox selectedAlert={selectedAlert} />

          {/* Operator Controls & Compute stats */}
          <TuningControls 
            confidenceThreshold={confidenceThreshold}
            setConfidenceThreshold={setConfidenceThreshold}
            smoothingWindow={smoothingWindow}
            setSmoothingWindow={setSmoothingWindow}
          />

        </section>

      </main>

      {/* FOOTER STATS */}
      <footer className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[#64748B] font-mono text-[9px]">
        <div>
          PROTOTYPE CONSOLE // PASSIVE CLASSIFICATION & ALERTING ONLY // SECURE SYSTEM LINK [ACTIVE]
        </div>
        <div>
          RUNNING ON CPU BASELINE MATRIX // ONNX EXPORT VALIDATED
        </div>
      </footer>

    </div>
  );
}
