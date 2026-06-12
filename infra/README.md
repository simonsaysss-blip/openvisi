# OpenVisi — GCP Infrastructure

本目錄包含將 OpenVisi benchmark harness 部署至 Google Cloud Run 的所有設定。

## 架構

```
POST /run  →  Cloud Run (infra/server.mjs)
                  │
                  ├─ openvisi benchmark CLI (run → score → report → cost)
                  │
                  └─ Cloud Storage  gs://openvisi-artifacts-*/runs/<runId>/
```

## 前置需求

1. 安裝 [gcloud CLI](https://cloud.google.com/sdk/docs/install)
   ```bash
   brew install --cask google-cloud-sdk
   ```

2. 登入並設定 project
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. 確認已安裝 Docker（Cloud Build 遠端建構不需要本機 Docker）

## 一鍵部署

在 repo 根目錄執行：

```bash
printf 'OPENAI_API_KEY=sk-...\n' > .env.deploy
bash infra/setup.sh
```

腳本會自動完成：
- 啟用 Cloud Run、Cloud Storage、Cloud Build APIs
- 建立 `openvisi-artifacts-*` bucket（asia-east1，90 天 lifecycle）
- 建立或更新 Secret Manager secret：`openvisi-openai-api-key`
- 用 Cloud Build 建構 Docker image
- 部署 Cloud Run service（`asia-east1`，0~5 instances，scale to zero）
- 將 `OPENAI_API_KEY` 透過 Cloud Run secret mount 注入，不使用 plain `--set-env-vars`

## 測試 API

```bash
# 取得認證 token
TOKEN=$(gcloud auth print-identity-token)
SERVICE_URL=$(gcloud run services describe openvisi-api \
  --region asia-east1 --format "value(status.url)")

# Health check
curl -H "Authorization: Bearer $TOKEN" $SERVICE_URL/health

# 執行 benchmark
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Mavis English",
    "domain": "mavisenglish.com",
    "category": "English education",
    "competitors": [
      { "name": "TutorABC", "domain": "tutorabc.com", "aliases": [] },
      { "name": "Hahow", "domain": "hahow.in", "aliases": [] }
    ]
  }' \
  $SERVICE_URL/run
```

## 查看 Artifacts

```bash
# 列出所有 runs
gsutil ls gs://openvisi-artifacts-gen-lang-client-0631649736/runs/

# 查看特定 run
gsutil ls gs://openvisi-artifacts-gen-lang-client-0631649736/runs/<runId>/

# 下載 artifacts
gsutil -m cp -r gs://openvisi-artifacts-gen-lang-client-0631649736/runs/<runId>/ ./local-run/
```

## 費用估算

| 資源 | 用量 | 估算費用/月 |
|------|------|------------|
| Cloud Run | 每次掃描約 30s, 512MB | ~$0.5 / 100次掃描 |
| Cloud Storage | artifacts ~1MB/run | ~$0.02 / 100 runs |
| Cloud Build | 每次 deploy ~3分鐘 | ~$0.00 (免費層覆蓋) |

**GCP Free Credit $300 可支撐約 1,000+ 次掃描。**

## 環境變數（Cloud Run）

| 變數 | 說明 | 必填 |
|------|------|------|
| `GCS_BUCKET` | artifact 上傳目標 bucket | ✅ |
| `OPENAI_API_KEY` | Secret Manager 注入的 OpenAI provider key | ✅ for provider-backed benchmark |

更新 API key：
```bash
printf 'OPENAI_API_KEY=sk-...\n' > .env.deploy
bash infra/setup.sh
```

Do not commit `.env.deploy`. It is ignored by git and should only be used as a local deployment secret source.

## 相關資源

- [Cloud Run 控制台](https://console.cloud.google.com/run?project=gen-lang-client-0631649736)
- [Cloud Storage 控制台](https://console.cloud.google.com/storage?project=gen-lang-client-0631649736)
- [帳單抵免額](https://console.cloud.google.com/billing/011C3D-261342-3DA775/credits)
