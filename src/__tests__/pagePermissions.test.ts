import { describe, expect, it } from "vitest";
import {
  getAllPermissionKeys,
  getChildrenKeys,
  isParentKey,
  PAGE_PERMISSIONS,
  ROUTE_TO_PERMISSION,
} from "@/lib/pagePermissions";

describe("pagePermissions", () => {
  it("exposes a non-empty permission catalog", () => {
    expect(PAGE_PERMISSIONS.length).toBeGreaterThan(0);
  });

  it("getAllPermissionKeys returns both parents and children flat", () => {
    const keys = getAllPermissionKeys();
    // Every parent should be present
    for (const page of PAGE_PERMISSIONS) {
      expect(keys).toContain(page.key);
    }
    // And every child too
    for (const page of PAGE_PERMISSIONS) {
      for (const child of page.children ?? []) {
        expect(keys).toContain(child.key);
      }
    }
  });

  it("isParentKey distinguishes pages with children", () => {
    const withKids = PAGE_PERMISSIONS.find(
      (p) => p.children && p.children.length > 0,
    );
    expect(withKids).toBeDefined();
    expect(isParentKey(withKids!.key)).toBe(true);

    const leaf = PAGE_PERMISSIONS.find(
      (p) => !p.children || p.children.length === 0,
    );
    if (leaf) expect(isParentKey(leaf.key)).toBe(false);
  });

  it("getChildrenKeys returns the declared children keys", () => {
    const parent = PAGE_PERMISSIONS.find(
      (p) => p.children && p.children.length > 0,
    )!;
    const kids = getChildrenKeys(parent.key);
    expect(kids.length).toBe(parent.children!.length);
    for (const child of parent.children!) {
      expect(kids).toContain(child.key);
    }
  });

  it("all ROUTE_TO_PERMISSION values exist in the permission catalog", () => {
    const catalog = new Set(getAllPermissionKeys());
    for (const [route, perm] of Object.entries(ROUTE_TO_PERMISSION)) {
      expect(catalog.has(perm), `route ${route} -> ${perm} must exist`).toBe(true);
    }
  });
});
