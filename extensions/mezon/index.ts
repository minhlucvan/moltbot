import type { MoltbotPluginApi } from "clawdbot/plugin-sdk";
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";

import { mezonPlugin } from "./src/channel.js";
import { setMezonRuntime } from "./src/runtime.js";

const plugin = {
  id: "mezon",
  name: "Mezon",
  description: "Mezon channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: MoltbotPluginApi) {
    setMezonRuntime(api.runtime);
    api.registerChannel({ plugin: mezonPlugin });
  },
};

export default plugin;
