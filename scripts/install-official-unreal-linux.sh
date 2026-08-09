#!/usr/bin/env bash
set -euo pipefail

SHI_INSTALL_ACTION="${1:-}"
SHI_INSTALL_ARCHIVE_INPUT="${2:-}"
SHI_INSTALL_DESTINATION_INPUT="${3:-}"
SHI_INSTALL_REPO_ROOT="$(realpath -e "$(dirname "${BASH_SOURCE[0]}")/..")"

usage() {
  printf '%s\n' "Usage: $0 verify /absolute/path/Linux_Unreal_Engine_5.8.x.zip"
  printf '%s\n' "       $0 install /absolute/path/Linux_Unreal_Engine_5.8.x.zip /absolute/outside-git/UE_5.8.x"
}

fail() {
  printf 'Official Unreal installer refused: %s\n' "$1" >&2
  exit 1
}

[[ "$SHI_INSTALL_ACTION" == "verify" || "$SHI_INSTALL_ACTION" == "install" ]] || {
  usage >&2
  exit 2
}
[[ -n "$SHI_INSTALL_ARCHIVE_INPUT" ]] || fail "an explicit archive path is required"

for SHI_INSTALL_TOOL in realpath unzip zipinfo jq sha256sum find; do
  command -v "$SHI_INSTALL_TOOL" >/dev/null || fail "required tool is missing: $SHI_INSTALL_TOOL"
done

SHI_INSTALL_ARCHIVE="$(realpath -e "$SHI_INSTALL_ARCHIVE_INPUT" 2>/dev/null)" || fail "archive does not exist"
[[ -f "$SHI_INSTALL_ARCHIVE" ]] || fail "archive path is not a regular file"
[[ "$SHI_INSTALL_ARCHIVE" == *.zip ]] || fail "archive must be a ZIP file"

SHI_INSTALL_ENTRY_COUNT=0
SHI_INSTALL_BUILD_ENTRY=""
while IFS= read -r SHI_INSTALL_ENTRY; do
  [[ -n "$SHI_INSTALL_ENTRY" ]] || continue
  SHI_INSTALL_ENTRY_COUNT=$((SHI_INSTALL_ENTRY_COUNT + 1))
  [[ "$SHI_INSTALL_ENTRY" != /* ]] || fail "archive contains an absolute path"
  [[ ! "$SHI_INSTALL_ENTRY" =~ (^|/)\.\.(/|$) ]] || fail "archive contains a parent-directory traversal"
  if [[ "$SHI_INSTALL_ENTRY" == "Engine/Build/Build.version" || "$SHI_INSTALL_ENTRY" == */Engine/Build/Build.version ]]; then
    [[ -z "$SHI_INSTALL_BUILD_ENTRY" ]] || fail "archive contains multiple engine roots"
    SHI_INSTALL_BUILD_ENTRY="$SHI_INSTALL_ENTRY"
  fi
done < <(zipinfo -1 "$SHI_INSTALL_ARCHIVE")

(( SHI_INSTALL_ENTRY_COUNT > 0 )) || fail "archive is empty or unreadable"
[[ -n "$SHI_INSTALL_BUILD_ENTRY" ]] || fail "Engine/Build/Build.version is missing"

SHI_INSTALL_BUILD_JSON="$(unzip -p "$SHI_INSTALL_ARCHIVE" "$SHI_INSTALL_BUILD_ENTRY")" || fail "Build.version could not be read"
jq -e '
  (.MajorVersion == 5)
  and (.MinorVersion == 8)
  and (.PatchVersion | type == "number")
  and (.PatchVersion >= 0)
  and (.Changelist | type == "number")
' >/dev/null <<<"$SHI_INSTALL_BUILD_JSON" || fail "archive is not a valid Unreal Engine 5.8 installed build"

SHI_INSTALL_PATCH="$(jq -r '.PatchVersion' <<<"$SHI_INSTALL_BUILD_JSON")"
SHI_INSTALL_CHANGELIST="$(jq -r '.Changelist' <<<"$SHI_INSTALL_BUILD_JSON")"
SHI_INSTALL_VERSION="5.8.${SHI_INSTALL_PATCH}"

printf 'Checking ZIP integrity for Unreal Engine %s...\n' "$SHI_INSTALL_VERSION"
unzip -tq "$SHI_INSTALL_ARCHIVE" >/dev/null || fail "ZIP integrity check failed"
SHI_INSTALL_SHA256="$(sha256sum "$SHI_INSTALL_ARCHIVE" | awk '{print $1}')"

if [[ "$SHI_INSTALL_ACTION" == "verify" ]]; then
  printf 'Official Unreal archive verified: version=%s changelist=%s entries=%s sha256=%s\n' \
    "$SHI_INSTALL_VERSION" "$SHI_INSTALL_CHANGELIST" "$SHI_INSTALL_ENTRY_COUNT" "$SHI_INSTALL_SHA256"
  exit 0
fi

[[ -n "$SHI_INSTALL_DESTINATION_INPUT" ]] || fail "an explicit install destination is required"
[[ "$SHI_INSTALL_DESTINATION_INPUT" == /* ]] || fail "install destination must be absolute"
SHI_INSTALL_DESTINATION="$(realpath -m "$SHI_INSTALL_DESTINATION_INPUT")"
[[ "$SHI_INSTALL_DESTINATION" != "/" ]] || fail "filesystem root is not a valid destination"
[[ "$SHI_INSTALL_DESTINATION" != "$SHI_INSTALL_REPO_ROOT" && "$SHI_INSTALL_DESTINATION" != "$SHI_INSTALL_REPO_ROOT"/* ]] \
  || fail "engine binaries must remain outside the Git repository"
[[ ! -e "$SHI_INSTALL_DESTINATION" ]] || fail "destination already exists"

SHI_INSTALL_PARENT="$(dirname "$SHI_INSTALL_DESTINATION")"
[[ "$SHI_INSTALL_PARENT" != "/" ]] || fail "choose a dedicated parent directory instead of filesystem root"
mkdir -p "$SHI_INSTALL_PARENT"
SHI_INSTALL_PARENT="$(realpath -e "$SHI_INSTALL_PARENT")"

SHI_INSTALL_STAGE="$(mktemp -d "$SHI_INSTALL_PARENT/.shi-ue-5.8-stage.XXXXXX")"
cleanup_stage() {
  if [[ -n "${SHI_INSTALL_STAGE:-}" \
    && "$SHI_INSTALL_STAGE" == "$SHI_INSTALL_PARENT"/.shi-ue-5.8-stage.* \
    && -d "$SHI_INSTALL_STAGE" ]]; then
    rm -rf -- "$SHI_INSTALL_STAGE"
  fi
}
trap cleanup_stage EXIT

mkdir "$SHI_INSTALL_STAGE/payload"
printf 'Extracting Unreal Engine %s into a same-filesystem staging directory...\n' "$SHI_INSTALL_VERSION"
unzip -q "$SHI_INSTALL_ARCHIVE" -d "$SHI_INSTALL_STAGE/payload"

mapfile -t SHI_INSTALL_EDITORS < <(find "$SHI_INSTALL_STAGE/payload" -type f -path '*/Engine/Binaries/Linux/UnrealEditor' -print)
(( ${#SHI_INSTALL_EDITORS[@]} == 1 )) || fail "extracted archive must contain exactly one Linux UnrealEditor"
SHI_INSTALL_EDITOR="${SHI_INSTALL_EDITORS[0]}"
SHI_INSTALL_ENGINE_ROOT="${SHI_INSTALL_EDITOR%/Engine/Binaries/Linux/UnrealEditor}"
[[ -x "$SHI_INSTALL_EDITOR" ]] || fail "extracted UnrealEditor is not executable"
[[ -x "$SHI_INSTALL_ENGINE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd" ]] || fail "extracted UnrealEditor-Cmd is not executable"
[[ -x "$SHI_INSTALL_ENGINE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" ]] || fail "extracted Linux Build.sh is not executable"
[[ -x "$SHI_INSTALL_ENGINE_ROOT/Engine/Build/BatchFiles/Linux/GenerateProjectFiles.sh" ]] \
  || fail "extracted Linux GenerateProjectFiles.sh is not executable"

jq -e --argjson patch "$SHI_INSTALL_PATCH" '
  (.MajorVersion == 5) and (.MinorVersion == 8) and (.PatchVersion == $patch)
' "$SHI_INSTALL_ENGINE_ROOT/Engine/Build/Build.version" >/dev/null \
  || fail "extracted build metadata drifted from the verified archive"

mv -- "$SHI_INSTALL_ENGINE_ROOT" "$SHI_INSTALL_DESTINATION"
cat >"$SHI_INSTALL_DESTINATION/.shi-official-install" <<EOF
source_archive=$(basename "$SHI_INSTALL_ARCHIVE")
version=$SHI_INSTALL_VERSION
changelist=$SHI_INSTALL_CHANGELIST
sha256=$SHI_INSTALL_SHA256
installed_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chmod 600 "$SHI_INSTALL_DESTINATION/.shi-official-install"

printf 'Official Unreal installed: %s\n' "$SHI_INSTALL_DESTINATION"
printf 'Set SHI_UNREAL_ROOT=%s\n' "$SHI_INSTALL_DESTINATION"
