import {
  Card,
  LinkButton,
  SectionTitle,
} from "@/components/ui";

import { WEEKDAYS } from "@/lib/constants";

import { listBarbers } from "@/services/catalog.service";

import * as barbersRepository from "@/repositories/barbers.repository";

import { listBusinessHours } from "@/services/schedule.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profissionais | Barbearia La Fé",
};

export default async function BarbersPage() {
  const [
    barbers,
    shopHours,
  ] = await Promise.all([
    listBarbers(),
    listBusinessHours(),
  ]);

  const hoursByBarber = new Map<
    number,
    Awaited<
      ReturnType<
        typeof barbersRepository.listHours
      >
    >
  >();

  for (const barber of barbers) {
    hoursByBarber.set(
      barber.id,
      await barbersRepository.listHours(
        barber.id,
      ),
    );
  }

  const shopByDay = new Map(
    shopHours.map((hour) => [
      hour.day_of_week,
      hour,
    ]),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <SectionTitle
        eyebrow="Nossa equipe"
        title="Profissionais"
        subtitle="Cada profissional tem horários próprios. Ao agendar, mostramos apenas horários realmente livres."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {barbers.map((barber) => {
          const hours =
            hoursByBarber.get(
              barber.id,
            ) || [];

          return (
            <Card
              key={barber.id}
              className="card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gold/50 font-display text-2xl text-gold">
                  {barber.name.slice(
                    0,
                    1,
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-display text-xl">
                    {barber.name}
                  </h3>
                </div>
              </div>

              <div className="mt-4 grid gap-1 rounded-lg border border-line bg-ink-3/60 p-3 text-xs">
                {WEEKDAYS.map(
                  (weekday) => {
                    const own =
                      hours.find(
                        (hour) =>
                          hour.day_of_week ===
                          weekday.day_of_week,
                      );

                    const shop =
                      shopByDay.get(
                        weekday.day_of_week,
                      );

                    const start =
                      own?.start_time ||
                      shop?.open_time ||
                      null;

                    const end =
                      own?.end_time ||
                      shop?.close_time ||
                      null;

                    const closed = own
                      ? own.is_closed
                      : shop?.is_closed ??
                        true;

                    return (
                      <div
                        key={
                          weekday.day_of_week
                        }
                        className="flex justify-between"
                      >
                        <span className="text-zinc-400">
                          {
                            weekday.label
                          }
                        </span>

                        <span
                          className={
                            closed
                              ? "text-zinc-600"
                              : "text-zinc-200"
                          }
                        >
                          {closed ||
                          !start ||
                          !end
                            ? "Fechado"
                            : `${start} - ${end}`}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-10">
        <LinkButton href="/agendamento">
          Agendar com um profissional
        </LinkButton>
      </div>
    </div>
  );
}