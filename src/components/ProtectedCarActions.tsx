"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  function showSignInPopup() {
    window.alert("You need to sign in before using this feature.");
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

    setIsSaving(true);
    try {
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId }),
      });

      const result = (await response.json().catch(() => null)) as
        | { inWishlist?: boolean; error?: string }
        | null;

      if (!response.ok) {
        if (response.status === 401) {
          showSignInPopup();
          return;
        }

        window.alert(result?.error ?? "Failed to update wishlist. Please try again.");
        return;
      }

      setInWishlist(Boolean(result?.inWishlist));
    } finally {
      setIsSaving(false);
    }
  }

  return (
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
        {isSaving ? "Saving..." : inWishlist ? "Saved" : "Save Car"}
      </button>
    </div>
  );
}
