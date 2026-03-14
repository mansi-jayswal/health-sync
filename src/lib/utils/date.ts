import { formatDistanceToNow } from "date-fns";

export function relativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}
