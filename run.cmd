@echo off
setlocal
cd /d "%~dp0"

if exist ".venv_runtime\Scripts\python.exe" (
  set "ONEUL_PYTHON=.venv_runtime\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
  set "ONEUL_PYTHON=.venv\Scripts\python.exe"
) else (
  set "ONEUL_PYTHON=python"
)

if exist ".vendor" (
  set "PYTHONPATH=%~dp0.vendor;%PYTHONPATH%"
)

"%ONEUL_PYTHON%" -m uvicorn backend.main:app --host 127.0.0.1 --port 9999
