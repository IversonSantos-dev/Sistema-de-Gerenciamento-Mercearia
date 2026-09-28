import { describe, expect, it } from "vitest";
import { can, defaultUserPermissions, fullPermissions, normalizePermissions } from "./auth/permissions";

describe("permissões granulares", () => {
  it("separa consulta de edição para operadores", () => {
    const permissions = defaultUserPermissions();
    expect(can(permissions, "user", "products", "read")).toBe(true);
    expect(can(permissions, "user", "products", "edit")).toBe(false);
    expect(can(permissions, "user", "pos", "edit")).toBe(true);
  });

  it("concede acesso total ao administrador legado sem matriz", () => {
    expect(can(null, "admin", "users", "read")).toBe(true);
    expect(can(null, "admin", "settings", "edit")).toBe(true);
  });

  it("normaliza matrizes parciais sem liberar módulos ausentes", () => {
    const permissions = normalizePermissions({ products: { read: true, edit: false } }, "user");
    expect(permissions.products).toEqual({ read: true, edit: false });
    expect(permissions.nfe).toEqual({ read: false, edit: false });
  });

  it("gera matriz completa para administradores novos", () => {
    expect(Object.values(fullPermissions()).every(value => value.read && value.edit)).toBe(true);
  });
});
