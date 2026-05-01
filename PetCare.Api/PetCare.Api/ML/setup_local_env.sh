#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
venv_dir="$script_dir/.venv"
python_bin="${PYTHON_BIN:-python3}"

"$python_bin" -m venv --clear "$venv_dir"
"$venv_dir/bin/python" -m pip install --upgrade pip
"$venv_dir/bin/python" -m pip install -r "$script_dir/requirements.txt"

"$venv_dir/bin/python" - <<'PY'
import sys
import numpy
import soundfile
import torch
import torchaudio

print(f"Python ready: {sys.executable}")
print(f"NumPy ready: {numpy.__version__}")
print(f"SoundFile ready: {soundfile.__version__}")
print(f"Torch ready: {torch.__version__}")
print(f"torchaudio ready: {torchaudio.__version__}")
PY

echo "Pet translator environment created at $venv_dir"
