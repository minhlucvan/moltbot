import type { PluginRuntime } from "clawdbot/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setMezonRuntime(next: PluginRuntime) {
  runtime = next;
}

export function getMezonRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("Mezon runtime not initialized");
  }
  return runtime;
}
