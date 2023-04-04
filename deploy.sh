#!/bin/bash
TAG=dev-fe-`TZ=UTC date +%Y%m%d%H%M`
git add .
git commit -m "TAG: $TAG"
git push
git tag $TAG
git push origin $TAG