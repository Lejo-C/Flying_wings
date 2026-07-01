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
  Download,
  Moon,
  Sun
} from 'lucide-react';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Ingestion states
  const [streamName, setStreamName] = useState('WAITING FOR STREAM...');
  const [fileSize, setFileSize] = useState('0 MB');
  const [inputTypeBaseline, setInputTypeBaseline] = useState('Spectrogram Bundle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThreatActive, setIsThreatActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Performance metrics from backend
  const [metrics, setMetrics] = useState({
    pd: 0.0,
    far: 0.0,
    precision: 0.0,
    recall: 0.0,
    f1: 0.0,
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

  // Fetch historical alerts from DB
  const fetchAlertHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/alerts');
      const data = await response.json();
      if (data.status === "success" && data.alerts) {
        setAlerts(data.alerts);
        if (data.alerts.length > 0) {
            setSelectedAlert(data.alerts[0]);
            setIsThreatActive(data.alerts[0].category === 'UAS-like');
        }
      }
    } catch (err) {
      console.error("Error fetching historical alerts:", err);
    }
  };

  // WebSocket connection for real-time alerts
  useEffect(() => {
    fetchMetrics();
    fetchAlertHistory();
    
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

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to completely wipe all historical alerts and testing metrics?")) return;
    try {
      await fetch('http://localhost:8000/api/reset', { method: 'POST' });
      setAlerts([]);
      setSelectedAlert(null);
      setMetrics({
        pd: 0.0, far: 0.0, precision: 0.0, recall: 0.0, f1: 0.0, total_events: 0, confusion_matrix: null
      });
      setStreamName('WAITING FOR STREAM...');
      setFileSize('0 MB');
      setIsThreatActive(false);
      setErrorMessage('');
    } catch (e) {
      console.error(e);
    }
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
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-[#0B1120] text-[#1E293B] dark:text-[#E2E8F0] flex flex-col p-4 sm:p-6 font-sans transition-colors duration-300">
        
        {/* TOP HEADER & DATA INGESTION ZONE */}
        <header className="bg-white dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] rounded-lg p-5 mb-6 shadow-sm relative overflow-hidden transition-colors duration-300">
        
        {/* Top visual brand bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#7D83FF]" />

        {/* Row 1: Brand Titles, System Alert Status, and Telemetry Summary */}
        <div className="flex flex-col lg:flex-row items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#334155] gap-4">
          
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#7D83FF]/10 rounded-lg">
              <Shield className="w-6 h-6 text-[#7D83FF]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-widest text-[#0F172A] dark:text-[#F8FAFC] leading-tight uppercase">
                Passive RF Early-Warning Prototype
              </h1>
              <p className="font-mono text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 tracking-wider uppercase">
                UAS-Related Emission Classifier // Tactical Intelligence Unit
              </p>
            </div>
          </div>



          {/* Core File Telemetry details */}
          <div className="flex items-center space-x-5 text-xs font-mono">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] rounded-md border border-[#E2E8F0] dark:border-[#334155] transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#FF1744]/10 hover:bg-[#FF1744]/20 text-[#FF1744] rounded-md border border-[#FF1744]/20 text-[9px] font-bold tracking-wider uppercase transition-colors"
              title="Wipe all data and reset the prototype"
            >
              Reset Testing Data
            </button>
            <div className="flex flex-col text-right">
              <span className="text-[#64748B] dark:text-[#94A3B8] text-[8px] font-bold tracking-wider">ACTIVE SIGNAL STREAM</span>
              <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold flex items-center justify-end mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isProcessing ? 'bg-[#7D83FF] animate-pulse' : 'bg-[#FF1744]'}`} />
                {streamName}
              </span>
            </div>

            <div className="flex flex-col text-right border-l border-[#E2E8F0] dark:border-[#334155] pl-4">
              <span className="text-[#64748B] dark:text-[#94A3B8] text-[8px] font-bold tracking-wider">TOTAL INGESTED SIZE</span>
              <span className="text-[#0F172A] dark:text-[#F8FAFC] font-bold mt-0.5">{fileSize}</span>
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
                : 'border-dashed border-[#CBD5E1] hover:border-[#7D83FF] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#7D83FF]'
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
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] text-[#0F172A] dark:text-[#F8FAFC] font-sans text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
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
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg font-sans text-xs font-extrabold transition-all border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0B1120] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] dark:bg-[#1E293B] shadow-sm hover:shadow-sm"
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
            latency={selectedAlert ? (selectedAlert.latency_ms / 1000) : 0.0} 
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
          />

        </section>

      </main>

      {/* FOOTER STATS */}
      <footer className="mt-8 pt-4 border-t border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] font-mono text-[9px]">
        <div>
          PROTOTYPE CONSOLE // PASSIVE CLASSIFICATION & ALERTING ONLY // SECURE SYSTEM LINK [ACTIVE]
        </div>
        <div>
          RUNNING ON CPU BASELINE MATRIX // ONNX EXPORT VALIDATED
        </div>
      </footer>

    </div>
    </div>
  );
}
