import { describe, expect, it } from "vitest";
import { SAVE_KEY } from "../config";
import { clearSave, defaultSave, persistSave, readSave } from "./save";

class MemoryStorage {
  store = new Map<string, string>();
  getItem(k: string) {
    return this.store.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
}

describe("save", () => {
  it("round-trips a snapshot and falls back to backup", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const data = defaultSave();
    data.cash = 333;
    persistSave(data, storage);
    expect(readSave(storage)?.cash).toBe(333);

    storage.setItem(SAVE_KEY, "{not-json");
    expect(readSave(storage)?.cash).toBe(333);
  });

  it("clear wipes both slots", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    persistSave(defaultSave(), storage);
    clearSave(storage);
    expect(readSave(storage)).toBeNull();
  });
});
