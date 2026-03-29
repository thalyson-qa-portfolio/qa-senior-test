#!/usr/bin/env bash
# Gera Job Summary no GitHub Actions a partir de JSON (Playwright/Cucumber) ou log (fallback).
# Uso: render-job-summary.sh <api|e2e|k6> <arquivo-de-log-console>
# Requer .job-exit-code no diretorio atual.

set -euo pipefail

TYPE="${1:?tipo: api, e2e ou k6}"
LOG="${2:?log}"

EXIT_CODE="$(cat .job-exit-code 2>/dev/null || echo 1)"
SUMMARY="${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY nao definido}"

append() { printf '%s\n' "$@" >> "$SUMMARY"; }

append "---"
if [ "$EXIT_CODE" -eq 0 ]; then
  RUN_BADGE='**Run: success**'
else
  RUN_BADGE='**Run: falhou (exit != 0)**'
fi

# --- API (Playwright JSON) ---
if [ "$TYPE" = "api" ]; then
  append "## API (Playwright)"
  append ""
  append "${RUN_BADGE}"
  append ""

  PW_JSON="test-output/playwright-report/results.json"
  if [ -f "$PW_JSON" ] && command -v jq >/dev/null 2>&1; then
    jq -r '
      .stats | . as $s
      | ($s.expected + $s.unexpected + $s.flaky + $s.skipped) as $total
      | ($s.expected + $s.unexpected + $s.flaky) as $den
      | (if $den > 0
         then ((($s.expected + $s.flaky) * 10000 / $den) | round / 100)
         else 0 end) as $pr
      | "### Metricas",
        "",
        "| Metrica | Valor |",
        "|:---|---:|",
        ("| Total de testes | \($total) |"),
        ("| Passaram | \($s.expected) |"),
        ("| Falharam | \($s.unexpected) |"),
        ("| Flaky | \($s.flaky) |"),
        ("| Pulados | \($s.skipped) |"),
        ("| Duracao (ms) | \($s.duration | floor) |"),
        ("| Pass rate (%) | \($pr) |"),
        ""
    ' "$PW_JSON" >> "$SUMMARY"
  else
    append "### Metricas (fallback: log)"
    append ""
    append "| Metrica | Valor |"
    append "|:---|:---|"
    PASSED="$(grep -oE '[0-9]+ passed' "$LOG" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "?")"
    TIME="$(grep -oE '\([0-9]+(\.[0-9]+)?s\)' "$LOG" 2>/dev/null | tail -1 | tr -d '()' || echo "?")"
    append "| Linha passed | ${PASSED} |"
    append "| Tempo (log) | ${TIME} |"
    append ""
  fi

  append "<details><summary>Log (final)</summary>"
  append ""
  append '```text'
  tail -60 "$LOG" 2>/dev/null >> "$SUMMARY" || true
  append '```'
  append "</details>"

elif [ "$TYPE" = "e2e" ]; then
  append "## E2E (Cucumber)"
  append ""
  append "${RUN_BADGE}"
  append ""

  CU_JSON="test-output/reports/cucumber-results.json"
  if [ -f "$CU_JSON" ] && command -v jq >/dev/null 2>&1; then
    TIME_LINE="$(grep -oE '[0-9]+m[0-9]+(\.[0-9]+)?s' "$LOG" 2>/dev/null | tail -1 || true)"
    jq -r --arg t "${TIME_LINE:-n/d}" '
      ([.[] | (.elements // [])[] | select((.keyword // "") | test("Scenario"))
        | ([.steps[]? | .result.status // "undefined"] | if length == 0 then false else all(. == "passed") end)
        | if . then 1 else 0 end
      ] | add // 0) as $ok
      | ([.[] | (.elements // [])[] | select((.keyword // "") | test("Scenario"))] | length) as $tot
      | ($tot - $ok) as $bad
      | (if $tot > 0 then (($ok * 10000 / $tot) | round / 100) else 0 end) as $pr
      | "### Resumo geral",
        "",
        "| Metrica | Valor |",
        "|:---|---:|",
        ("| Cenarios Gherkin | \($tot) |"),
        ("| Passaram | \($ok) |"),
        ("| Falharam | \($bad) |"),
        ("| Pass rate (%) | \($pr) |"),
        ("| Tempo (log Cucumber) | \($t) |"),
        ""
    ' "$CU_JSON" >> "$SUMMARY"

    append "### Por feature e cenario"
    append ""
    append "| Feature | Cenario | Resultado |"
    append "|:---|:---|:---|"
    jq -r '
      .[] | .name as $feature
      | (.elements // [])[]
      | select((.keyword // "") | test("Scenario"))
      | ([.steps[]? | .result.status // "undefined"] | if length == 0 then "unknown"
        elif all(. == "passed") then "passed" else "failed" end) as $st
      | "| \($feature | gsub("\\|"; "/")) | \(.name | gsub("\\|"; "/")) | \($st) |"
    ' "$CU_JSON" >> "$SUMMARY"
    append ""

    STEPS_OK="$(jq '[.[] | (.elements // [])[] | .steps[]? | select(.result.status == "passed")] | length' "$CU_JSON" 2>/dev/null || echo 0)"
    STEPS_ALL="$(jq '[.[] | (.elements // [])[] | .steps[]?] | length' "$CU_JSON" 2>/dev/null || echo 0)"
    append "### Steps"
    append ""
    append "| Metrica | Valor |"
    append "|:---|---:|"
    append "| Steps passed / total | ${STEPS_OK} / ${STEPS_ALL} |"
    append ""
  else
    append "### Metricas (fallback: log)"
    append ""
    grep -E 'scenarios|steps \(|^[[:space:]]*[0-9]+\)' "$LOG" 2>/dev/null | tail -15 >> "$SUMMARY" || tail -20 "$LOG" >> "$SUMMARY"
    append ""
  fi

  append "<details><summary>Log (final)</summary>"
  append ""
  append '```text'
  tail -80 "$LOG" 2>/dev/null >> "$SUMMARY" || true
  append '```'
  append "</details>"

elif [ "$TYPE" = "k6" ]; then
  append "## Performance (K6 smoke)"
  append ""
  append "${RUN_BADGE}"
  append ""

  if grep -q 'RESULTADO DO TESTE' "$LOG" 2>/dev/null; then
    append "### Metricas (trecho do K6)"
    append ""
    append '```text'
    grep -A 35 'RESULTADO DO TESTE' "$LOG" | head -40 >> "$SUMMARY"
    append '```'
  else
    append "### Metricas (fallback)"
    append ""
    append '```text'
    tail -40 "$LOG" >> "$SUMMARY"
    append '```'
  fi
  append ""
  REQ="$(grep -oE 'Total de Requests:[[:space:]]*[0-9]+' "$LOG" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "?")"
  FAILRATE="$(grep -oE 'Taxa de Falha:[[:space:]]*[0-9.]+%' "$LOG" 2>/dev/null | head -1 || echo "?")"
  P95="$(grep -oE 'P95:[[:space:]]*[0-9.]+ms' "$LOG" 2>/dev/null | head -1 || echo "?")"
  append "### Resumo numerico"
  append ""
  append "| Metrica | Valor |"
  append "|:---|:---|"
  append "| Total de requests | ${REQ} |"
  append "| Taxa de falha | ${FAILRATE} |"
  append "| P95 | ${P95} |"
  append ""
  append "<details><summary>Log completo (final)</summary>"
  append ""
  append '```text'
  tail -100 "$LOG" 2>/dev/null >> "$SUMMARY" || true
  append '```'
  append "</details>"
else
  echo "Tipo invalido: $TYPE" >&2
  exit 1
fi
