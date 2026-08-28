import { z } from "zod";

/* =========================================================
   REGEX
   ========================================================= */

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const timePattern =
  /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const datePattern =
  /^\d{4}-\d{2}-\d{2}$/;

const phonePattern =
  /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

/* =========================================================
   LOGIN
   ========================================================= */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Informe o e-mail.")
    .regex(emailPattern, "E-mail inválido."),

  password: z
    .string()
    .min(4, "Informe a senha."),
});

/* =========================================================
   CLIENTES
   ========================================================= */

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo."),

  phone: z
    .string()
    .trim()
    .regex(
      phonePattern,
      "Telefone inválido. Ex: (82) 98888-7777",
    ),

  email: z
    .string()
    .trim()
    .regex(
      emailPattern,
      "E-mail inválido.",
    )
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),

  active: z
    .boolean()
    .optional(),
});

export const customerUpdateSchema =
  customerSchema.partial();

/* =========================================================
   BARBEIROS
   ========================================================= */

export const barberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      "Informe o nome do profissional.",
    ),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable(),

  photo: z
    .string()
    .trim()
    .max(400)
    .optional()
    .nullable(),

  specialty: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable(),

  bio: z
    .string()
    .trim()
    .max(600)
    .optional()
    .nullable(),

  /*
   * IMPORTANTE:
   *
   * A aplicação usa commission_percent.
   *
   * O SQL Server usa commission_percentage.
   *
   * A conversão acontece no repository.
   */
  commission_percent: z
    .coerce
    .number()
    .finite(
      "Informe uma comissão válida.",
    )
    .min(
      0,
      "Comissão mínima 0%.",
    )
    .max(
      100,
      "Comissão máxima 100%.",
    ),

  active: z
    .boolean()
    .optional(),

  service_ids: z
    .array(
      z.coerce
        .number()
        .int()
        .positive(),
    )
    .optional(),
});

export const barberUpdateSchema =
  barberSchema.partial();

/* =========================================================
   SERVIÇOS
   ========================================================= */

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      "Informe o nome do serviço.",
    ),

  description: z
    .string()
    .trim()
    .max(600)
    .optional()
    .nullable(),

  price: z
    .coerce
    .number()
    .finite()
    .min(
      0.01,
      "Informe o preço.",
    ),

  duration_minutes: z
    .coerce
    .number()
    .int()
    .min(
      5,
      "Duração mínima 5 minutos.",
    )
    .max(600),

  category: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable(),

  active: z
    .boolean()
    .optional(),

  barber_ids: z
    .array(
      z.coerce
        .number()
        .int()
        .positive(),
    )
    .optional(),
});

export const serviceUpdateSchema =
  serviceSchema.partial();

/* =========================================================
   PRODUTOS
   ========================================================= */

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      "Informe o nome do produto.",
    ),

  description: z
    .string()
    .trim()
    .max(600)
    .optional()
    .nullable(),

  price: z
    .coerce
    .number()
    .finite()
    .min(
      0.01,
      "Informe o preço.",
    ),

  stock: z
    .coerce
    .number()
    .int()
    .min(
      0,
      "Estoque não pode ser negativo.",
    ),

  minimum_stock: z
    .coerce
    .number()
    .int()
    .min(0)
    .default(2),

  category: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable(),

  image: z
    .string()
    .trim()
    .max(400)
    .optional()
    .nullable(),

  active: z
    .boolean()
    .optional(),
});

export const productUpdateSchema =
  productSchema.partial();

/* =========================================================
   VENDA DE PRODUTO
   ========================================================= */

export const productSaleSchema = z.object({
  product_id: z
    .coerce
    .number()
    .int()
    .positive(),

  quantity: z
    .coerce
    .number()
    .int()
    .min(
      1,
      "Quantidade mínima 1.",
    ),

  payment_method: z
    .enum([
      "DINHEIRO",
      "CREDITO",
      "DEBITO",
      "PIX",
    ])
    .default("DINHEIRO"),

  barber_id: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  customer_id: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

/* =========================================================
   DISPONIBILIDADE
   ========================================================= */

export const availabilitySchema = z.object({
  service_id: z
    .coerce
    .number()
    .int()
    .positive(
      "Escolha um serviço.",
    ),

  barber_id: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  date: z
    .string()
    .regex(
      datePattern,
      "Data inválida.",
    ),
});

/* =========================================================
   AGENDAMENTOS
   ========================================================= */

export const appointmentSchema = z.object({
  service_id: z
    .coerce
    .number()
    .int()
    .positive(
      "Escolha um serviço.",
    ),

  barber_id: z
    .coerce
    .number()
    .int()
    .positive(
      "Escolha um profissional.",
    ),

  date: z
    .string()
    .regex(
      datePattern,
      "Data inválida.",
    ),

  time: z
    .string()
    .regex(
      timePattern,
      "Horário inválido.",
    ),

  customer_name: z
    .string()
    .trim()
    .min(
      3,
      "Informe seu nome completo.",
    ),

  customer_phone: z
    .string()
    .trim()
    .regex(
      phonePattern,
      "WhatsApp inválido. Ex: (82) 98888-7777",
    ),

  customer_email: z
    .string()
    .trim()
    .regex(
      emailPattern,
      "E-mail inválido.",
    )
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(400)
    .optional()
    .nullable(),
});

export const appointmentUpdateSchema =
  z.object({
    status: z
      .enum([
        "PENDENTE",
        "CONFIRMADO",
        "EM_ATENDIMENTO",
        "CONCLUIDO",
        "CANCELADO",
        "NAO_COMPARECEU",
      ])
      .optional(),

    payment_method: z
      .enum([
        "DINHEIRO",
        "CREDITO",
        "DEBITO",
        "PIX",
      ])
      .optional()
      .nullable(),

    date: z
      .string()
      .regex(datePattern)
      .optional(),

    time: z
      .string()
      .regex(timePattern)
      .optional(),

    notes: z
      .string()
      .trim()
      .max(400)
      .optional()
      .nullable(),
  });

/* =========================================================
   BLOQUEIOS
   ========================================================= */

const blockedTimeBaseSchema =
  z.object({
    type: z.enum([
      "DIA_INTEIRO",
      "HORARIO",
      "ALMOCO",
      "FOLGA",
      "REUNIAO",
      "MANUTENCAO",
      "OUTRO",
    ]),

    date: z
      .string()
      .regex(
        datePattern,
        "Data inválida.",
      ),

    barber_id: z
      .coerce
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),

    start_time: z
      .string()
      .regex(
        timePattern,
        "Horário inicial inválido.",
      )
      .optional()
      .nullable(),

    end_time: z
      .string()
      .regex(
        timePattern,
        "Horário final inválido.",
      )
      .optional()
      .nullable(),

    reason: z
      .string()
      .trim()
      .min(
        3,
        "Informe o motivo do bloqueio.",
      ),

    active: z
      .boolean()
      .optional(),
  });

export const blockedTimeSchema =
  blockedTimeBaseSchema
    .refine(
      (data) =>
        data.type === "DIA_INTEIRO" ||
        Boolean(
          data.start_time &&
            data.end_time,
        ),
      {
        message:
          "Informe o horário inicial e final do bloqueio.",
        path: ["start_time"],
      },
    )
    .refine(
      (data) =>
        data.type === "DIA_INTEIRO" ||
        !data.start_time ||
        !data.end_time ||
        data.start_time <
          data.end_time,
      {
        message:
          "O horário final deve ser maior que o inicial.",
        path: ["end_time"],
      },
    );

export const blockedTimeUpdateSchema =
  blockedTimeBaseSchema.partial();

/* =========================================================
   HORÁRIO DA BARBEARIA
   ========================================================= */

export const businessHoursSchema =
  z.object({
    day_of_week: z
      .coerce
      .number()
      .int()
      .min(0)
      .max(6),

    open_time: z
      .string()
      .regex(timePattern)
      .optional()
      .nullable(),

    close_time: z
      .string()
      .regex(timePattern)
      .optional()
      .nullable(),

    is_closed: z
      .boolean(),
  });

/* =========================================================
   HORÁRIO DO BARBEIRO
   ========================================================= */

export const barberHoursSchema =
  z.object({
    hours: z.array(
      z.object({
        day_of_week: z
          .coerce
          .number()
          .int()
          .min(0)
          .max(6),

        start_time: z
          .string()
          .regex(timePattern)
          .optional()
          .nullable(),

        end_time: z
          .string()
          .regex(timePattern)
          .optional()
          .nullable(),

        is_closed: z
          .boolean(),
      }),
    ),
  });

/* =========================================================
   AVALIAÇÕES
   ========================================================= */

export const reviewSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(
      3,
      "Informe seu nome.",
    ),

  rating: z
    .coerce
    .number()
    .int()
    .min(
      1,
      "Escolha de 1 a 5 estrelas.",
    )
    .max(5),

  comment: z
    .string()
    .trim()
    .max(800)
    .optional()
    .nullable(),

  appointment_id: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export const reviewUpdateSchema =
  z.object({
    approved: z
      .boolean()
      .optional(),

    active: z
      .boolean()
      .optional(),
  });

/* =========================================================
   TRANSAÇÕES
   ========================================================= */

export const transactionSchema =
  z.object({
    type: z.enum([
      "INCOME",
      "EXPENSE",
    ]),

    category: z
      .string()
      .trim()
      .min(
        2,
        "Informe a categoria.",
      ),

    description: z
      .string()
      .trim()
      .min(
        3,
        "Informe a descrição.",
      ),

    amount: z
      .coerce
      .number()
      .finite()
      .min(
        0.01,
        "Informe o valor.",
      ),

    payment_method: z
      .enum([
        "DINHEIRO",
        "CREDITO",
        "DEBITO",
        "PIX",
      ])
      .default("DINHEIRO"),

    transaction_date: z
      .string()
      .regex(
        datePattern,
        "Data inválida.",
      )
      .optional(),
  });

/* =========================================================
   PAGAMENTO DE COMISSÃO
   ========================================================= */

export const commissionPaySchema =
  z.object({
    note: z
      .string()
      .trim()
      .max(300)
      .optional()
      .nullable(),
  });

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

export const settingsSchema =
  z.object({
    settings: z.array(
      z.object({
        key: z
          .string()
          .trim()
          .min(2),

        value: z
          .string()
          .trim()
          .max(400),
      }),
    ),
  });