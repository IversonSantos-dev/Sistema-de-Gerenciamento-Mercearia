export const PERMISSION_MODULES = ["dashboard", "pos", "products", "stock", "plu", "nfe", "cash", "users", "settings"] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = "read" | "edit";
export type PermissionSet = Record<PermissionModule, { read: boolean; edit: boolean }>;

const allAccess = () => ({ read: true, edit: true });

export function fullPermissions(): PermissionSet {
  return Object.fromEntries(PERMISSION_MODULES.map(module => [module, allAccess()])) as PermissionSet;
}

export function defaultUserPermissions(): PermissionSet {
  const permissions = Object.fromEntries(PERMISSION_MODULES.map(module => [module, { read: false, edit: false }])) as PermissionSet;
  permissions.dashboard.read = true;
  permissions.pos.read = true;
  permissions.pos.edit = true;
  permissions.products.read = true;
  permissions.stock.read = true;
  permissions.cash.read = true;
  return permissions;
}

export function normalizePermissions(value: unknown, role: "user" | "admin" = "user"): PermissionSet {
  if (role === "admin" && (value == null || typeof value !== "object")) return fullPermissions();
  const fallback = role === "admin" ? fullPermissions() : defaultUserPermissions();
  if (!value || typeof value !== "object") return fallback;
  const source = value as Record<string, unknown>;
  for (const module of PERMISSION_MODULES) {
    const entry = source[module];
    if (!entry || typeof entry !== "object") continue;
    const actions = entry as Record<string, unknown>;
    fallback[module] = { read: actions.read === true, edit: actions.edit === true };
  }
  return fallback;
}

export function can(permissionSet: unknown, role: "user" | "admin", module: PermissionModule, action: PermissionAction) {
  if (role === "admin" && permissionSet == null) return true;
  const permissions = normalizePermissions(permissionSet, role);
  return permissions[module][action] === true || (action === "read" && permissions[module].edit === true);
}
