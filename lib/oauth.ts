import { siteUrl } from "@/lib/site";

export type OAuthProvider = "github" | "linkedin" | "google";

type ProviderConfig = {
  id: string;
  secret: string;
  auth: string;
  token: string;
  scope: string;
};

export function oauthProviders(): Record<OAuthProvider, ProviderConfig | null> {
  const githubId = (process.env.GITHUB_CLIENT_ID || "").trim();
  const githubSecret = (process.env.GITHUB_CLIENT_SECRET || "").trim();
  const linkedinId = (process.env.LINKEDIN_CLIENT_ID || "").trim();
  const linkedinSecret = (process.env.LINKEDIN_CLIENT_SECRET || "").trim();
  const googleId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const googleSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

  return {
    github:
      githubId && githubSecret
        ? {
            id: githubId,
            secret: githubSecret,
            auth: "https://github.com/login/oauth/authorize",
            token: "https://github.com/login/oauth/access_token",
            scope: "read:user user:email",
          }
        : null,
    linkedin:
      linkedinId && linkedinSecret
        ? {
            id: linkedinId,
            secret: linkedinSecret,
            auth: "https://www.linkedin.com/oauth/v2/authorization",
            token: "https://www.linkedin.com/oauth/v2/accessToken",
            scope: "openid profile email",
          }
        : null,
    google:
      googleId && googleSecret
        ? {
            id: googleId,
            secret: googleSecret,
            auth: "https://accounts.google.com/o/oauth2/v2/auth",
            token: "https://oauth2.googleapis.com/token",
            scope: "openid email profile",
          }
        : null,
  };
}

export function oauthCallbackUrl(provider: OAuthProvider) {
  return `${siteUrl()}/api/auth/oauth/${provider}/callback`;
}

export type OAuthProfile = {
  provider: OAuthProvider;
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  profileUrl?: string | null;
};

export async function fetchOAuthProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
  if (provider === "github") {
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "User-Agent": "wova" },
    });
    const user = (await userRes.json()) as { id?: number; login?: string; name?: string; email?: string; avatar_url?: string; html_url?: string };
    let email = (user.email || "").toLowerCase();
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "User-Agent": "wova" },
      });
      const emails = (await emailsRes.json()) as { email?: string; primary?: boolean; verified?: boolean }[];
      const pick = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified) || emails[0];
      email = (pick?.email || "").toLowerCase();
    }
    if (!email) throw new Error("GitHub did not return an email. Make your GitHub email visible or add a public email.");
    return {
      provider,
      id: String(user.id || user.login),
      email,
      name: user.name || user.login || "GitHub user",
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
    };
  }

  if (provider === "linkedin") {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as { sub?: string; email?: string; name?: string; picture?: string };
    const email = (data.email || "").toLowerCase();
    if (!email) throw new Error("LinkedIn did not return an email address.");
    return {
      provider,
      id: String(data.sub || email),
      email,
      name: data.name || "LinkedIn user",
      avatarUrl: data.picture,
      profileUrl: `https://www.linkedin.com/in/${data.sub || ""}`,
    };
  }

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { sub?: string; email?: string; name?: string; picture?: string };
  const email = (data.email || "").toLowerCase();
  if (!email) throw new Error("Google did not return an email address.");
  return {
    provider,
    id: String(data.sub || email),
    email,
    name: data.name || "Google user",
    avatarUrl: data.picture,
  };
}

export async function exchangeOAuthCode(provider: OAuthProvider, code: string) {
  const config = oauthProviders()[provider];
  if (!config) throw new Error(`${provider} sign-in is not configured.`);
  const body = new URLSearchParams({
    client_id: config.id,
    client_secret: config.secret,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthCallbackUrl(provider),
  });
  const response = await fetch(config.token, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || `Could not complete ${provider} sign-in.`);
  }
  return data.access_token;
}
