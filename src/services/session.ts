const base = `${import.meta.env.BASE_URL}api.php?r=auth`;

export interface Account {
  username: string;
  name: string;
  role: 'superadmin' | 'editor';
  active?: boolean;
}

let csrf = '';

export async function sessionFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (csrf) headers.set('X-LAV-CSRF', csrf);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && csrf) {
    csrf = '';
    window.dispatchEvent(new Event('lav-session-expired'));
  }
  return response;
}

export async function sessionAction(action: string, payload?: Record<string, unknown>) {
  const response = await sessionFetch(payload ? base : `${base}&action=${action}`, payload ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la operación');
  if (typeof result.csrf === 'string') csrf = result.csrf;
  if (action === 'logout') csrf = '';
  return result;
}
