"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<WishlistFeedback | null>(null);

  function showSignInPopup() {
    const message = "You need to sign in before using this feature.";
    window.alert(message);
    setFeedback({ type: "error", message });
  }

  function handleRentClick() {
    if (!isSignedIn) {
      showSignInPopup();
      return;
    }

    router.push(rentHref);
  }

  async function handleSaveClick() {
    if (!isSignedIn) {
      showSignInPopup();
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
          showSignInPopup();
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
    </div>
  );
}
