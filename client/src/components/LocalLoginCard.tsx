import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, LockKeyhole, Store, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function LocalLoginCard() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const { data: status, isLoading } = trpc.auth.localStatus.useQuery(undefined, { retry: false });
  const login = trpc.auth.loginLocal.useMutation();
  const setup = trpc.auth.setupLocalAdmin.useMutation();
  const utils = trpc.useUtils();
  const isSetup = status?.configured === false;
  const ownerAssistedSetup = isSetup && status?.ownerAssistedSetup === true;
  const busy = login.isPending || setup.isPending;

  async function completeAccess() {
    await utils.auth.me.invalidate();
    window.location.assign("/");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSetup) {
      if (password !== passwordConfirmation) { toast.error("A confirmação deve ser igual à senha."); return; }
      try {
        await setup.mutateAsync({ name, username, password, setupKey: ownerAssistedSetup ? undefined : setupKey });
        await completeAccess();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível configurar o acesso."); }
      return;
    }
    try {
      await login.mutateAsync({ username, password });
      await completeAccess();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível entrar."); }
  }

  return <main className="min-h-screen grid place-items-center bg-[#f7f8f5] px-5 py-8"><section className="w-full max-w-md overflow-hidden rounded-3xl border border-[#dfe4d9] bg-white shadow-[0_16px_50px_rgba(32,45,28,0.08)]"><div className="border-b border-[#e8ece6] px-7 pb-6 pt-8 text-center"><div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#193c32] text-[#d7f0b5]"><Store className="size-6"/></div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7163]">Mercearia PDV</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#15261f]">{isLoading ? "Verificando acesso" : isSetup ? "Configure o primeiro acesso" : "Acesse sua operação"}</h1><p className="mt-2 text-sm leading-6 text-[#64736b]">{isSetup ? "Crie a credencial do administrador para proteger produtos, estoque e caixa." : "Entre com a credencial local cadastrada para operar o PDV."}</p></div>{isLoading ? <div className="grid h-72 place-items-center"><Loader2 className="size-5 animate-spin text-[#4d6a5b]"/></div> : <form onSubmit={event => void submit(event)} className="space-y-4 px-7 py-6">{isSetup && <div className="space-y-1.5"><Label htmlFor="login-name">Nome do administrador</Label><Input id="login-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Ex.: João da Silva" className="h-11" required/></div>}<div className="space-y-1.5"><Label htmlFor="login-username">Usuário</Label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718278]"/><Input id="login-username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Ex.: operador" className="h-11 pl-9" required/></div><p className="text-xs text-[#748279]">Use letras, números, ponto, hífen ou sublinhado.</p></div><div className="space-y-1.5"><Label htmlFor="login-password">Senha</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718278]"/><Input id="login-password" value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete={isSetup ? "new-password" : "current-password"} placeholder={isSetup ? "Mínimo de 12 caracteres" : "Sua senha"} className="h-11 pl-9" required/></div></div>{isSetup && <><div className="space-y-1.5"><Label htmlFor="login-password-confirmation">Confirmar senha</Label><Input id="login-password-confirmation" value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} type="password" autoComplete="new-password" className="h-11" required/></div>{ownerAssistedSetup ? <p className="rounded-xl border border-[#d9e7d4] bg-[#f2f8ee] px-3 py-2.5 text-xs leading-5 text-[#46634f]">A sessão do proprietário está ativa. A chave de ativação não é necessária nesta configuração.</p> : <div className="space-y-1.5"><Label htmlFor="login-setup-key">Chave de ativação</Label><div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718278]"/><Input id="login-setup-key" value={setupKey} onChange={event => setSetupKey(event.target.value)} type="password" autoComplete="off" placeholder="Chave definida na configuração" className="h-11 pl-9" required/></div><p className="text-xs leading-5 text-[#748279]">Esta chave é usada apenas para liberar a criação do primeiro administrador.</p></div>}</>}<Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-xl bg-[#193c32] font-semibold hover:bg-[#245542]">{busy ? <Loader2 className="mr-2 size-4 animate-spin"/> : <KeyRound className="mr-2 size-4"/>}{isSetup ? "Criar acesso administrativo" : "Entrar no sistema"}</Button>{!isSetup && <p className="rounded-xl bg-[#f4f7f2] px-3 py-2.5 text-center text-xs leading-5 text-[#66776d]">Após cinco tentativas incorretas, o acesso é bloqueado temporariamente por segurança.</p>}</form>}</section></main>;
}
