---
title: ComfyUI on Pascal cards
description: Guide to installing ComfyUI to run on Pascal Nvidia GPUs using uv
date: 2026-01-04
---

## Installation

```sh
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

uv venv --python 3.12
uv add pip
uv pip install -r requirements.txt

uv pip uninstall torch torchvision torchaudio
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
```

## Running

```sh
uv run main.py
```

ComfyUI should now be running on port `8188`, you can open it at http://127.0.0.1:8188
