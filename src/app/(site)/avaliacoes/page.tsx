import ReviewForm from "@/components/site/ReviewForm";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { listPublicReviews } from "@/services/reviews.service";
import { dateBR } from "@/hooks/useApi";

export const dynamic = "force-dynamic";

export const metadata = { title: "Avaliações | Barbearia La Fé" };

export default async function ReviewsPage() {
  const { reviews, average, total } = await listPublicReviews();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <SectionTitle
        eyebrow="Clientes"
        title={`⭐ ${average.toFixed(1)} / 5`}
        subtitle={`${total} avaliação(ões) publicadas. Sua opinião ajuda quem chega depois.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {reviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-gold">{"★".repeat(review.rating)}</p>
                    <p className="text-xs text-zinc-500">{dateBR(review.created_at)}</p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{review.comment || "Recomendo!"}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">{review.customer_name}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Empty title="Ainda não há avaliações publicadas." description="Envie a sua e ajude a barbearia a crescer." />
          )}
        </div>
        <div>
          <ReviewForm />
        </div>
      </div>
    </div>
  );
}
