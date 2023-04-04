#!/bin/bash
docker run --rm -p 8080:8080 -e NODE_SERVER_PORT=8080 -e NODE_APP_NAME=ONS -e NODE_ENV=DEV gcr.io/ons-hatespeech-detector-2/ons2-be:latest
