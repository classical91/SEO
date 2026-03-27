export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function severityTone(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}
