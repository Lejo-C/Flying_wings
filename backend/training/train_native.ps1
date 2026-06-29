<#
.SYNOPSIS
Native Windows GPU Training Bootstrap Script for PyTorch

.DESCRIPTION
This script bypasses Docker to utilize the native NVIDIA RTX 4060 GPU on Windows.
It creates a local Python virtual environment, installs the official PyTorch CUDA 11.8
libraries, and executes the 50-epoch DroneRF training pipeline.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path (Join-Path $ScriptDir "..")
$VenvDir = Join-Path $BackendDir "venv"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Flying Wings - Native GPU Training Initializer " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check for Python
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python 3 is not installed or not in your system PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.9+ from python.org (DO NOT use the Windows Store version)." -ForegroundColor Yellow
    exit 1
}

# 2. Create Virtual Environment
if (-not (Test-Path $VenvDir)) {
    Write-Host "`n[*] Creating local Python virtual environment at $VenvDir..." -ForegroundColor Green
    python -m venv $VenvDir
} else {
    Write-Host "`n[*] Virtual environment already exists." -ForegroundColor Green
}

# 3. Activate Virtual Environment
Write-Host "[*] Activating virtual environment..." -ForegroundColor Green
$ActivateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
if (-not (Test-Path $ActivateScript)) {
    Write-Host "[ERROR] Could not find activation script. Did the venv creation fail?" -ForegroundColor Red
    exit 1
}
. $ActivateScript

# 4. Install CUDA-enabled PyTorch
Write-Host "`n[*] Installing PyTorch with NVIDIA CUDA 11.8 support (This is a ~2.5GB download)..." -ForegroundColor Magenta
Write-Host "    This ensures your RTX 4060 is fully utilized for maximum speed." -ForegroundColor Gray
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 5. Install other dependencies
Write-Host "`n[*] Installing required dependencies (scipy, numpy, pandas, onnx)..." -ForegroundColor Magenta
pip install scipy numpy pandas onnx onnxscript Pillow

# 6. Execute the Training Script
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "[*] Launching the 50-Epoch Training Pipeline!" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Cyan

Set-Location $BackendDir
python training/train.py

Write-Host "`n[*] Training Complete." -ForegroundColor Green
Write-Host "You can now copy 'competition_model.onnx' into 'backend/app/model/'!" -ForegroundColor Yellow
