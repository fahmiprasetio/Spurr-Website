"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { CarReviewView } from "@/types/reviews";

type CarReviewsPanelProps = {
  carId: string;
  carName: string;
  isSignedIn: boolean;
  initialReviews: CarReviewView[];
};

function formatReviewDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function CarReviewsPanel({
  carId,
  carName,
  isSignedIn,
  initialReviews,
}: CarReviewsPanelProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remainingChars = useMemo(() => Math.max(600 - comment.length, 0), [comment.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSignedIn) {
      setErrorMessage("Please sign in to leave a review.");
      return;
    }

    const trimmed = comment.trim();
    if (!trimmed) {
      setErrorMessage("Please write a short review first.");
      return;
    }

    if (trimmed.length > 600) {
      setErrorMessage("Review is too long. Maximum 600 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, comment: trimmed }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; review?: CarReviewView }
        | null;

      if (!response.ok || !result?.review) {
        setErrorMessage(result?.error ?? "Failed to post review. Please try again.");
        return;
      }

      setReviews((previous) => [result.review as CarReviewView, ...previous]);
      setComment("");
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Community Reviews</p>
          <h2 className="mt-1 text-xl font-semibold text-black">What drivers said about {carName}</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 border border-black/10 p-4">
        <label
          htmlFor={`review-comment-${carId}`}
          className="text-xs uppercase tracking-[0.14em] text-gray-500"
        >
          Add your review
        </label>
        <textarea
          id={`review-comment-${carId}`}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          maxLength={600}
          rows={4}
          placeholder="Share your rental experience, service quality, or driving impression."
          className="mt-2 w-full resize-y border border-black/15 px-3 py-2 text-sm text-black outline-none focus:border-black"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{remainingChars} characters left</p>

          {isSignedIn ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Posting..." : "Post Review"}
            </button>
          ) : (
            <Link
              href={`/sign-in?next=${encodeURIComponent(`/car/${carId}/comments`)}`}
              className="border border-black px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
            >
              Sign in to review
            </Link>
          )}
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      </form>

      <div className="mt-5 space-y-3">
        {reviews.length === 0 ? (
          <p className="border border-dashed border-black/20 px-4 py-5 text-sm text-gray-500">
            No reviews yet. Be the first driver to leave a comment for this car.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border border-black/10 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-black">{review.userName}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  {formatReviewDate(review.createdAt)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
