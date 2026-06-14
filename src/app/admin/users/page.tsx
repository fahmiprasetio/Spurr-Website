import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getCurrentUser, hasAdminAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const STATUS_MESSAGES: Record<string, string> = {
  "role-updated": "User role updated successfully.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-input": "Invalid role update request.",
  "invalid-role": "Invalid role value.",
  "user-not-found": "User was not found.",
  "cannot-change-self": "You cannot change your own role.",
  "cannot-demote-last-admin": "You cannot demote the last remaining admin.",
  "role-update-failed": "Failed to update the user role. Please try again.",
};

const ROLE_VALUES: UserRole[] = ["USER", "ADMIN"];

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Customer",
  ADMIN: "Admin",
};

type AdminUsersPageProps = {
  searchParams: Promise<{ status?: string; error?: string; q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const [currentUser, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!currentUser) {
    redirect("/sign-in?next=/admin/users");
  }

  const canAccess = await hasAdminAccess(currentUser.id, currentUser.role);

  if (!canAccess) {
    redirect("/profile");
  }

  const searchTerm = resolvedSearchParams.q?.trim() ?? "";

  const statusMessage = resolvedSearchParams.status
    ? STATUS_MESSAGES[resolvedSearchParams.status] ?? null
    : null;

  const errorMessage = resolvedSearchParams.error
    ? ERROR_MESSAGES[resolvedSearchParams.error] ?? null
    : null;

  const [totalUsers, totalAdmins, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.findMany({
      where: searchTerm
        ? {
            OR: [
              { email: { contains: searchTerm, mode: "insensitive" } },
              { name: { contains: searchTerm, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            rentals: true,
            reviews: true,
          },
        },
      },
    }),
  ]);

  async function updateUserRoleAction(formData: FormData) {
    "use server";

    const actor = await getCurrentUser();

    if (!actor) {
      redirect("/sign-in?next=/admin/users");
    }

    const isAdmin = await hasAdminAccess(actor.id, actor.role);

    if (!isAdmin) {
      redirect("/profile");
    }

    const targetUserId = formData.get("userId");
    const roleValue = formData.get("role");

    if (typeof targetUserId !== "string" || typeof roleValue !== "string") {
      redirect("/admin/users?error=invalid-input");
    }

    if (!ROLE_VALUES.includes(roleValue as UserRole)) {
      redirect("/admin/users?error=invalid-role");
    }

    const nextRole = roleValue as UserRole;

    if (targetUserId === actor.id) {
      redirect("/admin/users?error=cannot-change-self");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      redirect("/admin/users?error=user-not-found");
    }

    if (targetUser.role === nextRole) {
      redirect("/admin/users?status=role-updated");
    }

    if (targetUser.role === "ADMIN" && nextRole === "USER") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

      if (adminCount <= 1) {
        redirect("/admin/users?error=cannot-demote-last-admin");
      }
    }

    const updateResult = await prisma.user
      .update({
        where: { id: targetUserId },
        data: { role: nextRole },
      })
      .catch((error) => {
        console.error("updateUserRoleAction failed:", error);
        return null;
      });

    if (!updateResult) {
      redirect("/admin/users?error=role-update-failed");
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    redirect("/admin/users?status=role-updated");
  }

  return (
    <main className="min-h-screen px-6 py-28">
      <section className="mx-auto w-full max-w-6xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        {statusMessage ? (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">User Management</h1>
            <p className="mt-2 text-sm text-gray-500">
              Review accounts and manage administrator access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
            >
              Profile
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Total Users</p>
            <p className="mt-2 text-2xl font-semibold text-black">{totalUsers}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Admins</p>
            <p className="mt-2 text-2xl font-semibold text-black">{totalAdmins}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Customers</p>
            <p className="mt-2 text-2xl font-semibold text-black">{totalUsers - totalAdmins}</p>
          </article>
        </div>

        <form method="get" className="mt-8 flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchTerm}
            placeholder="Search by name or email"
            className="w-full max-w-xs border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Search
          </button>
          {searchTerm ? (
            <Link
              href="/admin/users"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
            >
              Reset
            </Link>
          ) : null}
        </form>

        <div className="mt-6 space-y-3">
          {users.length === 0 ? (
            <p className="border border-black/10 bg-white p-4 text-sm text-gray-500">
              No users found.
            </p>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUser.id;
              const isAdmin = user.role === "ADMIN";
              const nextRole: UserRole = isAdmin ? "USER" : "ADMIN";

              return (
                <article
                  key={user.id}
                  className="flex flex-wrap items-start justify-between gap-4 border border-black/10 bg-white p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-black">
                        {user.name?.trim() || "Unnamed user"}
                      </h3>
                      <span
                        className={
                          isAdmin
                            ? "border border-black bg-black px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white"
                            : "border border-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-600"
                        }
                      >
                        {ROLE_LABEL[user.role]}
                      </span>
                      {isSelf ? (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                      Joined {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(user.createdAt)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
                      {user._count.rentals} rentals · {user._count.reviews} reviews
                    </p>
                  </div>

                  <form action={updateUserRoleAction} className="w-full max-w-xs">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="role" value={nextRole} />
                    <button
                      type="submit"
                      disabled={isSelf}
                      className="w-full border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      {isSelf ? "Current account" : isAdmin ? "Demote to Customer" : "Promote to Admin"}
                    </button>
                  </form>
                </article>
              );
            })
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Showing up to 100 accounts. The last remaining admin cannot be demoted.
        </p>
      </section>
    </main>
  );
}
