#!/usr/bin/env bash
set -euo pipefail

SHI_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHI_REPO_ROOT="$(cd "${SHI_SCRIPT_DIR}/.." && pwd)"
SHI_UNITY_PROJECT="${SHI_REPO_ROOT}/apps/unity"
SHI_RUNTIME_DIR="${SHI_REPO_ROOT}/.runtime/unity"
SHI_ACTION="${1:-preflight}"
SHI_UNITY_VERSION="$(awk '/^m_EditorVersion:/{print $2}' "${SHI_UNITY_PROJECT}/ProjectSettings/ProjectVersion.txt")"

find_editor() {
  if [[ -n "${UNITY_EDITOR:-}" && -x "${UNITY_EDITOR}" ]]; then
    printf '%s\n' "${UNITY_EDITOR}"
    return 0
  fi

  local candidate
  for candidate in \
    "${HOME}/Unity/Hub/Editor/${SHI_UNITY_VERSION}/Editor/Unity" \
    "${HOME}/Unity/Hub/Editor/${SHI_UNITY_VERSION}/Unity"; do
    if [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

if ! SHI_EDITOR="$(find_editor)"; then
  printf '%s\n' "Unity ${SHI_UNITY_VERSION} was not found." >&2
  printf '%s\n' "Set UNITY_EDITOR to the full Unity executable path." >&2
  exit 2
fi

mkdir -p "${SHI_RUNTIME_DIR}"
cd "${SHI_REPO_ROOT}"
npm run sync:content

case "${SHI_ACTION}" in
  preflight)
    exec "${SHI_EDITOR}" -batchmode -nographics -quit \
      -projectPath "${SHI_UNITY_PROJECT}" \
      -executeMethod SHI.Editor.ShiBuild.Preflight \
      -logFile -
    ;;
  test)
    exec "${SHI_EDITOR}" -batchmode -nographics \
      -projectPath "${SHI_UNITY_PROJECT}" \
      -runTests -testPlatform EditMode \
      -testResults "${SHI_RUNTIME_DIR}/editmode-results.xml" \
      -logFile -
    ;;
  linux)
    export SHI_BUILD_ROOT="${SHI_BUILD_ROOT:-${SHI_UNITY_PROJECT}/Builds}"
    exec "${SHI_EDITOR}" -batchmode -nographics -quit \
      -projectPath "${SHI_UNITY_PROJECT}" \
      -executeMethod SHI.Editor.ShiBuild.BuildLinux \
      -logFile -
    ;;
  web)
    export SHI_BUILD_ROOT="${SHI_BUILD_ROOT:-${SHI_UNITY_PROJECT}/Builds}"
    exec "${SHI_EDITOR}" -batchmode -nographics -quit \
      -projectPath "${SHI_UNITY_PROJECT}" \
      -executeMethod SHI.Editor.ShiBuild.BuildWeb \
      -logFile -
    ;;
  *)
    printf '%s\n' "Usage: $0 {preflight|test|linux|web}" >&2
    exit 2
    ;;
esac
