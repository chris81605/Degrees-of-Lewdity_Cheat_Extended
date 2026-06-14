#!/bin/bash

# Get the script directory
SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$( dirname "$SOURCE_DIR" )"
ZIP_PATH="$PARENT_DIR/cheat_extended.mod.zip"

echo "Packaging from: $SOURCE_DIR"
echo "Output ZIP: $ZIP_PATH"

# Remove existing zip
if [ -f "$ZIP_PATH" ]; then
    rm -f "$ZIP_PATH"
fi

# Change directory to source
cd "$SOURCE_DIR"

# Zip all files using standard zip command (maintaining relative paths with forward slashes)
# Exclude pack.ps1, pack.sh, and .git directory
zip -r "$ZIP_PATH" . -x "pack.ps1" "pack.sh" ".git/*" ".git" "*/.DS_Store"

echo "ZIP packaging completed successfully!"
