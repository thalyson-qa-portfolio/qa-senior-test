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
      | ($s.expected + $s.unexpected) as $total
      | (if $total > 0
         then (($s.expected * 10000 / $total) | round / 100)
         else 0 end) as $pr
      | "### Metricas",
        "",
        "| Pass rate (%) | Total | Passaram | Falharam | Duração |",
        "|:---:|:---:|:---:|:---:|:---:|",
        ("| \($pr) | \($total) | \($s.expected) | \($s.unexpected) | \($s.duration | floor) ms |"),
        ""
    ' "$PW_JSON" >> "$SUMMARY"

    append "### Por grupo e teste"
    append ""
    append "| Grupo (describe) | Teste | Resultado |"
    append "|:---|:---|:---|"
    jq -r '
      .. | objects | select(has("specs") and (.specs | length > 0))
      | .title as $g | .specs[]
      | "| \($g | gsub("[|]"; "/")) | \(.title | gsub("[|]"; "/")) | \(if .ok then "passed" else "failed" end) |"
    ' "$PW_JSON" >> "$SUMMARY"
    append ""

    append "### Falhas (cenario, esperado e encontrado)"
    append ""
    API_FAIL_ROWS="$(jq -r '
      def strip_ansi: gsub("\u001b\\[[0-9;]*m"; "");
      def parse_exp_rec($m):
        ($m | strip_ansi) as $t
        | if ($t | test("Expected:")) and ($t | test("Received:")) then
            ($t | capture("Expected:\\s*(?<e>[^\\n]+)[\\s\\S]*?Received:\\s*(?<r>[^\\n]+)"))
          else
            {e: ($t | if length > 800 then .[0:800] + "..." else . end), r: "(ver mensagem)"}
          end;
      def walk($titles):
        . as $node
        | (($node.specs // [])[] | select(.ok == false)
          | (.tests[0].results[0].error.message // .tests[0].results[0].errors[0].message // "") as $msg
          | (($titles + [.title]) | map(select(test("\\.spec\\.[jt]s$") | not)) | join(" › ")) as $cen
          | parse_exp_rec($msg) as $p
          | "| \($cen | gsub("[|]"; "/")) | \($p.e | gsub("[|]"; "/")) | \($p.r | gsub("[|]"; "/")) |"
          )
        , (($node.suites // [])[] | walk($titles + [.title]))
        ;
      .suites[] | walk([.title])
    ' "$PW_JSON" 2>/dev/null || true)"
    if [ -n "$API_FAIL_ROWS" ]; then
      append "| Cenario | Resultado esperado | Resultado encontrado |"
      append "|:---|:---|:---|"
      printf '%s\n' "$API_FAIL_ROWS" >> "$SUMMARY"
    else
      append "_Nenhuma falha registrada no JSON do Playwright._"
    fi
    append ""
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
      | "### Metricas",
        "",
        "| Pass rate (%) | Total | Passaram | Falharam | Duração |",
        "|:---:|:---:|:---:|:---:|:---:|",
        ("| \($pr) | \($tot) | \($ok) | \($bad) | \($t) |"),
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

    append "### Falhas (cenario, step e log)"
    append ""
    FAIL_ROWS="$(jq -r '
      .[] | .name as $feature
      | (.elements // [])[]
      | select((.keyword // "") | test("Scenario"))
      | .name as $scenario
      | (.steps // [])[]
      | select((.result.status // "") == "failed")
      | (
          ((.keyword // "") + (.name // "")) as $step
          | ((.result.error_message // .result.message // "(sem error_message no JSON)") | gsub("\n"; " ")) as $log
          | ($log | if length > 1500 then .[0:1500] + "..." else . end) as $log2
          | "| \($feature | gsub("\\|"; "/")) | \($scenario | gsub("\\|"; "/")) | \($step | gsub("\\|"; "/")) | \($log2 | gsub("\\|"; "/")) |"
        )
    ' "$CU_JSON" 2>/dev/null || true)"
    if [ -n "$FAIL_ROWS" ]; then
      append "| Feature | Cenario | Step | Log |"
      append "|:---|:---|:---|:---|"
      printf '%s\n' "$FAIL_ROWS" >> "$SUMMARY"
    else
      append "_Nenhum step com status failed no JSON._"
    fi
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
  append "<details><summary>Log completo</summary>"
  append ""
  append '```text'
  cat "$LOG" 2>/dev/null >> "$SUMMARY" || true
  append '```'
  append "</details>"
else
  echo "Tipo invalido: $TYPE" >&2
  exit 1
fi
