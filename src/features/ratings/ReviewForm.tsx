'use client';

import React, { useState, useEffect } from 'react';
import { Star, Loader2, Send, Edit2 } from 'lucide-react';
import { submitReview, getExistingReview, updateReview, ProductReview } from '@/services/rating-service';

interface ReviewFormProps {
  productId: string;
  order_id: string;
  buyerId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, order_id, buyerId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<ProductReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function checkExisting() {
      try {
        const review = await getExistingReview(buyerId, productId, order_id);
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment || '');
          setSubmitted(true);
        }
      } catch (err) {
        console.error('Failed to check existing review:', err);
      } finally {
        setLoading(false);
      }
    }
    checkExisting();
  }, [buyerId, productId, order_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (existingReview) {
        await updateReview(existingReview.id, {
          rating,
          comment: comment.trim() || undefined
        });
      } else {
        await submitReview({
          product_id: productId,
          order_id: order_id,
          buyer_id: buyerId,
          rating,
          comment: comment.trim() || undefined
        });
      }
      setSubmitted(true);
      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  if (submitted && !isEditing) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">You already reviewed this product!</p>
          <div className="flex items-center gap-1 mt-1">
             {[1,2,3,4,5].map(s => (
               <Star key={s} className={`w-3 h-3 ${rating >= s ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
             ))}
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-bg/50 p-4 rounded-2xl border border-neutral-border animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-muted">
          {isEditing ? 'Update your rating' : 'Rate this product'}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star 
                className={`w-6 h-6 transition-colors ${
                  (hovered || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-muted">Comment (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="w-full px-4 py-3 rounded-xl border border-neutral-border bg-white text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none h-24"
        />
      </div>

      {error && <p className="text-xs font-bold text-red-500">{error}</p>}

      <div className="flex gap-2">
        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-neutral-bg hover:bg-neutral-border text-neutral-text py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`flex-[2] bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2`}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isEditing ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
