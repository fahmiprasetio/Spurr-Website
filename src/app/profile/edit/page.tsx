import { cookies } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

type EditProfilePageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

function isValidImageUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const STATUS_MESSAGES: Record<string, string> = {
  "profile-updated": "Profile updated successfully.",
  "password-updated": "Password changed successfully.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-name": "Username must be between 2 and 40 characters.",
  "invalid-image": "Invalid profile image URL.",
  "password-required": "All password fields are required.",
  "password-length": "New password must be at least 8 characters.",
  "password-mismatch": "Password confirmation does not match.",
  "password-invalid": "Current password is incorrect.",
  "password-same": "New password must be different from the current password.",
};

export default async function EditProfilePage({ searchParams }: EditProfilePageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/sign-in?next=/profile/edit");
  }

  const statusMessage = resolvedSearchParams.status
    ? STATUS_MESSAGES[resolvedSearchParams.status] ?? null
    : null;

  const errorMessage = resolvedSearchParams.error
    ? ERROR_MESSAGES[resolvedSearchParams.error] ?? null
    : null;

  async function updateProfileAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/profile/edit");
    }

    const name = typeof formData.get("name") === "string" ? formData.get("name")!.toString().trim() : "";
    const profileImage =
      typeof formData.get("profileImage") === "string"
        ? formData.get("profileImage")!.toString().trim()
        : "";

    if (name.length < 2 || name.length > 40) {
      redirect("/profile/edit?error=invalid-name");
    }

    if (!isValidImageUrl(profileImage)) {
      redirect("/profile/edit?error=invalid-image");
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        profileImage: profileImage || null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    revalidatePath("/wishlist");
    redirect("/profile/edit?status=profile-updated");
  }

  async function updatePasswordAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/profile/edit");
    }

    const currentPassword =
      typeof formData.get("currentPassword") === "string"
        ? formData.get("currentPassword")!.toString()
        : "";
    const newPassword =
      typeof formData.get("newPassword") === "string"
        ? formData.get("newPassword")!.toString()
        : "";
    const confirmPassword =
      typeof formData.get("confirmPassword") === "string"
        ? formData.get("confirmPassword")!.toString()
        : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect("/profile/edit?error=password-required");
    }

    if (newPassword.length < 8) {
      redirect("/profile/edit?error=password-length");
    }

    if (newPassword !== confirmPassword) {
      redirect("/profile/edit?error=password-mismatch");
    }

    if (currentPassword === newPassword) {
      redirect("/profile/edit?error=password-same");
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, passwordHash: true },
    });

    if (!userWithPassword || !verifyPassword(currentPassword, userWithPassword.passwordHash)) {
      redirect("/profile/edit?error=password-invalid");
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    redirect("/profile/edit?status=password-updated");
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-2xl space-y-6">
        {statusMessage ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 rounded-sm">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 rounded-sm">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black">Edit Profile Settings</h1>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white transition-colors rounded-sm"
          >
            Back to Profile
          </Link>
        </div>

        <div className="space-y-6">
          {/* Edit Profile Info Card */}
          <article className="border border-black/10 bg-white/90 p-6 shadow-md rounded-md">
            <h2 className="text-lg font-semibold text-black tracking-tight">Profile Details</h2>
            <form action={updateProfileAction} className="mt-5 space-y-4">
              <label className="block text-sm text-gray-600">
                Username
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name ?? ""}
                  required
                  minLength={2}
                  maxLength={40}
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black rounded-sm"
                  placeholder="Enter username"
                />
              </label>

              <label className="block text-sm text-gray-600">
                Profile Image URL
                <input
                  type="url"
                  name="profileImage"
                  defaultValue={user.profileImage ?? ""}
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black rounded-sm"
                  placeholder="https://example.com/photo.jpg"
                />
              </label>

              <button
                type="submit"
                className="w-full border border-black bg-black py-2.5 text-xs uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black transition-colors rounded-sm"
              >
                Save Profile Changes
              </button>
            </form>
          </article>

          {/* Change Password Card */}
          <article className="border border-black/10 bg-white/90 p-6 shadow-md rounded-md">
            <h2 className="text-lg font-semibold text-black tracking-tight">Security & Password</h2>
            <form action={updatePasswordAction} className="mt-5 space-y-4">
              <label className="block text-sm text-gray-600">
                Current Password
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black rounded-sm"
                />
              </label>

              <label className="block text-sm text-gray-600">
                New Password
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={8}
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black rounded-sm"
                />
              </label>

              <label className="block text-sm text-gray-600">
                Confirm New Password
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black rounded-sm"
                />
              </label>

              <button
                type="submit"
                className="w-full border border-black px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white transition-colors rounded-sm"
              >
                Save New Password
              </button>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}
