# Security Policy

OpenVisi currently runs a local mock artifact pipeline. No API keys are required for the current demo flow.

## Supported Versions

Security fixes target the latest code on the default branch until versioned release support is defined.

## Reporting a Vulnerability

Please do not open a public issue for sensitive security reports.

Use GitHub private vulnerability reporting or the repository security advisory flow if available. If neither is available, open a minimal public issue asking for a private disclosure channel without including exploit details.

Useful reports include:

- unsafe file writes
- command execution risks
- accidental secret exposure
- crawler behavior that violates expected boundaries
- artifact outputs exposing sensitive crawled content
- dependency vulnerabilities with a practical OpenVisi impact path

## Secret Handling

The current mock pipeline does not read provider API keys.

Future real provider adapters must:

- use environment variables
- be explicitly opt-in
- avoid logging secrets
- avoid writing secrets into artifacts
- document provider behavior and data flow

Never commit API keys, `.env` files, private crawl output, private generated artifacts, or reports from non-public websites.

## Artifact Output Caution

Artifact bundles may contain crawled page text, answer text, diagnostic metadata, and local file paths depending on command options. Treat generated output directories as local runtime data unless they are intentionally curated examples.
