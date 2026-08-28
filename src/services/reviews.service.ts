import * as reviewsRepo from "@/repositories/reviews.repository";
import * as appointmentsRepo from "@/repositories/appointments.repository";
import type { Review } from "@/types";

export async function listPublicReviews(): Promise<{ reviews: Review[]; average: number; total: number }> {
  const [reviews, average] = await Promise.all([reviewsRepo.listPublic(), reviewsRepo.averageRating()]);
  return { reviews, average: Math.round(average * 10) / 10, total: reviews.length };
}

export async function listAllReviews(): Promise<Review[]> {
  return reviewsRepo.listAll();
}

export async function createReview(input: {
  customer_name: string;
  rating: number;
  comment?: string | null;
  appointment_id?: number | null;
}): Promise<Review> {
  let customerId: number | null = null;
  if (input.appointment_id) {
    const appointment = await appointmentsRepo.findById(input.appointment_id);
    customerId = appointment.customer_id;
  }
  // Avaliações públicas entram como pendentes de aprovação (moderação).
  const id = await reviewsRepo.create({
    customer_name: input.customer_name,
    rating: input.rating,
    comment: input.comment ?? null,
    appointment_id: input.appointment_id ?? null,
    customer_id: customerId,
    approved: false,
  });
  const all = await reviewsRepo.listAll();
  const created = all.find((review) => review.id === Number(id));
  return created as Review;
}

export async function moderateReview(id: number, input: { approved?: boolean; active?: boolean }): Promise<Review> {
  await reviewsRepo.update(id, input);
  const all = await reviewsRepo.listAll();
  const updated = all.find((review) => review.id === id);
  if (!updated) throw new Error("Avaliação não encontrada.");
  return updated;
}

export async function averageRating(): Promise<number> {
  return reviewsRepo.averageRating();
}
