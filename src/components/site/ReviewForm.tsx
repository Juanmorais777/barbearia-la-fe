"use client";

import { useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { ErrorBox, SuccessBox, btnGhost, btnPrimary, inputClass, labelClass } from "@/components/ui";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ customer_name: name, rating, comment: comment || null }),
      });
      setDone(true);
      setName("");
      setComment("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar sua avaliação.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SuccessBox message="Obrigado! Sua avaliação foi enviada e será publicada após a aprovação da barbearia.">
        <button type="button" className={`${btnGhost} mt-3`} onClick={() => setDone(false)}>
          Enviar outra
        </button>
      </SuccessBox>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div>
        <label className={labelClass} htmlFor="review-name">
          Seu nome
        </label>
        <input
          id="review-name"
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Como podemos te chamar?"
          required
          minLength={3}
        />
      </div>

      <div>
        <span className={labelClass}>Nota</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} estrelas`}
              className={`h-10 w-10 rounded-lg border text-lg transition ${
                value <= rating ? "border-gold/60 bg-gold/15 text-gold" : "border-line text-zinc-600"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="review-comment">
          Comentário
        </label>
        <textarea
          id="review-comment"
          className={inputClass}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Conte como foi seu atendimento"
        />
      </div>

      {error ? <ErrorBox message={error} /> : null}

      <button type="submit" className={btnPrimary} disabled={loading || name.trim().length < 3}>
        {loading ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
