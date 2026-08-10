# Infrastructure

Implements the public Soundscape HTTP boundary and delegates response validation to the domain contract.

## Dependencies

- May import the domain parsers.
- Must not import application or UI modules.

## Invariants

- GET requests use `no-store` and a bounded timeout.
- Non-2xx and timeout failures remain errors; no sample-data fallback exists.
- Play telemetry sends only rounded non-negative `listened_sec` with `keepalive`.
