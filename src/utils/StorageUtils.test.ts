import { describe, it, expect, vi } from "vitest";
import { StorageUtils } from "./StorageUtils";

describe("StorageUtils", () => {
  it("limpia local y session storage", () => {
    const localClear = vi.spyOn(Storage.prototype, "clear");
    StorageUtils.clearAllStorage();
    expect(localClear).toHaveBeenCalled();
    localClear.mockRestore();
  });
});
