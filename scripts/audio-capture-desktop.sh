#!/usr/bin/env bash
set -euo pipefail

SHI_CAPTURE_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SHI_CAPTURE_RUNTIME="$SHI_CAPTURE_ROOT/.runtime/audio-capture"
SHI_CAPTURE_DISPLAY=:124
SHI_CAPTURE_VNC_PORT=5923
SHI_CAPTURE_NOVNC_PORT=6123
SHI_CAPTURE_CDP_PORT=9323
SHI_CAPTURE_APP_URL=${SHI_AUDIO_CAPTURE_URL:-http://127.0.0.1:4173/?seed=5EED2026}
SHI_CAPTURE_SINK=shi-game-audio-capture
SHI_CAPTURE_CHROME=/opt/google/chrome/chrome

pid_alive() {
  local pid_file=$1
  test -f "$pid_file" || return 1
  local pid
  pid=$(<"$pid_file")
  kill -0 "$pid" 2>/dev/null
}

wait_http() {
  local url=$1
  for _ in $(seq 1 80); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then return 0; fi
    sleep .25
  done
  return 1
}

sink_ids() {
  pw-dump | jq -r --arg name "$SHI_CAPTURE_SINK" '.[] | select(.info.props["node.name"] == $name) | .id'
}

status() {
  local failed=0
  for service in xvfb x11vnc websockify chrome; do
    if pid_alive "$SHI_CAPTURE_RUNTIME/$service.pid"; then
      printf '%s=%s\n' "$service" "$(<"$SHI_CAPTURE_RUNTIME/$service.pid")"
    else
      printf '%s=stopped\n' "$service"
      failed=1
    fi
  done
  local ids
  ids=$(sink_ids)
  if test -n "$ids" && test "$(printf '%s\n' "$ids" | wc -l)" -eq 1; then printf 'sink=%s:%s\n' "$SHI_CAPTURE_SINK" "$ids"; else printf 'sink=invalid\n'; failed=1; fi
  curl -fsS --max-time 2 "http://127.0.0.1:$SHI_CAPTURE_NOVNC_PORT/vnc.html" >/dev/null 2>&1 || failed=1
  curl -fsS --max-time 2 "http://127.0.0.1:$SHI_CAPTURE_CDP_PORT/json/version" >/dev/null 2>&1 || failed=1
  printf 'novnc=http://127.0.0.1:%s/vnc.html?host=127.0.0.1&port=%s&autoconnect=1&resize=scale\n' "$SHI_CAPTURE_NOVNC_PORT" "$SHI_CAPTURE_NOVNC_PORT"
  return "$failed"
}

stop_service() {
  local service=$1
  local pid_file="$SHI_CAPTURE_RUNTIME/$service.pid"
  if ! pid_alive "$pid_file"; then return; fi
  local pid
  pid=$(<"$pid_file")
  kill "$pid"
  for _ in $(seq 1 40); do
    if ! kill -0 "$pid" 2>/dev/null; then break; fi
    sleep .1
  done
  if kill -0 "$pid" 2>/dev/null; then kill -KILL "$pid"; fi
  rm -f -- "$pid_file"
}

stop() {
  mkdir -p "$SHI_CAPTURE_RUNTIME"
  stop_service chrome
  stop_service websockify
  stop_service x11vnc
  stop_service xvfb
  mapfile -t ids < <(sink_ids)
  if test "${#ids[@]}" -gt 1; then
    printf 'Refusing to destroy %s duplicate capture sinks.\n' "${#ids[@]}" >&2
    exit 1
  fi
  if test "${#ids[@]}" -eq 1; then pw-cli destroy "${ids[0]}"; fi
  printf 'SHI audio-capture desktop stopped.\n'
}

start() {
  mkdir -p "$SHI_CAPTURE_RUNTIME/profile"
  if status >/dev/null 2>&1; then status; return; fi
  for port in "$SHI_CAPTURE_VNC_PORT" "$SHI_CAPTURE_NOVNC_PORT" "$SHI_CAPTURE_CDP_PORT"; do
    if ss -ltnH | awk '{print $4}' | grep -Eq "(^|:)$port$"; then
      printf 'Port %s is occupied by an unmanaged process.\n' "$port" >&2
      exit 1
    fi
  done
  if test -S /tmp/.X11-unix/X124; then
    if DISPLAY="$SHI_CAPTURE_DISPLAY" xdpyinfo >/dev/null 2>&1; then
      printf 'X display %s is occupied by an unmanaged process.\n' "$SHI_CAPTURE_DISPLAY" >&2
      exit 1
    fi
    rm -f -- /tmp/.X11-unix/X124
  fi
  mapfile -t ids < <(sink_ids)
  if test "${#ids[@]}" -gt 1; then printf 'Duplicate SHI capture sinks exist.\n' >&2; exit 1; fi
  if test "${#ids[@]}" -eq 0; then
    pw-cli create-node adapter "{ factory.name=support.null-audio-sink node.name=$SHI_CAPTURE_SINK node.description=\"SHI browser capture sink\" media.class=Audio/Sink object.linger=true audio.position=[ FL FR ] }" >/dev/null
  fi
  sleep .5
  mapfile -t ids < <(sink_ids)
  if test "${#ids[@]}" -ne 1; then printf 'Could not establish one SHI capture sink.\n' >&2; exit 1; fi

  nohup Xvfb "$SHI_CAPTURE_DISPLAY" -screen 0 1600x1000x24 -nolisten tcp >"$SHI_CAPTURE_RUNTIME/xvfb.log" 2>&1 &
  printf '%s\n' "$!" >"$SHI_CAPTURE_RUNTIME/xvfb.pid"
  for _ in $(seq 1 40); do test -S /tmp/.X11-unix/X124 && break; sleep .1; done
  nohup x11vnc -display "$SHI_CAPTURE_DISPLAY" -localhost -rfbport "$SHI_CAPTURE_VNC_PORT" -forever -shared -nopw -noxdamage >"$SHI_CAPTURE_RUNTIME/x11vnc.log" 2>&1 &
  printf '%s\n' "$!" >"$SHI_CAPTURE_RUNTIME/x11vnc.pid"
  nohup /usr/bin/websockify --web=/usr/share/novnc "127.0.0.1:$SHI_CAPTURE_NOVNC_PORT" "127.0.0.1:$SHI_CAPTURE_VNC_PORT" >"$SHI_CAPTURE_RUNTIME/websockify.log" 2>&1 &
  printf '%s\n' "$!" >"$SHI_CAPTURE_RUNTIME/websockify.pid"
  nohup env DISPLAY="$SHI_CAPTURE_DISPLAY" PULSE_SINK="$SHI_CAPTURE_SINK" "$SHI_CAPTURE_CHROME" \
    --remote-debugging-port="$SHI_CAPTURE_CDP_PORT" \
    --remote-debugging-address=127.0.0.1 \
    --user-data-dir="$SHI_CAPTURE_RUNTIME/profile" \
    --no-first-run --disable-sync --disable-features=Translate \
    --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
    --window-position=0,0 --window-size=1600,1000 "$SHI_CAPTURE_APP_URL" >"$SHI_CAPTURE_RUNTIME/chrome.log" 2>&1 &
  printf '%s\n' "$!" >"$SHI_CAPTURE_RUNTIME/chrome.pid"

  wait_http "http://127.0.0.1:$SHI_CAPTURE_NOVNC_PORT/vnc.html"
  wait_http "http://127.0.0.1:$SHI_CAPTURE_CDP_PORT/json/version"
  local chrome_pid window_id
  chrome_pid=$(<"$SHI_CAPTURE_RUNTIME/chrome.pid")
  window_id=""
  for _ in $(seq 1 80); do
    window_id=$(DISPLAY="$SHI_CAPTURE_DISPLAY" xdotool search --onlyvisible --pid "$chrome_pid" 2>/dev/null | head -n 1 || true)
    test -n "$window_id" && break
    sleep .25
  done
  if test -z "$window_id"; then printf 'Chrome window did not become visible.\n' >&2; exit 1; fi
  DISPLAY="$SHI_CAPTURE_DISPLAY" xdotool windowmove --sync "$window_id" 0 0
  DISPLAY="$SHI_CAPTURE_DISPLAY" xdotool windowsize --sync "$window_id" 1600 1000
  status
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *) printf 'Usage: %s {start|status|stop}\n' "$0" >&2; exit 2 ;;
esac
