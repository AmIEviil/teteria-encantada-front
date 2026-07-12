import { describe, it, expect } from "vitest";
import { roles } from "./role.utils";

describe("roles", () => {
  it("expone los roles del sistema", () => {
    expect(roles.SUPER_ADMIN).toBe("Superadmin");
    expect(roles.ADMIN).toBe("Admin");
    expect(roles.CLIENT).toBe("Cliente");
    expect(roles.TEC).toBe("Tecnico");
  });
});
