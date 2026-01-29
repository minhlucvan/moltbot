import { MezonClient } from "mezon-sdk";

export type MezonBotClient = {
  client: MezonClient;
  token: string;
};

export type MezonUser = {
  id: string;
  username?: string | null;
  display_name?: string | null;
};

export type MezonChannelInfo = {
  id: string;
  channel_label?: string | null;
  channel_type?: number | null;
  clan_id?: string | null;
};

export type MezonMessage = {
  message_id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  clan_id?: string;
  is_public?: boolean;
  mode?: number;
  attachments?: MezonAttachment[];
  mentions?: MezonMention[];
  references?: MezonReference[];
  create_time?: string;
};

export type MezonAttachment = {
  url?: string;
  filename?: string;
  filetype?: string;
  size?: number;
};

export type MezonMention = {
  user_id?: string;
  username?: string;
  role_id?: string;
  s?: number;
  e?: number;
};

export type MezonReference = {
  message_id?: string;
  message_ref_id?: string;
  ref_type?: number;
  message_sender_id?: string;
  content?: string;
};

export function createMezonBotClient(token: string): MezonBotClient {
  if (!token.trim()) throw new Error("Mezon bot token is required");
  const client = new MezonClient(token.trim());
  return { client, token: token.trim() };
}

export async function loginMezonClient(botClient: MezonBotClient): Promise<void> {
  await botClient.client.login();
}

export async function fetchMezonBotUser(botClient: MezonBotClient): Promise<MezonUser | null> {
  try {
    const session = (botClient.client as Record<string, unknown>).session as
      | { user_id?: string; username?: string }
      | undefined;
    if (session?.user_id) {
      return {
        id: session.user_id,
        username: session.username ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Send a message to a Mezon channel.
 */
export async function sendMezonChannelMessage(
  botClient: MezonBotClient,
  params: {
    channelId: string;
    clanId?: string;
    message: string;
    mode?: number;
    isPublic?: boolean;
    replyToId?: string;
  },
): Promise<{ message_id?: string }> {
  const content: Record<string, unknown> = { t: params.message };
  const references =
    params.replyToId
      ? [{ message_ref_id: params.replyToId, ref_type: 0 }]
      : undefined;

  const channel = await botClient.client.channels.fetch(params.channelId);
  const result = await channel.send(
    content,
    undefined, // mentions
    undefined, // attachments
    references,
  );
  return { message_id: (result as Record<string, unknown>)?.message_id as string | undefined };
}

/**
 * Send a DM to a Mezon user.
 */
export async function sendMezonDM(
  botClient: MezonBotClient,
  params: {
    userId: string;
    clanId: string;
    message: string;
    replyToId?: string;
  },
): Promise<{ message_id?: string }> {
  const content: Record<string, unknown> = { t: params.message };
  const references =
    params.replyToId
      ? [{ message_ref_id: params.replyToId, ref_type: 0 }]
      : undefined;

  const clan = await botClient.client.clans.fetch(params.clanId);
  const user = await clan.users.fetch(params.userId);
  const result = await user.sendDM(
    content,
    undefined, // mentions
    undefined, // attachments
    references,
  );
  return { message_id: (result as Record<string, unknown>)?.message_id as string | undefined };
}
