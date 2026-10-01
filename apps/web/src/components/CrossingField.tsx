import { useId } from "react";
import type { EngagementState, Locale } from "@shi/game-core";
import field from "../../../../content/presentation/crossing-field.v1.json";
import { engagementMetricLabels } from "../engagement-i18n";
import "./CrossingField.css";

export function crossingFieldProjection(metrics: EngagementState["metrics"]) {
  const index = (key: keyof typeof metrics) => Number.isFinite(metrics[key]) ? Math.max(0, Math.min(100, metrics[key])) : 0;
  return {
    progressX: field.route.startX + (field.route.endX - field.route.startX) * index("crossingProgress") / 100,
    rearSpread: field.rear.minimumSpread + (field.rear.maximumSpread - field.rear.minimumSpread) * (1 - index("rearCohesion") / 100),
    pursuitX: field.pursuit.startX + (field.pursuit.endX - field.pursuit.startX) * index("pursuitClosure") / 100,
  };
}

/** Presentation only: no orders, timers, randomness or campaign/save API. */
export function CrossingField({ metrics, locale }: { metrics: EngagementState["metrics"]; locale: Locale }) {
  const id = useId(), labels = field.labels[locale], color = field.palette;
  const view = crossingFieldProjection(metrics);
  const keys = ["crossingProgress", "rearCohesion", "pursuitClosure"] as const;
  return <figure className="crossing-field" data-testid="crossing-field" aria-labelledby={id}>
    <figcaption id={id}>{labels.title}</figcaption>
    <div className="crossing-field-banks" dir="ltr"><span>{labels.nearBank}</span><span>{labels.farBank}</span></div>
    <svg viewBox="0 0 100 60" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <rect width="100" height="60" rx="3" fill={color.ground} />
      <path d="M4 6 Q22 0 42 8 L40 54 Q20 61 4 52Z M62 6 Q82 0 96 8 L96 53 Q76 61 62 51Z" fill={color.bank} />
      <rect x={field.river.left} width={field.river.right - field.river.left} height="60" fill={color.water} />
      {[10, 19, 40, 49].map(y => <path key={y} d={`M47 ${y}q4 2 9 0`} fill="none" stroke={color.flow} strokeWidth=".35" />)}
      <path d={`M${field.route.startX} ${field.route.y}H${field.route.endX}`} fill="none" stroke={color.route} strokeWidth=".5" strokeDasharray="1 1.5" />
      <g className="crossing-field-marker" style={{ transform: `translate(${view.progressX}px, ${field.route.y}px)` }} data-field-progress={view.progressX}>
        <circle r="4.2" fill={color.route} /><text y="1.5" textAnchor="middle" fill={color.ink}>1</text>
      </g>
      {[-1, 0, 1].flatMap(column => [-1, 1].map(row => <rect key={`${column}-${row}`}
        x={field.rear.x + column * view.rearSpread - 1} y={field.rear.y + row * view.rearSpread / 2 - 1}
        width="2" height="2" rx=".3" fill={color.rear} />))}
      <text x={field.rear.x} y="57" textAnchor="middle" fill={color.rear}>2</text>
      <g className="crossing-field-marker" style={{ transform: `translate(${view.pursuitX}px, ${field.pursuit.y}px)` }} data-field-pursuit={view.pursuitX}>
        <path d="M-4-3L4 0L-4 3Z" fill={color.pursuit} /><text x="-1.5" y="8" textAnchor="middle" fill={color.pursuit}>3</text>
      </g>
    </svg>
    <ol className="crossing-field-legend">{keys.map((key, index) => <li key={key}>
      <span aria-hidden="true">{index + 1}</span> {engagementMetricLabels[locale][key]} <strong dir="ltr">{metrics[key]}/100</strong>
    </li>)}</ol>
    <p>{labels.boundary}</p>
  </figure>;
}
