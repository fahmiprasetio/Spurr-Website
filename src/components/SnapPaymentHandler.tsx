"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

type SnapPaymentHandlerProps = {
  token: string;
  clientKey: string;
  isProduction: boolean;
};

async function confirmPaymentStatus(result: unknown): Promise<void> {
  const orderId =
    result && typeof result === "object" && "order_id" in result
      ? String((result as { order_id?: unknown }).order_id ?? "")
      : "";

  if (!orderId) {
    return;
  }

  try {
    await fetch("/api/payments/midtrans/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch (error) {
    console.error("failed to confirm payment status:", error);
  }
}

export default function SnapPaymentHandler({
  token,
  clientKey,
  isProduction,
}: SnapPaymentHandlerProps) {
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (scriptLoaded && window.snap) {
      window.snap.pay(token, {
        onSuccess: async (result) => {
          await confirmPaymentStatus(result);
          router.push("/rentals?status=payment-completed");
          router.refresh();
        },
        onPending: async (result) => {
          await confirmPaymentStatus(result);
          router.push("/rentals?status=payment-pending");
          router.refresh();
        },
        onError: (result) => {
          console.error("payment error:", result);
          router.push("/rentals?error=payment-failed");
        },
        onClose: () => {
          router.push("/rentals");
          router.refresh();
        },
      });
    }
  }, [scriptLoaded, token, router]);

  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <>
      <Script
        src={snapUrl}
        data-client-key={clientKey}
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="rounded-sm bg-white p-6 shadow-xl text-center max-w-sm w-full mx-4 border border-black/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <h3 className="text-base font-semibold tracking-tight text-black mb-1">Opening Secure Payment</h3>
          <p className="text-xs text-gray-500">Please complete your payment in the popup window.</p>
        </div>
      </div>
    </>
  );
}