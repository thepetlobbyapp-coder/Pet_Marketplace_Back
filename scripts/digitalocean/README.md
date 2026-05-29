# DigitalOcean deployment helpers

Legacy provider helper scripts were retired because the current deployment target is
DigitalOcean.

Use the DigitalOcean agent instructions in
`../.codex/E_Environment/E_Agent_DigitalOceanEnvironment.md` before creating any
write-capable helper. Any future script must:

- read the existing App Platform app spec before changing it;
- preserve unrelated components, env vars, domains and alerts;
- classify env vars by component, scope and type;
- keep secrets as `SECRET`;
- avoid printing secret values;
- require an explicit app id/name and environment;
- validate health and CORS after deploy.

Do not recreate one-off provider scripts without a rollback plan.

