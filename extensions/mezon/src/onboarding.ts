import type { ChannelOnboardingAdapter, MoltbotConfig, WizardPrompter } from "clawdbot/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "clawdbot/plugin-sdk";

import {
  listMezonAccountIds,
  resolveDefaultMezonAccountId,
  resolveMezonAccount,
} from "./mezon/accounts.js";
import { promptAccountId } from "./onboarding-helpers.js";

const channel = "mezon" as const;

async function noteMezonSetup(prompter: WizardPrompter): Promise<void> {
  await prompter.note(
    [
      "1) Go to https://mezon.ai/developers/applications",
      "2) Create a bot application + copy its token",
      "Tip: the bot must be added to any clan/channel you want it to monitor.",
      "Docs: https://docs.molt.bot/channels/mezon",
    ].join("\n"),
    "Mezon bot token",
  );
}

export const mezonOnboardingAdapter: ChannelOnboardingAdapter = {
  channel,
  getStatus: async ({ cfg }) => {
    const configured = listMezonAccountIds(cfg).some((accountId) => {
      const account = resolveMezonAccount({ cfg, accountId });
      return Boolean(account.token);
    });
    return {
      channel,
      configured,
      statusLines: [`Mezon: ${configured ? "configured" : "needs token"}`],
      selectionHint: configured ? "configured" : "needs setup",
      quickstartScore: configured ? 2 : 1,
    };
  },
  configure: async ({ cfg, prompter, accountOverrides, shouldPromptAccountIds }) => {
    const override = accountOverrides.mezon?.trim();
    const defaultAccountId = resolveDefaultMezonAccountId(cfg);
    let accountId = override ? normalizeAccountId(override) : defaultAccountId;
    if (shouldPromptAccountIds && !override) {
      accountId = await promptAccountId({
        cfg,
        prompter,
        label: "Mezon",
        currentId: accountId,
        listAccountIds: listMezonAccountIds,
        defaultAccountId,
      });
    }

    let next = cfg;
    const resolvedAccount = resolveMezonAccount({
      cfg: next,
      accountId,
    });
    const accountConfigured = Boolean(resolvedAccount.token);
    const allowEnv = accountId === DEFAULT_ACCOUNT_ID;
    const canUseEnv =
      allowEnv &&
      Boolean(process.env.MEZON_TOKEN?.trim());
    const hasConfigValues = Boolean(resolvedAccount.config.token);

    let token: string | null = null;

    if (!accountConfigured) {
      await noteMezonSetup(prompter);
    }

    if (canUseEnv && !hasConfigValues) {
      const keepEnv = await prompter.confirm({
        message: "MEZON_TOKEN detected. Use env var?",
        initialValue: true,
      });
      if (!keepEnv) {
        token = String(
          await prompter.text({
            message: "Enter Mezon bot token",
            validate: (value) => (value?.trim() ? undefined : "Required"),
          }),
        ).trim();
      } else {
        next = {
          ...next,
          channels: {
            ...next.channels,
            mezon: {
              ...next.channels?.mezon,
              enabled: true,
            },
          },
        };
      }
    } else if (accountConfigured) {
      const keep = await prompter.confirm({
        message: "Mezon credentials already configured. Keep them?",
        initialValue: true,
      });
      if (!keep) {
        token = String(
          await prompter.text({
            message: "Enter Mezon bot token",
            validate: (value) => (value?.trim() ? undefined : "Required"),
          }),
        ).trim();
      }
    } else {
      token = String(
        await prompter.text({
          message: "Enter Mezon bot token",
          validate: (value) => (value?.trim() ? undefined : "Required"),
        }),
      ).trim();
    }

    if (token) {
      if (accountId === DEFAULT_ACCOUNT_ID) {
        next = {
          ...next,
          channels: {
            ...next.channels,
            mezon: {
              ...next.channels?.mezon,
              enabled: true,
              token,
            },
          },
        };
      } else {
        next = {
          ...next,
          channels: {
            ...next.channels,
            mezon: {
              ...next.channels?.mezon,
              enabled: true,
              accounts: {
                ...next.channels?.mezon?.accounts,
                [accountId]: {
                  ...next.channels?.mezon?.accounts?.[accountId],
                  enabled: next.channels?.mezon?.accounts?.[accountId]?.enabled ?? true,
                  token,
                },
              },
            },
          },
        };
      }
    }

    return { cfg: next, accountId };
  },
  disable: (cfg: MoltbotConfig) => ({
    ...cfg,
    channels: {
      ...cfg.channels,
      mezon: { ...cfg.channels?.mezon, enabled: false },
    },
  }),
};
