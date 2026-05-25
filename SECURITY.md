# Security Policy

OpenVisi is an early-stage open-source CLI toolkit. The MVP is designed to run locally and does not require API keys.

## Supported Versions

Security fixes currently target the latest code on the default branch. Versioned release support will be defined after the first public release.

## Reporting a Vulnerability

Please do not open a public issue for sensitive security reports.

Until a dedicated security contact is published, report issues privately to the repository maintainer through the GitHub security advisory flow if it is enabled. If that is not available, open a minimal issue asking for a private disclosure channel without including exploit details.

Useful reports include:

- command injection risks
- unsafe file writes
- accidental secret exposure
- crawler behavior that violates expected safety boundaries
- dependency vulnerabilities with a practical exploit path

## Scope

In scope:

- OpenVisi source code
- CLI behavior
- report generation
- crawler safety and file output behavior

Out of scope:

- vulnerabilities in third-party websites scanned with OpenVisi
- generic dependency advisories without an OpenVisi impact path
- social engineering
- denial-of-service against public websites

## Secret Handling

The MVP works without provider API keys. If provider integrations are added later, they should be bring-your-own-key, optional, and documented clearly. Do not commit real API keys, crawl artifacts containing private data, or generated reports from private websites.
