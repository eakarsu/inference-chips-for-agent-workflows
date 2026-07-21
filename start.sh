#!/bin/sh
set -eu

if [ "${NODE_ENV:-development}" != "production" ]; then
  if [ "${CORS_ALLOWED_ORIGINS:-}" = "" ]; then
    export CORS_ALLOWED_ORIGINS="http://127.0.0.1:${FRONTEND_PORT:-5175}"
  fi
  if [ "${EVIDENCE_ALLOWED_HOSTS:-}" = "" ]; then
    export EVIDENCE_ALLOWED_HOSTS="evidence.example.test"
  fi
fi

exec node backend/server.js
