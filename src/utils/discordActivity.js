import { DiscordSDK } from '@discord/embedded-app-sdk';

let discordSdk = null;
let activityUser = null;
let isDiscordActivity = false;

function detectDiscordActivity() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('frame_id') || params.get('instance_id') || params.get('platform')) {
      return true;
    }
    if (window.self !== window.top) {
      const referrer = document.referrer || '';
      if (referrer.includes('discord.com') || referrer.includes('discordsays.com')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function initDiscordActivity() {
  if (!detectDiscordActivity()) {
    console.log('[Discord Activity] Not running inside Discord, skipping SDK init');
    return null;
  }

  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1472444305187668009';

  try {
    discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();
    isDiscordActivity = true;
    console.log('[Discord Activity] SDK ready, running inside Discord');

    const { code } = await discordSdk.commands.authorize({
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });

    const tokenRes = await fetch('/.proxy/api/discord/activity-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!tokenRes.ok) {
      console.error('[Discord Activity] Token exchange failed');
      return { sdk: discordSdk, user: null };
    }

    const { access_token, user } = await tokenRes.json();

    const auth = await discordSdk.commands.authenticate({ access_token });
    activityUser = auth.user || user;

    console.log('[Discord Activity] Authenticated as', activityUser?.username);
    return { sdk: discordSdk, user: activityUser };
  } catch (err) {
    console.error('[Discord Activity] Init error:', err);
    isDiscordActivity = detectDiscordActivity();
    return discordSdk ? { sdk: discordSdk, user: null } : null;
  }
}

export function getDiscordSdk() {
  return discordSdk;
}

export function getActivityUser() {
  return activityUser;
}

export function isRunningInDiscord() {
  return isDiscordActivity;
}

export function getDiscordActivityLayout() {
  if (!discordSdk) return null;
  return discordSdk.layout;
}
