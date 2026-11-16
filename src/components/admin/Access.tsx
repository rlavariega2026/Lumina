import { useEffect, useState } from 'react';
import { Account, sessionAction } from '../../services/session';

const logo = `${import.meta.env.BASE_URL}lav-digital.png`;
const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2';
const button = 'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold';

export function Login({ onLogin }: { onLogin: (user: Account) => void }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  return <main className="grid min-h-dvh place-items-center bg-[#FDFBF7] p-4">
    <form className="w-full max-w-sm space-y-4 rounded-3xl border border-stone-200 bg-white p-7 shadow-sm" onSubmit={async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setPending(true);
      setError('');
      try {
        const result = await sessionAction('login', { username: String(form.get('username')).trim(), password: form.get('password') });
        onLogin(result.user);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : 'No se pudo iniciar sesión');
      } finally {
        setPending(false);
      }
    }}>
      <img src={logo} alt="LAV Digital MKT" className="mx-auto h-16 w-auto object-contain" />
      <h1 className="text-center font-serif text-2xl font-bold">Lumina Studio</h1>
      <label className="block">Usuario<input className={field} name="username" autoComplete="username" required /></label>
      <label className="block">Contraseña<input className={field} name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Ingresando…' : 'Iniciar sesión'}</button>
    </form>
  </main>;
}

export function AccountPanel({ onClose }: { onClose: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);
  const refresh = async () => setAccounts((await sessionAction('users')).users);
  useEffect(() => { void refresh().catch(error => setError(error.message)); }, []);
  async function change(action: string, details: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      await sessionAction(action, details);
      setSelected(null);
      if (action === 'password' && details.username === 'lavariega') {
        window.dispatchEvent(new Event('lav-session-expired'));
      } else await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'La operación falló');
    } finally {
      setBusy(false);
    }
  }
  return <div role="dialog" aria-modal="true" aria-label="Administración de usuarios" className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
    <section className="max-h-[90dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-bold">Administración de usuarios</h2><button className={button} onClick={onClose}>Cerrar</button></div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <form className="grid gap-2 sm:grid-cols-3" onSubmit={event => {
        event.preventDefault();
        const form = event.currentTarget;
        void change('create', Object.fromEntries(new FormData(form))).then(() => form.reset());
      }}>
        <input name="username" className={field} placeholder="Usuario" aria-label="Usuario nuevo" required pattern="[a-zA-Z0-9_\x2d]{3,40}" />
        <input name="name" className={field} placeholder="Nombre" aria-label="Nombre" required />
        <input name="password" className={field} placeholder="Contraseña" aria-label="Contraseña inicial" type="password" minLength={12} required />
        <button disabled={busy} className={button}>Crear usuario</button>
      </form>
      {accounts.map(account => <div className="space-y-2 rounded-xl border border-stone-200 p-3" key={account.username}>
        <p className="font-semibold">{account.name} · {account.username}</p>
        <p className="text-sm">{account.role === 'superadmin' ? 'Superadministrador' : account.active ? 'Activo' : 'Suspendido'}</p>
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy} onClick={() => setSelected(account)}>Editar cuenta</button>
          {account.role !== 'superadmin' && <>
            <button className={button} disabled={busy} onClick={() => void change(account.active ? 'suspend' : 'activate', { username: account.username })}>{account.active ? 'Suspender' : 'Activar'}</button>
            <button className={button} disabled={busy} onClick={() => { if (confirm(`¿Eliminar a ${account.username}?`)) void change('delete', { username: account.username }); }}>Eliminar</button>
          </>}
        </div>
        {selected?.username === account.username && <>
          {account.role !== 'superadmin' && <form className="flex gap-2" onSubmit={event => {
            event.preventDefault();
            void change('update', { username: account.username, name: new FormData(event.currentTarget).get('name') });
          }}><input name="name" aria-label="Nombre de la cuenta" defaultValue={account.name} className={field} required /><button className={button} disabled={busy}>Guardar nombre</button></form>}
          <form className="flex gap-2" onSubmit={event => {
            event.preventDefault();
            void change('password', { username: account.username, password: new FormData(event.currentTarget).get('password') });
          }}><input name="password" aria-label="Nueva contraseña" placeholder="Nueva contraseña" type="password" minLength={12} required className={field} /><button className={button} disabled={busy}>Cambiar contraseña</button></form>
        </>}
      </div>)}
    </section>
  </div>;
}
