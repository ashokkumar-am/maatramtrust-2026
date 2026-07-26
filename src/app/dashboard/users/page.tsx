import { requireAdminPage } from "@/lib/dashboard-auth";
import { listAdminUsers } from "@/lib/users";
import { UsersList, type UserRow } from "@/components/dashboard/users-list";

const PAGE_SIZE = 20;

export const metadata = { title: "Users · Maatram Admin" };

/**
 * Admin user management: everyone who has signed in (any provider), with
 * role (admin/user) and account status (active/disabled) controls.
 */
export default async function AdminUsersPage() {
  const session = await requireAdminPage("/dashboard/users");

  const { items, total } = await listAdminUsers({ page: 1, limit: PAGE_SIZE });
  const initialItems: UserRow[] = items;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} signed-in {total === 1 ? "user" : "users"}. Manage admin
          access and disable accounts.
        </p>
      </header>

      <UsersList
        initialItems={initialItems}
        pageSize={PAGE_SIZE}
        currentUserId={session.user.id}
      />
    </div>
  );
}
