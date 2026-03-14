export function getInitials(name: string | null | undefined, fallback = "U") {
  if (!name) return fallback;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || fallback;
}

export function getRoleAvatarColors(role: string | null | undefined) {
  if (role === "radiologist") return "bg-violet-600 text-white";
  return "bg-blue-600 text-white";
}
