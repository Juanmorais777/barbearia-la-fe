import { badRequest } from "@/lib/api/response";
import { withTransaction } from "@/lib/database/connection";
import * as productsRepo from "@/repositories/products.repository";
import * as financeRepo from "@/repositories/finance.repository";
import { todayISO } from "@/utils/datetime";
import type { PaymentMethod, Product, ProductSale } from "@/types";

export async function listProducts(filters: { activeOnly?: boolean; search?: string | null; lowStock?: boolean } = {}) {
  return productsRepo.list(filters);
}

export async function getProduct(id: number): Promise<Product> {
  return productsRepo.findById(id);
}

export async function createProduct(input: {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  minimum_stock: number;
  category?: string | null;
  image?: string | null;
}): Promise<Product> {
  const id = await productsRepo.create(input);
  return productsRepo.findById(id);
}

export async function updateProduct(
  id: number,
  input: Partial<{
    name: string;
    description: string | null;
    price: number;
    stock: number;
    minimum_stock: number;
    category: string | null;
    image: string | null;
    active: boolean;
  }>,
): Promise<Product> {
  await productsRepo.findById(id);
  await productsRepo.update(id, input);
  return productsRepo.findById(id);
}

export async function deactivateProduct(id: number): Promise<Product> {
  await productsRepo.update(id, { active: false });
  return productsRepo.findById(id);
}

export async function listSales(filters: { from?: string | null; to?: string | null; product_id?: number | null }) {
  return productsRepo.listSales(filters);
}

/** Venda de produto: transação SQL — estoque, venda e receita gravados juntos. */
export async function sellProduct(
  input: {
    product_id: number;
    quantity: number;
    payment_method: PaymentMethod;
    barber_id?: number | null;
    customer_id?: number | null;
  },
  adminId?: number | null,
): Promise<{ sale_id: number; product: Product; total: number }> {
  const result = await withTransaction(async (tx) => {
    const product = await productsRepo.findById(input.product_id, tx);
    if (!product.active) throw badRequest("Produto indisponível.");
    if (product.stock < input.quantity) {
      throw badRequest(`Estoque insuficiente. Disponível: ${product.stock} unidade(s).`);
    }
    const total = Math.round(product.price * input.quantity * 100) / 100;
    const saleId = await productsRepo.createSale(tx, {
      product_id: product.id,
      barber_id: input.barber_id ?? null,
      customer_id: input.customer_id ?? null,
      quantity: input.quantity,
      unit_price: product.price,
      total,
      payment_method: input.payment_method,
    });
    await productsRepo.reduceStock(tx, product.id, input.quantity);
    await financeRepo.createTransaction(tx, {
      type: "INCOME",
      category: "PRODUTO",
      description: `Venda de ${input.quantity}x ${product.name}`,
      amount: total,
      payment_method: input.payment_method,
      reference_type: "PRODUCT_SALE",
      reference_id: saleId,
      transaction_date: todayISO(),
      created_by: adminId ?? null,
    });
    return { saleId, total, product: await productsRepo.findById(product.id, tx) };
  });

  return { sale_id: result.saleId, product: result.product, total: result.total };
}
