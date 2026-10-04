#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-"$repo_root/dist"}"
staging_dir="$(mktemp -d)"

cleanup() {
    rm -rf "$staging_dir"
}
trap cleanup EXIT

mkdir -p "$output_dir"
cp "$repo_root/metadata.json" "$repo_root/extension.js" "$staging_dir/"

while IFS= read -r po_file; do
    language="$(basename "$po_file" .po)"
    locale_dir="$staging_dir/locale/$language/LC_MESSAGES"
    mkdir -p "$locale_dir"
    msgfmt --check \
        --output-file "$locale_dir/pip-always-on-top@giuseppe.mo" \
        "$po_file"
done < <(find "$repo_root/po" -maxdepth 1 -type f -name '*.po' -print | sort)

gnome-extensions pack \
    --force \
    --out-dir "$output_dir" \
    "$staging_dir"

printf 'Built %s\n' "$output_dir/pip-always-on-top@giuseppe.shell-extension.zip"
