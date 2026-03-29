#!/usr/bin/env bash
# Uso: render-job-summary.sh <api|e2e|k6> <arquivo-de-log>
# Requer .job-exit-code no diretorio atual (0 = sucesso).

set -euo pipefail

TYPE="${1:?tipo: api, e2e ou k6}"
LOG="${2:?caminho do log}"

EXIT_CODE="$(cat .job-exit-code 2>/dev/null || echo 1)"
if [ "$EXIT_CODE" -eq 0 ]; then
  STATUS='**Passed**'
  STATUS_NOTE='Exit code 0 no runner.'
else
  STATUS='**Failed**'
  STATUS_NOTE='Ver resumo e log; confira o artifact deste job se houver.'
fi

{
  echo "---"
  case "$TYPE" in
    api)
      echo "## API tests (Playwright)"
      echo ""
      echo "| | |"
      echo "|:---|:---|"
      echo "| **Status** | ${STATUS} |"
      echo "| **Suite** | \`tests/api/\` |"
      echo "| **Comando** | \`npm run test:api\` |"
      echo "| **Relatorio** | Artifact **api-report** |"
      echo "| **Detalhe** | ${STATUS_NOTE} |"
      echo ""
      echo "### Resumo"
      echo ""
      echo '```text'
      (grep -E '[0-9]+ passed|[0-9]+ failed|Error:|\)' "$LOG" 2>/dev/null | tail -20) || tail -20 "$LOG"
      echo '```'
      ;;
    e2e)
      echo "## E2E tests (Cucumber + Playwright)"
      echo ""
      echo "| | |"
      echo "|:---|:---|"
      echo "| **Status** | ${STATUS} |"
      echo "| **Suite** | \`e2e/\` |"
      echo "| **Comando** | \`npm run test:e2e\` |"
      echo "| **Relatorios** | Artifact **e2e-report** |"
      echo "| **Detalhe** | ${STATUS_NOTE} |"
      echo ""
      echo "### Resumo"
      echo ""
      echo '```text'
      (grep -E 'scenarios|steps \(|Failures:|Scenario:|Error:|Timeout|page\.|Call log:' "$LOG" 2>/dev/null | tail -30) || tail -25 "$LOG"
      echo '```'
      ;;
    k6)
      echo "## Performance (K6 smoke)"
      echo ""
      echo "| | |"
      echo "|:---|:---|"
      echo "| **Status** | ${STATUS} |"
      echo "| **Script** | \`performance/load-test.js\` |"
      echo "| **Comando** | \`npm run test:perf:smoke\` |"
      echo "| **Carga completa** | Local: \`npm run test:perf\` |"
      echo "| **Detalhe** | ${STATUS_NOTE} |"
      echo ""
      echo "### Metricas"
      echo ""
      echo '```text'
      if grep -q 'RESULTADO DO TESTE' "$LOG" 2>/dev/null; then
        grep -A 28 'RESULTADO DO TESTE' "$LOG" | head -32
      else
        tail -35 "$LOG"
      fi
      echo '```'
      ;;
    *)
      echo "Tipo desconhecido: $TYPE"
      exit 1
      ;;
  esac
  echo ""
  echo "<details>"
  echo "<summary><strong>Final do log (ate 80 linhas)</strong></summary>"
  echo ""
  echo '```text'
  tail -80 "$LOG" 2>/dev/null || true
  echo '```'
  echo ""
  echo "</details>"
} >> "$GITHUB_STEP_SUMMARY"
