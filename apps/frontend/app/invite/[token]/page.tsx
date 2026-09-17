"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/components/auth-provider";
import { useBackendUrl } from "@/app/client-context";
import { optionalFetcher, joinUrl } from "@/lib/utils";
import { writeAt } from "@/lib/api-write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevealableInput } from "@/components/ui/revealable-input";
import { Label } from "@/components/ui/label";
import type { InvitationLinkResolution } from "@platypus/schemas";

/**
 * Redeems an invitation link (#549, ADR-0019). Three arrival states,
 * decided by session vs. the invited address:
 *
 * - No session: a registration form with the email fixed (never editable —
 *   it comes from the token, not from what someone types).
 * - Signed in as the invited address: a single Accept action.
 * - Signed in as a different address: refused, with an explanation and a
 *   sign-out offer, and the Invitation stays pending.
 */
export default function InviteTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, authClient, isPending: isAuthPending } = useAuth();
  const backendUrl = useBackendUrl();

  // The token lives only in this page's own state after the first render —
  // the URL itself is scrubbed below so a bearer credential doesn't linger
  // in the address bar, browser history, or an outbound referrer header.
  const [redeemToken] = useState(token);

  useEffect(() => {
    window.history.replaceState(null, "", "/invite");
  }, []);

  const { data, error, isLoading } = useSWR<InvitationLinkResolution>(
    backendUrl && redeemToken
      ? joinUrl(backendUrl, `/invitation-links/${redeemToken}`)
      : null,
    optionalFetcher,
  );

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invalid = !isLoading && (error !== undefined || data === null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const outcome = await writeAt(
      joinUrl(backendUrl, `/invitation-links/${redeemToken}/register`),
      { method: "POST", data: { name, password } },
    );
    setIsSubmitting(false);
    if (outcome.outcome !== "success") {
      setFormError(outcome.message);
      return;
    }
    router.push("/");
  };

  const handleAccept = async () => {
    setFormError(null);
    setIsSubmitting(true);
    const outcome = await writeAt(
      joinUrl(backendUrl, `/invitation-links/${redeemToken}/accept`),
      { method: "POST" },
    );
    setIsSubmitting(false);
    if (outcome.outcome !== "success") {
      setFormError(outcome.message);
      return;
    }
    router.push("/");
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isLoading || isAuthPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  if (invalid || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8 text-center">
          <h1 className="text-2xl font-bold">Invitation not found</h1>
          <p className="text-muted-foreground">
            This invitation link is not valid. It may have already been used,
            declined, or expired. Ask whoever invited you to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // Signed in as someone other than the invited address: refuse, explain,
  // offer sign-out, and leave the Invitation pending (untouched).
  if (user && user.email !== data.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-8 text-center">
          <h1 className="text-2xl font-bold">Wrong account</h1>
          <p className="text-muted-foreground">
            This invitation to join <span className="font-bold">{data.organizationName}</span> was
            sent to <span className="font-bold">{data.email}</span>, but you
            are signed in as <span className="font-bold">{user.email}</span>.
          </p>
          <Button onClick={handleSignOut} className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // Signed in as the invited address: a single Accept action.
  if (user && user.email === data.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 p-8 text-center">
          <div>
            <h1 className="text-2xl font-bold">You&apos;re invited</h1>
            <p className="text-muted-foreground mt-2">
              Join <span className="font-bold">{data.organizationName}</span>{" "}
              as {data.email}.
            </p>
          </div>
          {formError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          <Button
            onClick={handleAccept}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Accepting…" : "Accept invitation"}
          </Button>
        </div>
      </div>
    );
  }

  // No session: a registration form with the invited email fixed.
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">You&apos;re invited</h1>
          <p className="text-muted-foreground mt-2">
            Create an account to join{" "}
            <span className="font-bold">{data.organizationName}</span>.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {formError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={data.email} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <RevealableInput
              id="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Accept invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
