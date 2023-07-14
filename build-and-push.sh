#!/bin/bash
docker build -t gcr.io/ons-hatespeech-detector-2/ons2-be:latest .
gcloud docker -- push gcr.io/ons-hatespeech-detector-2/ons2-be:latest
