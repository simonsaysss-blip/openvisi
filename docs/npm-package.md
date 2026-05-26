# npm Package Notes

OpenVisi is not published to npm as part of this release hygiene pass.

The repository is npm-first and uses `package-lock.json`.

Use `npm pack --dry-run` to inspect package contents before any future manual publish step.

Current package output is based on built `dist/` files declared through package `files`, `main`, `types`, and `exports` fields.
