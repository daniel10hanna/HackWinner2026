import { supabaseKey, supabaseUrl } from './feed';

export type Account = { email: string; token: string; expiresAt: number };

export async function authenticate(mode: 'signin' | 'signup', email: string, password: string): Promise<Account | null> {
  if (!supabaseUrl || !supabaseKey) throw new Error('Account access requires a connected Supabase project.');
  const endpoint = mode === 'signup' ? 'signup' : 'token?grant_type=password';
  const response = await fetch(supabaseUrl + '/auth/v1/' + endpoint, {
    method: 'POST',
    headers: { apikey: supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) {
    const message = body.msg ?? body.message ?? body.error_description;
    throw new Error(typeof message === 'string' ? message : 'Account request failed. Please try again.');
  }
  if (typeof body.access_token !== 'string' || typeof body.user?.email !== 'string') {
    if (mode === 'signup') return null;
    throw new Error('The sign-in response did not contain a session.');
  }
  return { email: body.user.email, token: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
}

export async function endSession(account: Account) {
  if (!supabaseUrl || !supabaseKey) return;
  const response = await fetch(supabaseUrl + '/auth/v1/logout?scope=local', {
    method: 'POST', headers: { apikey: supabaseKey, Authorization: 'Bearer ' + account.token },
  });
  if (!response.ok && response.status !== 401) throw new Error('The server could not confirm sign-out.');
}
