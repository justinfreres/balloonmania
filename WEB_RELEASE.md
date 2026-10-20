# Balloon Math Mania web edition

The original Kotlin Android source and history are preserved. `web/` is the browser adaptation of its arithmetic balloon game: three levels, 60-second rounds, distinct answers, score progression, sound control, device-local high scores and offline assets.

Intended production URL: https://balloonmania.justinfreres.com/

This release does not claim the hostname is live. The existing AWS App Runner website release contains host-isolated game assets; deployment and the custom-domain certificate/DNS setup are still required. No new paid AWS resources are required by this source change.

Run `node --test web-tests/engine.test.mjs` to verify arithmetic and progression. Serve web/ with any static HTTP server for local development.
