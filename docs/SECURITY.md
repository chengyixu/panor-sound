# Security and Privacy

## Secrets

Never commit:

- SSH hostnames, private keys, passwords, tokens, or deploy credentials.
- Analytics IDs, form-provider keys, CMS tokens, or API credentials.
- Private media, customer data, or unpublished campaign material.

Use environment variables at release time or the selected platform’s secret store. `deploy/publish-static.sh` reads deployment values from environment variables only.

## Integrations

This scaffold ships with no trackers, forms, cookies, external fonts, or third-party scripts. Before adding one, document the purpose, data flow, legal basis, retention, opt-out, failure behavior, and rollback process in `docs/CONTENT_BRIEF.md`.

## Reporting

Report a suspected secret exposure or security concern privately to the repository owner. Do not open a public issue containing sensitive data.
