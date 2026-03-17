export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDateBetween(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

