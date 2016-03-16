#!/bin/bash

set -e
set -o pipefail

VERSION="$1"

cd "$(dirname "$0")/.."

# Check that the version looks semver compliant.
if ! node_modules/.bin/semver "$VERSION" > /dev/null; then
  echo "Invalid version number: $VERSION" >&2
  exit 1
fi

# Update the version in package.json
npm --no-git-tag-version version "$VERSION"

# Update CURRENT_PROJECT_VERSION and DYLIB_CURRENT_VERSION in the Xcode project.
xcrun agvtool new-version "${VERSION%%-*}"
