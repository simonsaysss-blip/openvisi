# OpenVisi Examples

This directory contains curated examples for OSS visitors.

## Files

- `openvisi.config.example.json`: starter config using the deterministic mock provider.
- `debug-report.example.md`: small, stable example of the artifact debug report language.
- `demo-report.md`: older report template retained for compatibility.
- `reports/`: curated generated report snapshots.

## Usage

To try the config example:

```bash
cp examples/openvisi.config.example.json openvisi.config.json
npm run build
npx openvisi scan --dry-run --provider mock --output openvisi-report
```

The example config contains no API keys and does not call real provider APIs.

For the full current artifact pipeline, see [docs/quickstart.md](../docs/quickstart.md).
