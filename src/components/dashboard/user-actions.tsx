"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CircleCheck,
  HeartHandshake,
  MoreHorizontal,
  Newspaper,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  setUserRoleAction,
  setUserStatusAction,
  type UserActionResult,
} from "@/app/actions/users";
import { ROLES, type UserRole, type UserStatus } from "@/lib/roles";
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

/** What each role means, shown in the menu and the confirmation dialog. */
const ROLE_META: Record<
  UserRole,
  { label: string; icon: LucideIcon; grants: string }
> = {
  donor: {
    label: "Donor",
    icon: HeartHandshake,
    grants: "regular access: their own donations, sponsorships and bookings",
  },
  editor: {
    label: "Editor",
    icon: Newspaper,
    grants: "blog management on top of regular donor access",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    grants: "full dashboard access, including user management",
  },
};

function copyFor(change: PendingChange, who: string): ChangeCopy {
  if (change.kind === "role") {
    const meta = ROLE_META[change.value];
    return {
      title: `Change role to ${meta.label.toLowerCase()}?`,
      description: `${who} will get ${meta.grants}.`,
      cta: `Make ${meta.label.toLowerCase()}`,
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
          {ROLES.filter((role) => role !== user.role).map((role) => {
            const { label, icon: Icon } = ROLE_META[role];
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => setChange({ kind: "role", value: role })}
              >
                <Icon className="size-4" />
                Make {label.toLowerCase()}
              </DropdownMenuItem>
            );
          })}
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
