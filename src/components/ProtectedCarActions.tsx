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
          className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? inWishlist ? "Removing..." : "Saving..." : inWishlist ? "Remove Saved" : "Save Car"}
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
