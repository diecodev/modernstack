"use client";

import { Loader } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GithubIcon } from "@/components/icons/github";
import { GoogleIcon } from "@/components/icons/google";
import { LogoIcon } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/utils/auth-client";
import { cn } from "@/utils/cn";

const loginMethods = [
  {
    name: "GitHub",
    icon: GithubIcon,
    id: "github",
  },
  {
    name: "Google",
    icon: GoogleIcon,
    id: "google",
  },
];

export default function SignInForm() {
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleSignIn = async () => {
    setIsPending(true);
    await authClient.signIn.social(
      {
        provider: "github",
        requestSignUp: true,
        newUserCallbackURL: "/new",
        callbackURL: "/sign-in",
      },
      {
        onError: () => {
          setIsPending(false);
        },
      }
    );
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-12">
        <div className="flex flex-col items-center gap-2 self-center font-medium">
          <LogoIcon className="size-12" />
          <p className="text-xl">
            Welcome to <span className="font-semibold">Moick</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col items-center justify-between gap-2">
            {loginMethods.map((method) => (
              <Button
                className="w-full gap-2 rounded-xl"
                disabled={isPending}
                key={method.id}
                onClick={handleSignIn}
                type="button"
                variant="outline"
              >
                <method.icon
                  className={cn(
                    "transition-opacity duration-200",
                    isPending ? "opacity-50" : "opacity-100"
                  )}
                  height="1em"
                  width="1em"
                />
                <span
                  className={cn(
                    "transition-opacity duration-200",
                    isPending ? "opacity-70" : "opacity-100"
                  )}
                >
                  Sign in with {method.name}
                </span>
                {isPending && <Loader className="size-4 animate-spin" />}
              </Button>
            ))}
          </div>
          <div className="text-center text-muted-foreground text-xs">
            <p>
              powered by {/* @ts-ignore */}
              <Link
                className="underline"
                href="https://better-auth.com"
                target="_blank"
              >
                <span className="cursor-pointer text-foreground">
                  better-auth.
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
