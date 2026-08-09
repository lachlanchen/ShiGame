#!/usr/bin/env bash
set -euo pipefail

SHI_ACTION="${1:-preflight}"
SHI_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHI_PROJECT="$SHI_REPO_ROOT/apps/unreal/SHI.uproject"

preflight() {
  cd "$SHI_REPO_ROOT"
  npm run sync:content
  node scripts/validate-unreal-project.mjs
}

find_engine() {
  if [[ -n "${SHI_UNREAL_ROOT:-}" && -x "$SHI_UNREAL_ROOT/Engine/Binaries/Linux/UnrealEditor" ]]; then
    printf '%s\n' "$SHI_UNREAL_ROOT"
    return 0
  fi
  for candidate in /opt/UnrealEngine /opt/UnrealEngine-5.8 /usr/local/UnrealEngine-5.8; do
    if [[ -x "$candidate/Engine/Binaries/Linux/UnrealEditor" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  printf '%s\n' "Official Unreal Engine 5.8 Linux installed build was not found." >&2
  printf '%s\n' "Download the official Linux ZIP after Epic sign-in, verify/install it outside Git with scripts/install-official-unreal-linux.sh, and set SHI_UNREAL_ROOT." >&2
  printf '%s\n' "https://www.unrealengine.com/en-US/linux" >&2
  return 1
}

preflight
if [[ "$SHI_ACTION" == "preflight" ]]; then exit 0; fi
SHI_ENGINE_ROOT="$(find_engine)"
SHI_EDITOR="$SHI_ENGINE_ROOT/Engine/Binaries/Linux/UnrealEditor"
SHI_EDITOR_CMD="$SHI_ENGINE_ROOT/Engine/Binaries/Linux/UnrealEditor-Cmd"

case "$SHI_ACTION" in
  projectfiles)
    "$SHI_ENGINE_ROOT/GenerateProjectFiles.sh" -project="$SHI_PROJECT" -game -engine
    ;;
  build)
    "$SHI_ENGINE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" SHIEditor Linux Development -Project="$SHI_PROJECT" -WaitMutex
    ;;
  test)
    "$SHI_EDITOR_CMD" "$SHI_PROJECT" /Engine/Maps/Entry -unattended -nop4 -nosplash -nullrhi -ExecCmds="Automation RunTests SHI; Quit" -TestExit="Automation Test Queue Empty" -log
    ;;
  editor)
    exec "$SHI_EDITOR" "$SHI_PROJECT" -log
    ;;
  linux)
    "$SHI_ENGINE_ROOT/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun -project="$SHI_PROJECT" -platform=Linux -clientconfig=Development -build -cook -stage -pak -archive -archivedirectory="$SHI_REPO_ROOT/apps/unreal/Builds/Linux"
    ;;
  *)
    printf '%s\n' "Usage: $0 {preflight|projectfiles|build|test|editor|linux}" >&2
    exit 2
    ;;
esac
