const KEY = "nicelist.returnTo";

export function rememberReturnTo(path: string) {
  if (path.startsWith("/")) sessionStorage.setItem(KEY, path);
}

export function clearReturnTo() {
  sessionStorage.removeItem(KEY);
}

export function consumeReturnTo() {
  const value = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/list";
}
