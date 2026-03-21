# Pull Request Description Template

Use this template when opening or describing PRs. Generated descriptions are saved under `thoughts/shared/prs/{number}_description.md`.

## Summary

<!-- What does this PR do in 1–3 sentences? -->

## Problem / motivation

<!-- What user or technical problem does this solve? -->

## What changed

<!-- Bullet list of notable changes; call out API/UI/DB impacts. -->

## Breaking changes / migration

<!-- Schema, config, or behavior that existing deployments must handle. -->

## How to verify it

<!-- Checklist; mark items you have run. -->

- [ ] `npm run format:check` (repo root)
- [ ] `npm run lint` (repo root)
- [ ] `npm test` (repo root — server e2e)
- [ ] Manual: <!-- describe UI or integration steps -->

## Changelog

<!-- Short line suitable for release notes. -->
