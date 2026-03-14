interface AuthUserLike {
  email?: string | null;
  user_metadata?: unknown;
}

export function inferUserName(
  user: AuthUserLike,
  fallback = "Donatur",
): string {
  const metadata =
    typeof user.user_metadata === "object" && user.user_metadata !== null
      ? (user.user_metadata as Record<string, unknown>)
      : undefined;

  return (
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    user.email?.split("@")[0] ||
    fallback
  );
}
