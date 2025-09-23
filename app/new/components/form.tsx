/** biome-ignore-all lint/style/noMagicNumbers: base animation constant */
"use client";

import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { Loader } from "lucide-react";
import { m } from "motion/react";
import { use, useRef } from "react";
import { safeParse } from "valibot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTypedRouter } from "@/hooks/use-typed-router";
import { authClient } from "@/utils/auth-client";
import {
  organizationSchema,
  type TOrganizationSchema,
} from "@/validators/organization";
import type { getUser } from "../page";

export function FieldInfo({
  field,
  defaultValue,
}: {
  field: AnyFieldApi;
  defaultValue?: string;
}) {
  const { isTouched, isValid, errors } = field.state.meta;

  if (isTouched && !isValid) {
    return (
      <div className="text-left">
        <span className="mt-2 text-[0.7rem] text-destructive">
          {typeof errors[0] === "string" ? errors[0] : errors[0]?.message}
        </span>
      </div>
    );
  }

  if (defaultValue) {
    return (
      <div className="text-left">
        <span className="mt-2 text-[0.7rem] text-muted-foreground">
          {defaultValue}
        </span>
      </div>
    );
  }

  return null;
}

const handleOrganizationSubmit = async (value: TOrganizationSchema) => {
  const data = await authClient.getSession();

  const isValidSlug = await authClient.organization.checkSlug({
    slug: value.slug,
  });

  if (isValidSlug.error || !isValidSlug.data?.status) {
    return {
      fields: {
        slug: "This organization URL is already taken.",
      },
    };
  }

  const response = await authClient.organization.create({
    name: value.name,
    slug: value.slug,
    keepCurrentActiveOrganization: false,
    userId: data?.data?.session.userId,
  });

  if (response.error) {
    return {
      fields: {
        name: "This organization name is already taken.",
      },
    };
  }

  return response.data;
};

export function NewOrganizationForm({
  user,
}: {
  user: ReturnType<typeof getUser>;
}) {
  const router = useTypedRouter();
  const { data } = use(user);
  const slugRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    validators: {
      onChange: organizationSchema,
      onSubmitAsync: async ({ value }) => {
        const response = await handleOrganizationSubmit(value);

        if ("fields" in response) {
          return response;
        }

        await authClient.getSession({ query: { disableCookieCache: true } });

        return router.replace("/o/[org-slug]", {
          params: { "org-slug": response.slug },
        });
      },
    },
    asyncDebounceMs: 500,
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  // Animation timing constants for consistency (faster)
  const baseDuration = 1;
  const baseEase = [0.4, 0, 0.2, 1] as const;

  return (
    <div className="flex min-h-svh min-w-svw flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col gap-8 text-center">
        <header className="space-y-6">
          <m.h3
            animate={{ opacity: 1, y: 0 }}
            className="scroll-m-20 font-medium text-2xl tracking-tight"
            initial={{ opacity: 0, y: -18 }}
            transition={{
              duration: baseDuration,
              ease: baseEase,
              delay: 0.03,
            }}
          >
            Create a new organization
          </m.h3>
          <m.p
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0, y: -18 }}
            transition={{
              duration: baseDuration * 0.9,
              ease: baseEase,
              delay: 0.09,
            }}
          >
            Organizations are secure workspaces to manage documents, templates,
            e-signatures, and team collaboration.
          </m.p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <m.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            initial={{ opacity: 0, y: -16 }}
            transition={{
              duration: baseDuration,
              ease: baseEase,
              delay: 0.16,
            }}
          >
            <Card className="rounded-xl">
              <CardContent className="space-y-8">
                <form.Field
                  listeners={{
                    onChange: ({ value }) => {
                      const newValue = safeParse(
                        organizationSchema.entries.name,
                        value
                      );

                      form.setFieldValue("name", newValue.output as string);
                    },
                  }}
                  name="name"
                >
                  {(field) => (
                    <div>
                      <Label className="mb-3 font-normal" htmlFor={field.name}>
                        Organization Name
                      </Label>
                      <Input
                        autoComplete="off"
                        autoCorrect="off"
                        className="rounded-xl"
                        id={field.name}
                        name={field.name}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={`${data?.user?.name}'s Organization`}
                        value={field.state.value}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  listeners={{
                    onChange: ({ value }) => {
                      const newValue = safeParse(
                        organizationSchema.entries.slug,
                        value
                      );

                      form.setFieldValue("slug", newValue.output as string);
                    },
                  }}
                  name="slug"
                >
                  {(field) => (
                    <div>
                      <Label className="mb-3 font-normal" htmlFor={field.name}>
                        Organization URL
                      </Label>
                      <div className="relative">
                        <span
                          className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 transform select-none text-muted-foreground text-xs"
                          ref={slugRef}
                        >
                          moick.me/
                        </span>
                        <Input
                          autoComplete="off"
                          autoCorrect="off"
                          className="!text-xs rounded-xl"
                          id={field.name}
                          name={field.name}
                          onChange={(e) => field.handleChange(e.target.value)}
                          style={{
                            paddingInlineStart: `calc(${slugRef.current?.offsetWidth}px + var(--spacing) * 3)`,
                          }}
                          value={field.state.value}
                        />
                      </div>
                      <FieldInfo
                        defaultValue="Tip: Use a short, memorable URL for easier sharing."
                        field={field}
                      />
                    </div>
                  )}
                </form.Field>
              </CardContent>
              {/* <CardFooter className="text-muted-foreground text-xs"></CardFooter> */}
            </Card>
          </m.div>
          <form.Subscribe>
            {(state) => (
              <m.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 18 }}
                transition={{
                  duration: baseDuration * 0.8,
                  ease: baseEase,
                  delay: 0.22,
                }}
              >
                <Button
                  className="w-5/6 rounded-xl"
                  disabled={!state.canSubmit || state.isSubmitting}
                  type="submit"
                >
                  Create Organization
                  {state.isSubmitting && (
                    <Loader className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              </m.div>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
