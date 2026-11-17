"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSheet } from "@/components/common/form-sheet";
import { Field } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useRbacMutation } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import { apiErrorText, inviteMember } from "@/lib/api/rbac";

/** Adds a person by email. Their roles are chosen afterwards from the list. */
export function InviteSheet({
  tenant,
  open,
  onOpenChange,
}: {
  tenant: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const invite = useRbacMutation(tenant, (address: string) => inviteMember(tenant, address));
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  const close = () => {
    setEmail("");
    onOpenChange(false);
  };

  const submit = () =>
    invite.mutate(email.trim(), {
      onSuccess: () => {
        toast.success(t("rbac.invite.done"));
        close();
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.invite.failed"))),
    });

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="sm"
      title={t("rbac.invite.title")}
      description={t("rbac.invite.description")}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!valid || invite.isPending} onClick={submit}>
            {invite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("rbac.invite.submit")}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !invite.isPending) submit();
        }}
      >
        <Field label={t("rbac.invite.email")} htmlFor="invite-email" required>
          <Input
            id="invite-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </form>
    </FormSheet>
  );
}
