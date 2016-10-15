#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

python -m SimpleHTTPServer 8000
echo "Now browse to localhost:8000"
