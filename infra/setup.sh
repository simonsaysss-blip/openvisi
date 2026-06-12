#!/bin/bash
# ─────────────────────────────────────────────────────────────
# OpenVisi GCP Setup Script
# 專案: gen-lang-client-0631649736
# 執行一次即可完成所有 GCP 資源設定
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="gen-lang-client-0631649736"
REGION="asia-east1"           # 台灣最近的 GCP region（東京）
BUCKET="openvisi-artifacts-${PROJECT_ID}"
SERVICE_NAME="openvisi-api"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
OPENAI_SECRET_NAME="${OPENAI_SECRET_NAME:-openvisi-openai-api-key}"
ENV_FILE="${ENV_FILE:-.env.deploy}"

if [[ -f "${ENV_FILE}" ]]; then
  echo "▶ 載入本機部署環境檔: ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         OpenVisi GCP Setup                       ║"
echo "║  Project : ${PROJECT_ID}  ║"
echo "║  Region  : ${REGION}                          ║"
echo "║  Bucket  : ${BUCKET}  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. 設定 project ───────────────────────────────────────────
echo "▶ [1/6] 設定 gcloud project..."
gcloud config set project "${PROJECT_ID}"

# ── 2. 啟用必要 APIs ─────────────────────────────────────────
echo "▶ [2/6] 啟用 GCP APIs（run, storage, cloudbuild, artifactregistry）..."
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="${PROJECT_ID}" \
  --quiet

echo "   等待 Secret Manager API 啟用狀態生效..."
for attempt in {1..18}; do
  if gcloud services list \
    --enabled \
    --project="${PROJECT_ID}" \
    --filter="config.name=secretmanager.googleapis.com" \
    --format="value(config.name)" | grep -q "secretmanager.googleapis.com"; then
    echo "   ✅ Secret Manager API 已啟用"
    break
  fi

  if [[ "${attempt}" -eq 18 ]]; then
    echo "   ❌ Secret Manager API 尚未啟用，請稍後重試"
    exit 1
  fi

  sleep 10
done

# ── 3. 建立 Cloud Storage bucket ─────────────────────────────
echo "▶ [3/6] 建立 Cloud Storage bucket..."
if gsutil ls -b "gs://${BUCKET}" &>/dev/null; then
  echo "   Bucket gs://${BUCKET} 已存在，跳過"
else
  gsutil mb \
    -p "${PROJECT_ID}" \
    -l asia-east1 \
    -b on \
    "gs://${BUCKET}"
  echo "   ✅ Bucket 建立完成: gs://${BUCKET}"
fi

# 設定 lifecycle：runs 超過 90 天自動刪除（節省費用）
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 90, "matchesPrefix": ["runs/"]}
    }]
  }
}
EOF
gsutil lifecycle set /tmp/lifecycle.json "gs://${BUCKET}"
echo "   ✅ Lifecycle policy 設定完成（runs/ 超過 90 天自動刪除）"

# ── 3.5 設定 Secret Manager ─────────────────────────────────
echo "▶ [3.5/6] 設定 OpenAI API key secret..."
if gcloud secrets describe "${OPENAI_SECRET_NAME}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "   Secret ${OPENAI_SECRET_NAME} 已存在"
else
  gcloud secrets create "${OPENAI_SECRET_NAME}" \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --quiet
  echo "   ✅ Secret 建立完成: ${OPENAI_SECRET_NAME}"
fi

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  printf "%s" "${OPENAI_API_KEY}" | gcloud secrets versions add "${OPENAI_SECRET_NAME}" \
    --project="${PROJECT_ID}" \
    --data-file=-
  echo "   ✅ 已新增 OpenAI API key secret version"
else
  echo "   未提供 OPENAI_API_KEY；沿用既有 latest secret version"
fi

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")"
RUN_SERVICE_ACCOUNT="${RUN_SERVICE_ACCOUNT:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"
gcloud secrets add-iam-policy-binding "${OPENAI_SECRET_NAME}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${RUN_SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet >/dev/null
echo "   ✅ Cloud Run service account 可讀取 secret: ${RUN_SERVICE_ACCOUNT}"

# ── 4. Build Docker image ────────────────────────────────────
echo "▶ [4/6] 建構 Docker image（使用 Cloud Build）..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
gcloud builds submit "${REPO_ROOT}" \
  --tag "${IMAGE}" \
  --project="${PROJECT_ID}"
echo "   ✅ Image 建構完成: ${IMAGE}"

# ── 5. Deploy to Cloud Run ───────────────────────────────────
echo "▶ [5/6] 部署到 Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --set-env-vars "GCS_BUCKET=${BUCKET}" \
  --set-secrets "OPENAI_API_KEY=${OPENAI_SECRET_NAME}:latest" \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 10 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300 \
  --no-allow-unauthenticated
echo "   ✅ Cloud Run 部署完成"

# ── 6. 取得 Service URL ──────────────────────────────────────
echo "▶ [6/6] 取得 Service URL..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format "value(status.url)")

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ 設定完成！                                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Service URL : ${SERVICE_URL}"
echo "  Bucket      : gs://${BUCKET}"
echo ""
echo "  測試 health check（需先取得 token）："
echo "  TOKEN=\$(gcloud auth print-identity-token)"
echo "  curl -H \"Authorization: Bearer \$TOKEN\" ${SERVICE_URL}/health"
echo ""
echo "  執行掃描："
cat <<EXAMPLE
  curl -X POST \\
    -H "Authorization: Bearer \$TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{
      "brandName": "OpenVisi",
      "domain": "openvisi.dev",
      "category": "AI Visibility measurement"
    }' \\
    ${SERVICE_URL}/run
EXAMPLE
