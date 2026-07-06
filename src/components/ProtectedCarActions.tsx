"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

type WishlistFeedback = {
  type: "success" | "error";
  message: string;
};

type ProtectedCarActionsProps = {
  carId: string;
  rentHref: string;
  initialInWishlist: boolean;
  isSignedIn: boolean;
};

export default function ProtectedCarActions({
  carId,
  rentHref,
  initialInWishlist,
  isSignedIn,
}: ProtectedCarActionsProps) {
  const router = useRouter();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<WishlistFeedback | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  function showSignInModal() {
    const message = "Please sign in before using this feature.";
    setFeedback({ type: "error", message });
    setIsSignInModalOpen(true);
  }

  function closeSignInModal() {
    setIsSignInModalOpen(false);
  }

  useEffect(() => {
    if (!isSignInModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSignInModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSignInModalOpen]);

  function handleRentClick() {
    if (!isSignedIn) {
      showSignInModal();
      return;
    }

    router.push(rentHref);
  }

  async function handleSaveClick() {
    if (!isSignedIn) {
      showSignInModal();
      return;
    }

    if (isSaving) {
      return;
    }

    setFeedback(null);
    setIsSaving(true);
    try {
      const desiredAction = inWishlist ? "remove" : "add";
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, action: desiredAction }),
      });

      const result = (await response.json().catch(() => null)) as
        | { inWishlist?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok) {
        if (response.status === 401) {
          showSignInModal();
          return;
        }

        setFeedback({
          type: "error",
          message: result?.error ?? "Failed to update wishlist. Please try again.",
        });
        return;
      }

      const nextWishlistState = Boolean(result?.inWishlist);
      setInWishlist(nextWishlistState);
      setFeedback({
        type: "success",
        message:
          result?.message ??
          (nextWishlistState ? "Car saved to wishlist." : "Car removed from wishlist."),
      });
    } catch {
      setFeedback({
        type: "error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRentClick}
          className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black"
        >
          Continue to Rental
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          aria-label={inWishlist ? "Remove saved car" : "Save car"}
          aria-pressed={inWishlist}
          title={inWishlist ? "Remove saved car" : "Save car"}
          className={`inline-flex h-10 w-10 items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            inWishlist
              ? "border-black bg-black text-white"
              : "border-black/20 bg-white text-black hover:border-black hover:bg-black hover:text-white"
          }`}
        >
          {isSaving ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
              />
              <path
                d="M12 3a9 9 0 0 1 9 9"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
                fill={inWishlist ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <span className="sr-only">{inWishlist ? "Remove saved car" : "Save car"}</span>
        </button>
      </div>

      {feedback ? (
        <p className={`text-xs ${feedback.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {feedback.message}
        </p>
      ) : null}

      {isSignInModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSignInModal();
            }
          }}
        >
          <div className="w-full max-w-md border border-white/10 bg-white p-6 text-black shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Members only</p>
                <h2 id={dialogTitleId} className="mt-2 text-2xl font-semibold tracking-tight">
                  Sign in to continue
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSignInModal}
                aria-label="Close sign in prompt"
                className="inline-flex h-9 w-9 items-center justify-center border border-black/10 text-lg leading-none hover:bg-black hover:text-white"
              >
                ×
              </button>
            </div>

            <p id={dialogDescriptionId} className="mt-4 text-sm leading-relaxed text-gray-600">
              Please sign in first to rent this car or save it to your wishlist. After signing in, you can continue from this vehicle page.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sign-in"
                className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:border-black hover:bg-black hover:text-white"
              >
                Create account
              </Link>
              <button
                type="button"
                onClick={closeSignInModal}
                className="px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-500 hover:text-black"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
