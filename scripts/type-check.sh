#!/usr/bin/env bash
set -euo pipefail

node -e "const fs=require('fs'); for (const p of ['tsconfig.tsbuildinfo','.next/types','.next/dev/types']) fs.rmSync(p,{force:true,recursive:true});"
next typegen
tsc --noEmit
