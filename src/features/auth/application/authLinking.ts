import { supabase } from '@/shared/infrastructure/supabase/client';

function authParamsFromUrl(url: string) {
  const queryStart = url.indexOf('?');
  const fragmentStart = url.indexOf('#');
  const query = queryStart >= 0
    ? url.slice(queryStart + 1, fragmentStart >= 0 ? fragmentStart : undefined)
    : '';
  const fragment = fragmentStart >= 0 ? url.slice(fragmentStart + 1) : '';

  return new URLSearchParams([query, fragment].filter(Boolean).join('&'));
}

export async function consumeAuthUrl(url: string) {
  const params = authParamsFromUrl(url);
  const code = params.get('code');

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) throw result.error;
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const result = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (result.error) throw result.error;
  }
}
