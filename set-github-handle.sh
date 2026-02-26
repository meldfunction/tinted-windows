#!/usr/bin/env bash
# scripts/set-github-handle.sh
# Replaces yourhandle/pane placeholder with your real GitHub handle across the repo.
# Run from the repo root: bash scripts/set-github-handle.sh

set -euo pipefail

PLACEHOLDER="yourhandle"
DOMAIN_PLACEHOLDER="yourdomain.com"

# ── COLOURS ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
TEAL='\033[0;36m'; DIM='\033[2m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "  ${BOLD}pane — GitHub handle setup${RESET}"
echo -e "  ${DIM}──────────────────────────────────────────${RESET}"
echo ""

# ── CHECK WE'RE IN THE REPO ROOT ─────────────────────────────────────────────
if [[ ! -f "package.json" ]]; then
  echo -e "  ${RED}✗${RESET} Run this from the repo root (where package.json lives)"
  exit 1
fi

# ── GET GITHUB HANDLE ─────────────────────────────────────────────────────────
echo -e "  ${DIM}Your GitHub handle is the username in github.com/<handle>/pane${RESET}"
echo ""
read -rp "  GitHub handle: " HANDLE

if [[ -z "$HANDLE" ]]; then
  echo -e "  ${RED}✗${RESET} No handle entered. Exiting."
  exit 1
fi

# Strip leading @ if they included it
HANDLE="${HANDLE#@}"

# ── GET ALIAS DOMAIN (OPTIONAL) ───────────────────────────────────────────────
echo ""
echo -e "  ${DIM}Your alias domain is used in generated email examples (e.g. alias.yourdomain.com)${RESET}"
echo -e "  ${DIM}Leave blank to keep the placeholder, or enter your custom Addy.io domain${RESET}"
echo ""
read -rp "  Alias domain (e.g. alias.example.com) [skip]: " ALIAS_DOMAIN

# ── COUNT AFFECTED FILES ──────────────────────────────────────────────────────
AFFECTED_FILES=$(grep -rl "$PLACEHOLDER/pane" \
  --include="*.html" --include="*.md" --include="*.js" --include="*.json" . \
  2>/dev/null | grep -v node_modules | grep -v ".git")

FILE_COUNT=$(echo "$AFFECTED_FILES" | grep -c . || true)

# ── PREVIEW ───────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Preview — URLs after replacement:${RESET}"
echo ""
echo -e "  ${DIM}GitHub repo   ${RESET}  ${TEAL}https://github.com/${HANDLE}/pane${RESET}"
echo -e "  ${DIM}GitHub Pages  ${RESET}  ${TEAL}https://${HANDLE}.github.io/pane${RESET}"
echo -e "  ${DIM}Raw files     ${RESET}  ${TEAL}https://raw.githubusercontent.com/${HANDLE}/pane/main/...${RESET}"
if [[ -n "$ALIAS_DOMAIN" ]]; then
  echo -e "  ${DIM}Alias email   ${RESET}  ${TEAL}amber-circuit-4a1@${ALIAS_DOMAIN}${RESET}"
fi
echo ""
echo -e "  ${BOLD}Files that will be updated (${FILE_COUNT}):${RESET}"
echo ""

while IFS= read -r f; do
  # Show count of replacements per file
  COUNT=$(grep -c "$PLACEHOLDER/pane" "$f" 2>/dev/null || true)
  printf "  ${DIM}%-50s${RESET}  %s occurrence%s\n" \
    "${f#./}" "$COUNT" "$([ "$COUNT" -ne 1 ] && echo 's' || echo '')"
done <<< "$AFFECTED_FILES"

if [[ -n "$ALIAS_DOMAIN" ]]; then
  DOMAIN_FILES=$(grep -rl "$DOMAIN_PLACEHOLDER" \
    --include="*.html" --include="*.md" --include="*.js" . \
    2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l | tr -d ' ')
  if [[ "$DOMAIN_FILES" -gt 0 ]]; then
    echo ""
    echo -e "  ${DIM}+ ${DOMAIN_FILES} file(s) with alias domain placeholder will also be updated${RESET}"
  fi
fi

# ── CONFIRM ───────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}This will edit files in place. Make sure you have a clean git state${RESET}"
echo -e "  ${DIM}(run: git status — if anything is uncommitted, commit or stash it first)${RESET}"
echo ""
read -rp "  Proceed? [y/N]: " CONFIRM

if [[ "${CONFIRM,,}" != "y" && "${CONFIRM,,}" != "yes" ]]; then
  echo ""
  echo -e "  ${DIM}Cancelled — no files changed.${RESET}"
  echo ""
  exit 0
fi

# ── DETECT sed VARIANT (macOS needs sed -i '', Linux needs sed -i) ────────────
if sed --version 2>/dev/null | grep -q GNU; then
  SED_I() { sed -i "$@"; }       # GNU sed (Linux)
else
  SED_I() { sed -i '' "$@"; }    # BSD sed (macOS)
fi

# ── EXECUTE ───────────────────────────────────────────────────────────────────
echo ""

# Replace GitHub handle
CHANGED=0
while IFS= read -r f; do
  if SED_I "s|${PLACEHOLDER}/pane|${HANDLE}/pane|g" "$f" 2>/dev/null; then
    echo -e "  ${GREEN}✓${RESET}  ${f#./}"
    CHANGED=$((CHANGED + 1))
  else
    echo -e "  ${RED}✗${RESET}  ${f#./}  (could not write)"
  fi
done <<< "$AFFECTED_FILES"

# Replace alias domain if provided
if [[ -n "$ALIAS_DOMAIN" ]]; then
  echo ""
  grep -rl "$DOMAIN_PLACEHOLDER" \
    --include="*.html" --include="*.md" --include="*.js" . \
    2>/dev/null | grep -v node_modules | grep -v ".git" | \
  while IFS= read -r f; do
    if SED_I "s|${DOMAIN_PLACEHOLDER}|${ALIAS_DOMAIN}|g" "$f" 2>/dev/null; then
      echo -e "  ${GREEN}✓${RESET}  ${f#./}  ${DIM}(alias domain)${RESET}"
    fi
  done
fi

# Also update package.json repository url if it exists
if [[ -f "package.json" ]]; then
  SED_I "s|${PLACEHOLDER}\.github\.io/pane|${HANDLE}.github.io/pane|g" package.json 2>/dev/null || true
fi

# ── DONE ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}✓${RESET}  ${BOLD}Done — ${CHANGED} file(s) updated${RESET}"
echo ""
echo -e "  ${DIM}Next steps:${RESET}"
echo -e "  ${DIM}  git diff                      review all changes${RESET}"
echo -e "  ${DIM}  git add -A && git commit -m 'set github handle: ${HANDLE}'${RESET}"
echo -e "  ${DIM}  git remote add origin https://github.com/${HANDLE}/pane${RESET}"
echo -e "  ${DIM}  git push -u origin main${RESET}"
echo -e "  ${DIM}  # then enable GitHub Pages in repo Settings → Pages → branch: main${RESET}"
echo ""
