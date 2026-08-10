#!/usr/bin/env bash
set -euo pipefail

SHI_ACTION="${1:-preflight}"
SHI_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHI_PROJECT="$SHI_REPO_ROOT/apps/unreal/SHI.uproject"

prepare_external_directory() {
  local input="$1" label="$2" resolved
  [[ "$input" == /* ]] || {
    printf '%s must be an absolute path.\n' "$label" >&2
    return 1
  }
  resolved="$(realpath -m "$input")"
  [[ "$resolved" != "/" && "$resolved" != "$SHI_REPO_ROOT" && "$resolved" != "$SHI_REPO_ROOT"/* ]] || {
    printf '%s must be a dedicated directory outside the Git repository.\n' "$label" >&2
    return 1
  }
  mkdir -p "$resolved"
  realpath -e "$resolved"
}

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
SHI_DERIVED_DATA_ROOT=""
if [[ -n "${SHI_UNREAL_DERIVED_DATA:-}" ]]; then
  SHI_DERIVED_DATA_ROOT="$(prepare_external_directory "$SHI_UNREAL_DERIVED_DATA" SHI_UNREAL_DERIVED_DATA)"
fi

run_engine_tool() {
  if [[ -n "$SHI_DERIVED_DATA_ROOT" ]]; then
    env "UE-LocalDataCachePath=$SHI_DERIVED_DATA_ROOT" "$@"
  else
    "$@"
  fi
}

case "$SHI_ACTION" in
  projectfiles)
    SHI_PROJECTFILES_TOOL="$SHI_ENGINE_ROOT/Engine/Build/BatchFiles/Linux/GenerateProjectFiles.sh"
    [[ -x "$SHI_PROJECTFILES_TOOL" ]] || {
      printf '%s\n' "Official Unreal Linux project-file generator was not found: $SHI_PROJECTFILES_TOOL" >&2
      exit 1
    }
    run_engine_tool "$SHI_PROJECTFILES_TOOL" -project="$SHI_PROJECT" -game -engine
    ;;
  build)
    run_engine_tool "$SHI_ENGINE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" SHIEditor Linux Development -Project="$SHI_PROJECT" -WaitMutex
    ;;
  test)
    run_engine_tool "$SHI_EDITOR_CMD" "$SHI_PROJECT" /Engine/Maps/Entry -unattended -nop4 -nosplash -nullrhi -nosound -nowrite -ExecCmds="Automation RunTests SHI.; Quit" -TestExit="Automation Test Queue Empty" -log
    ;;
  editor)
    if [[ -n "$SHI_DERIVED_DATA_ROOT" ]]; then
      exec env "UE-LocalDataCachePath=$SHI_DERIVED_DATA_ROOT" "$SHI_EDITOR" "$SHI_PROJECT" -log
    fi
    exec "$SHI_EDITOR" "$SHI_PROJECT" -log
    ;;
  linux)
    [[ -n "${SHI_UNREAL_PACKAGE_ROOT:-}" ]] || {
      printf '%s\n' "SHI_UNREAL_PACKAGE_ROOT is required for Linux packaging and must be outside Git." >&2
      exit 1
    }
    SHI_PACKAGE_ROOT="$(prepare_external_directory "$SHI_UNREAL_PACKAGE_ROOT" SHI_UNREAL_PACKAGE_ROOT)"
    run_engine_tool "$SHI_ENGINE_ROOT/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun -project="$SHI_PROJECT" -platform=Linux -clientconfig=Development -build -cook -stage -pak -archive -archivedirectory="$SHI_PACKAGE_ROOT"
    ;;
  *)
    printf '%s\n' "Usage: $0 {preflight|projectfiles|build|test|editor|linux}" >&2
    exit 2
    ;;
esac
