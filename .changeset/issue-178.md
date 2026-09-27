---
'@vskstudio/takt-vue': minor
---

New `debug` prop on `<Takt>` and `debug` attribute on `<takt-analytics>`. `useTakt().optOut()`, `optIn()` and the new `isOptedOut()` work before `<Takt>` mounts, and the package re-exports `optOut`, `optIn` and `isOptedOut` from core (also from `./directives`). Requires `@vskstudio/takt-core` 0.9.0, where `scrubUrl` also covers outbound-link and file-download URLs.
