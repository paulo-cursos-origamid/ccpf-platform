import { describe, expect, it } from "vitest";

import { getNotificationNavigationPath } from "./notification-navigation";

describe("getNotificationNavigationPath", () => {
  it("resolve invoice notifications", () => {
    expect(
      getNotificationNavigationPath("INVOICE", "invoice-123"),
    ).toBe("/admin/billing/invoices/invoice-123");
  });

  it("resolve account notifications", () => {
    expect(
      getNotificationNavigationPath("ACCOUNT", "account-123"),
    ).toBe("/dashboard/accounts/account-123");
  });

  it("resolve user notifications without requiring an id", () => {
    expect(
      getNotificationNavigationPath("USER", "user-123"),
    ).toBe("/dashboard/users");
  });

  it("resolve tenant notifications to the dashboard", () => {
    expect(
      getNotificationNavigationPath("TENANT", "tenant-123"),
    ).toBe("/dashboard");
  });

  it("returns null for unknown resources", () => {
    expect(
      getNotificationNavigationPath("UNKNOWN", "resource-123"),
    ).toBeNull();
  });

  it("returns null when a resource id is required but missing", () => {
    expect(
      getNotificationNavigationPath("INVOICE", null),
    ).toBeNull();

    expect(
      getNotificationNavigationPath("ACCOUNT", null),
    ).toBeNull();
  });

  it("returns null without a resource type", () => {
    expect(
      getNotificationNavigationPath(null, "resource-123"),
    ).toBeNull();
  });
});
