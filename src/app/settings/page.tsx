import type { Metadata } from "next";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your LuminaWeb account settings, MCP API keys, and integrations.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
