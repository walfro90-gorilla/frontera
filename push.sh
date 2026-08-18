#!/usr/bin/env bash
# Publica FRONTERA en GitHub. Uso: ./push.sh [nombre-del-repo]
# Requiere GitHub CLI autenticado:  gh auth status
set -euo pipefail

REPO="${1:-frontera}"

command -v gh >/dev/null || { echo "Falta GitHub CLI. Instala con: sudo apt install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Sesión de gh no iniciada. Corre: gh auth login"; exit 1; }

git init -b main
git add .
git commit -m "feat: sandbox 3D de mundo abierto en un solo archivo HTML"

gh repo create "$REPO" --public --source=. --push \
  --description "Sandbox 3D de mundo abierto en un archivo HTML. Ciudad procedural, tráfico, policía y ciclo día/noche."

echo
echo "Listo. El workflow habilita Pages solo y publica en cada push a main."
echo "Si el deploy falla con 'Get Pages site failed', corre una vez:"
echo "  gh api -X POST repos/USUARIO/$REPO/pages -f build_type=workflow"
