# Home Assistant integration placeholder

Home Assistant should remain an integration layer, not HomeBoard's system of record.
Future implementation options:

- REST endpoints for reading dashboard state and completing task instances.
- MQTT discovery/status topics for wall display health and task counts.
- Webhooks for automation-created task templates or one-off task instances.
- Lovelace panel embedding of `/wall` for local dashboards.

No secrets or Home Assistant-specific runtime dependencies are required in the preview.
