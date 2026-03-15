#!/bin/bash
# One Now Two BDM — Full Setup Script
# Run this once: bash setup.sh

set -e
cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  ONE NOW TWO BDM — SETUP              ${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# 1. Install server dependencies
echo -e "${YELLOW}[1/4] Installing server dependencies...${NC}"
npm install --cache /tmp/npm-cache
echo -e "${GREEN}✓ Server deps installed${NC}"

# 2. Install client dependencies
echo -e "${YELLOW}[2/4] Installing client dependencies...${NC}"
cd client && npm install --cache /tmp/npm-cache && cd ..
echo -e "${GREEN}✓ Client deps installed${NC}"

# 3. Init git
echo -e "${YELLOW}[3/4] Initialising git repository...${NC}"
git init
git add -A
git commit -m "Initial commit — One Now Two BDM Agent v1.0"
echo -e "${GREEN}✓ Git repo initialised and committed${NC}"

# 4. GitHub push
echo ""
echo -e "${YELLOW}[4/4] Pushing to GitHub...${NC}"

if command -v gh &> /dev/null; then
  echo "GitHub CLI detected — creating private repo..."
  gh repo create one-now-two-bdm --private --source=. --push --description "Autonomous BDM agent for One Now Two"
  REPO_URL=$(gh repo view --json url -q .url 2>/dev/null)
  echo -e "${GREEN}✓ Pushed to GitHub: ${REPO_URL}${NC}"
else
  echo ""
  echo -e "${YELLOW}GitHub CLI (gh) not installed.${NC}"
  echo ""
  echo "Do this now:"
  echo "  1. Go to https://github.com/new"
  echo "  2. Name it: one-now-two-bdm"
  echo "  3. Set to PRIVATE"
  echo "  4. Do NOT tick 'Add README'"
  echo "  5. Click Create repository"
  echo ""
  echo -e "Then paste your repo URL and press Enter:"
  read -p "GitHub repo URL (e.g. https://github.com/yourusername/one-now-two-bdm): " REPO_URL
  git remote add origin "$REPO_URL"
  git push -u origin main
  echo -e "${GREEN}✓ Pushed to GitHub${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ALL DONE!${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  LOCAL: Run the app:"
echo "    npm start          (API server on :3001)"
echo "    cd client && npm run dev   (dashboard on :5173)"
echo ""
echo "  RENDER: Deploy online:"
echo "    1. Go to render.com → New → Web Service"
echo "    2. Connect repo: one-now-two-bdm"
echo "    3. Add env vars: ANTHROPIC_API_KEY, APIFY_API_TOKEN, RESEND_API_KEY"
echo "    4. Click Deploy"
echo ""
echo "  The render.yaml in this repo auto-configures everything."
echo ""
