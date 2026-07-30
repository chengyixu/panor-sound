# Security and Privacy

## Secrets

Never commit:

- SSH hostnames, private keys, passwords, tokens, or deploy credentials.
- Analytics IDs, form-provider keys, CMS tokens, or API credentials.
- Private media, customer data, or unpublished campaign material.

Use environment variables at release time or the selected platform’s secret store. `deploy/publish-static.sh` reads deployment values from environment variables only. Automated releases use a dedicated GitHub Environment secret and a dedicated SSH key that is not shared with a human account.

## Production Deployment Boundary

- GitHub Actions connects as `panor-sound-deploy`, never as `root`.
- The SSH key is restricted and the account can run only the root-owned `/usr/local/sbin/panor-sound-release` helper through passwordless `sudo`.
- The helper accepts only a fixed commit-addressed archive path, caps archive size, rejects traversal and special files, and permits only the Sound site plus Panor registration inputs.
- Production registry files are staged and backed up before mutation. The site swap is atomic, ownership is normalized to `www:www`, and failed smoke checks trigger rollback.
- Host keys are pinned in `PANOR_DEPLOY_KNOWN_HOSTS`; the workflow never performs trust-on-first-use SSH.

## Integrations

The production policy permits the owner-approved Monetag MultiTag and Panor cross-promotion script. AdSense markers are rejected. Before adding any other integration, document the purpose, data flow, legal basis, retention, opt-out, failure behavior, and rollback process in `docs/CONTENT_BRIEF.md`.

## Reporting

Report a suspected secret exposure or security concern privately to the repository owner. Do not open a public issue containing sensitive data.
