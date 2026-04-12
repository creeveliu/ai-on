export function isDbReachabilityError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: string }).code;
  if (maybeCode === "P1001") {
    return true;
  }

  const message = (error as { message?: string }).message ?? "";
  return typeof message === "string" && message.includes("Can't reach database server");
}
