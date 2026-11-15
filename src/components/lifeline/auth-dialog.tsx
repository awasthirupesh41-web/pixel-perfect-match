import { useState, type FormEvent } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session === null) {
          setMessage("Your account is ready. Check your email to confirm your sign-in.");
          return;
        }
        toast.success("Welcome to LifeLine");
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("You're signed in");
        onOpenChange(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't complete sign-in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "lovable") {
    setLoading(true);
    setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) onOpenChange(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't complete sign-in.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog-content sm:max-w-md">
        <DialogHeader className="text-left">
          <span className="mb-2 flex size-11 items-center justify-center rounded-md bg-secondary text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-2xl">{mode === "signin" ? "Welcome back" : "Create your account"}</DialogTitle>
          <DialogDescription>
            Save your emergency contact and reach your LifeLine dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="outline" className="auth-provider-google h-11" disabled={loading} onClick={() => void handleSocial("google")}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Continue with Google
          </Button>
          <Button variant="outline" className="h-11" disabled={loading} onClick={() => void handleSocial("lovable")}>
            Continue with Lovable
          </Button>
        </div>

        <div className="auth-divider my-5"><span>or use email</span></div>
        <form className="space-y-3" onSubmit={(event) => void handleEmail(event)}>
          {mode === "signup" && (
            <label className="block space-y-1.5 text-sm font-medium" htmlFor="lifeline-full-name">
              Full name
              <Input id="lifeline-full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
          )}
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="lifeline-email">
            Email address
            <Input id="lifeline-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="lifeline-password">
            Password
            <Input id="lifeline-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {message && <p className="rounded-md bg-secondary px-3 py-2 text-sm text-foreground" role="status">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="pt-1 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to LifeLine?" : "Already have an account?"}{" "}
          <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}