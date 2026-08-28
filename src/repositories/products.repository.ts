import { db, type DbExecutor } from "@/lib/database/connection";
import { bool, nowStamp, num, toDate, toDateTime } from "@/utils/datetime";
import { notFound } from "@/lib/api/response";
import type { Product, ProductSale } from "@/types";

function map(row: Record<string, unknown>): Product {
  const stock = num(row.stock);
  const minimum = num(row.minimum_stock);
  return {
    id: Number(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: num(row.price),
    stock,
    minimum_stock: minimum,
    category: row.category ? String(row.category) : null,
    image: row.image ? String(row.image) : null,
    active: bool(row.active),
    low_stock: stock <= minimum,
    created_at: toDateTime(row.created_at),
  };
}

export async function list(filters: { activeOnly?: boolean; search?: string | null; lowStock?: boolean } = {}): Promise<Product[]> {
  const search = (filters.search || "").trim().toLowerCase();
  const rows = await db.query<Record<string, unknown>>(
    `SELECT * FROM products
      WHERE (@activeOnly = 0 OR active = 1)
        AND (@search = '' OR LOWER(name) LIKE @pattern)
      ORDER BY name ASC`,
    { activeOnly: filters.activeOnly ? 1 : 0, search, pattern: `%${search}%` },
  );
  const mapped = rows.map(map);
  return filters.lowStock ? mapped.filter((product) => product.low_stock) : mapped;
}

export async function findById(id: number, executor: DbExecutor = db): Promise<Product> {
  const row = await executor.first<Record<string, unknown>>("SELECT * FROM products WHERE id = @id", { id });
  if (!row) throw notFound("Produto não encontrado.");
  return map(row);
}

export async function create(data: {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  minimum_stock: number;
  category?: string | null;
  image?: string | null;
}): Promise<number> {
  return db.insert("products", {
    name: data.name,
    description: data.description ?? null,
    price: data.price,
    stock: data.stock,
    minimum_stock: data.minimum_stock,
    category: data.category ?? null,
    image: data.image ?? null,
    active: 1,
  });
}

export async function update(
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    price: number;
    stock: number;
    minimum_stock: number;
    category: string | null;
    image: string | null;
    active: boolean;
  }>,
): Promise<void> {
  const fields: string[] = [];
  const params: Record<string, unknown> = { id, now: nowStamp() };
  if (data.name !== undefined) { fields.push("name = @name"); params.name = data.name; }
  if (data.description !== undefined) { fields.push("description = @description"); params.description = data.description; }
  if (data.price !== undefined) { fields.push("price = @price"); params.price = data.price; }
  if (data.stock !== undefined) { fields.push("stock = @stock"); params.stock = data.stock; }
  if (data.minimum_stock !== undefined) { fields.push("minimum_stock = @minimum"); params.minimum = data.minimum_stock; }
  if (data.category !== undefined) { fields.push("category = @category"); params.category = data.category; }
  if (data.image !== undefined) { fields.push("image = @image"); params.image = data.image; }
  if (data.active !== undefined) { fields.push("active = @active"); params.active = data.active ? 1 : 0; }
  if (!fields.length) return;
  await db.execute(`UPDATE products SET ${fields.join(", ")}, updated_at = @now WHERE id = @id`, params);
}

/** Reduz estoque de forma transacional, nunca deixando ficar negativo. */
export async function reduceStock(executor: DbExecutor, productId: number, quantity: number): Promise<Product> {
  await executor.execute(
    "UPDATE products SET stock = stock - @quantity, updated_at = @now WHERE id = @id AND stock >= @quantity",
    { quantity, now: nowStamp(), id: productId },
  );
  return findById(productId, executor);
}

function mapSale(row: Record<string, unknown>): ProductSale {
  return {
    id: Number(row.id),
    product_id: Number(row.product_id),
    product_name: String(row.product_name || ""),
    barber_id: row.barber_id ? Number(row.barber_id) : null,
    quantity: num(row.quantity),
    unit_price: num(row.unit_price),
    total: num(row.total_price),
    payment_method: String(
      row.payment_method || "DINHEIRO",
    ) as ProductSale["payment_method"],
    created_at: toDateTime(row.created_at),
  };
}

export async function listSales(filters: { from?: string | null; to?: string | null; product_id?: number | null } = {}): Promise<ProductSale[]> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.from) { conditions.push("ps.created_at >= @from"); params.from = `${filters.from} 00:00:00`; }
  if (filters.to) { conditions.push("ps.created_at <= @to"); params.to = `${filters.to} 23:59:59`; }
  if (filters.product_id) { conditions.push("ps.product_id = @productId"); params.productId = filters.product_id; }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await db.query<Record<string, unknown>>(
    `SELECT ps.*, p.name AS product_name
       FROM product_sales ps
       JOIN products p ON p.id = ps.product_id
      ${where}
      ORDER BY ps.created_at DESC`,
    params,
  );
  return rows.map(mapSale);
}

export async function createSale(
  executor: DbExecutor,
  data: {
    product_id: number;
    barber_id: number | null;
    customer_id: number | null;
    quantity: number;
    unit_price: number;
    total: number;
    payment_method: string;
  },
): Promise<number> {
  return executor.insert("product_sales", {
    product_id: data.product_id,
    barber_id: data.barber_id,
    customer_id: data.customer_id,
    quantity: data.quantity,
    unit_price: data.unit_price,
    total_price: data.total,
    payment_method: data.payment_method,
  });
}

export function saleDateLabel(value: unknown): string | null {
  return toDate(value);
}
