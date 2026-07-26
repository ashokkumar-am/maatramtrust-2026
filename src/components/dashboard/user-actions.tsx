"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CircleCheck,
  MoreHorizontal,
  Shield,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  setUserRoleAction,
  setUserStatusAction,
  type UserActionResult,
} from "@/app/actions/users";
import type { UserRole, UserStatus } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PendingChange =
  { kind: "role"; value: UserRole } | { kind: "status"; value: UserStatus };

interface ChangeCopy {
  title: string;
  description: string;
  cta: string;
  destructive?: boolean;
}

function copyFor(change: PendingChange, who: string): ChangeCopy {
  if (change.kind === "role") {
    return change.value === "admin"
      ? {
          title: "Make admin?",
          description: `${who} will get full access to this dashboard, including user management.`,
          cta: "Make admin",
        }
      : {
          title: "Remove admin access?",
          description: `${who} will become a regular user and lose access to admin pages.`,
          cta: "Remove admin",
          destructive: true,
        };
  }
  return change.value === "disabled"
    ? {
        title: "Disable this account?",
        description: `${who} will be signed out immediately and won't be able to sign in until re-enabled.`,
        cta: "Disable",
        destructive: true,
      }
    : {
        title: "Enable this account?",
        description: `${who} will be able to sign in again.`,
        cta: "Enable",
      };
}

/**
 * Row menu to promote/demote or disable/enable a user, with confirmation.
 * The Server Actions re-check permissions; this component only hides the
 * menu for rows that can never be changed (yourself, `ADMIN_EMAILS` admins).
 */
export function UserActions({
  user,
}: {
  user: {
    id: string;
    name?: string;
    email?: string;
    role: UserRole;
    status: UserStatus;
  };
}) {
  const router = useRouter();
  const [change, setChange] = useState<PendingChange | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(target: PendingChange) {
    startTransition(async () => {
      const result: UserActionResult =
        target.kind === "role"
          ? await setUserRoleAction(user.id, target.value)
          : await setUserStatusAction(user.id, target.value);
      if (result.ok) {
        toast.success("Updated.");
        setChange(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const who = user.name ?? user.email ?? "This user";
  const copy = change ? copyFor(change, who) : null;
  const disabled = user.status === "disabled";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Manage user">
              <MoreHorizontal className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {user.role === "admin" ? (
            <DropdownMenuItem
              onClick={() => setChange({ kind: "role", value: "user" })}
            >
              <ShieldOff className="size-4" />
              Remove admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setChange({ kind: "role", value: "admin" })}
            >
              <Shield className="size-4" />
              Make admin
            </DropdownMenuItem>
          )}
          {disabled ? (
            <DropdownMenuItem
              onClick={() => setChange({ kind: "status", value: "active" })}
            >
              <CircleCheck className="size-4" />
              Enable account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setChange({ kind: "status", value: "disabled" })}
            >
              <Ban className="size-4" />
              Disable account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={change !== null}
        onOpenChange={(open) => !open && setChange(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" size="sm" type="button">
                  Cancel
                </Button>
              }
            />
            <Button
              variant={copy?.destructive ? "destructive" : "default"}
              size="sm"
              onClick={() => change && apply(change)}
              disabled={pending}
            >
              {pending ? "Saving…" : copy?.cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
