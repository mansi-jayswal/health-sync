"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { setPasswordSchema, type SetPasswordInput } from "@/types/schemas/set-password";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!code && !tokenHash) {
      supabase.auth.getSession().then(({ data }) => {
        if (!isMounted) return;
        setHasSession(Boolean(data.session));
      });

      const { data: subscription } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!isMounted) return;
          setHasSession(Boolean(session));
        }
      );

      return () => {
        isMounted = false;
        subscription.subscription.unsubscribe();
      };
    }

    const params = new URLSearchParams();
    params.set("redirectTo", ROUTES.SET_PASSWORD);
    if (code) params.set("code", code);
    if (tokenHash) params.set("token_hash", tokenHash);
    if (type) params.set("type", type);
    router.replace(`/auth/callback?${params.toString()}`);
  }, [supabase, searchParams, router]);

  if (hasSession === null) {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Set your password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Checking invite link…</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (hasSession === false) {
    return (
      <PageShell>
        <Card>
          <CardHeader>
            <CardTitle>Set your password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>This invite link is invalid or has expired.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/auth/sign-in")}
            >
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card>
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Welcome! Set your password to complete your account setup.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setErrorMessage(null);
                  const { error } = await supabase.auth.updateUser({
                    password: values.password,
                  });
                  if (error) {
                    throw error;
                  }
                  router.push("/dashboard");
                } catch (err) {
                  setErrorMessage(getErrorMessage(err, "Failed to set password."));
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <Button type="submit">Set Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
