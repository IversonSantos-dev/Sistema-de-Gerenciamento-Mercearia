import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as commerce from "../commerce";
import { protectedProcedure, router } from "../_core/trpc";

const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{12,13}$/, "Informe um código UPC (12 dígitos) ou EAN-13 (13 dígitos).")
  .optional()
  .or(z.literal(""));

const productInput = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto.").max(255),
  description: z.string().trim().max(2000).optional().nullable(),
  costPrice: z.number().min(0),
  salePrice: z.number().positive("O preço de venda deve ser maior que zero."),
  unit: z.enum(["un", "kg"]),
  stockCurrent: z.number().min(0),
  stockMinimum: z.number().min(0),
  barcode: barcodeSchema,
  active: z.boolean().optional(),
});

const inventoryImportItem = z.object({
  rowNumber: z.number().int().positive(),
  inventoryCode: z.string().trim().min(1).max(64),
  barcode: z.string().trim().regex(/^\d{12,13}$/).optional().nullable(),
  name: z.string().trim().min(2).max(255),
  unit: z.enum(["un", "kg"]),
  stockCurrent: z.number().min(0).max(999999999),
  unitPrice: z.number().positive().max(999999999),
});

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível concluir esta operação.";
}

export const commerceRouter = router({
  dashboard: protectedProcedure.query(async () => {
    try {
      return await commerce.getDashboardSummary();
    } catch (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMessage(error) });
    }
  }),
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().trim().max(120).optional() }).optional())
      .query(async ({ input }) => commerce.listProducts(input?.search)),
    lowStock: protectedProcedure.query(() => commerce.listLowStockProducts()),
    byBarcode: protectedProcedure
      .input(z.object({ barcode: z.string().trim().min(1).max(32) }))
      .query(({ input }) => commerce.getProductByBarcode(input.barcode)),
    create: protectedProcedure.input(productInput).mutation(async ({ input }) => {
      try {
        return await commerce.createProduct(input);
      } catch (error) {
        throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) });
      }
    }),
    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), data: productInput }))
      .mutation(async ({ input }) => {
        try {
          return await commerce.updateProduct(input.id, input.data);
        } catch (error) {
          throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) });
        }
      }),
    importInventory: protectedProcedure
      .input(z.object({ items: z.array(inventoryImportItem).min(1).max(1200), stockMinimum: z.number().min(0).max(999999999) }))
      .mutation(async ({ input }) => {
        try {
          return await commerce.importInventory(input.items, input.stockMinimum);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage(error) });
        }
      }),
  }),
  sales: router({
    recent: protectedProcedure.query(() => commerce.listRecentSales()),
    finalize: protectedProcedure
      .input(
        z.object({
          items: z
            .array(
              z.object({
                productId: z.number().int().positive(),
                quantity: z.number().positive().max(999999),
              }),
            )
            .min(1),
          paymentMethod: z.enum(["dinheiro", "debito", "credito", "pix"]),
          amountPaid: z.number().min(0).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await commerce.finalizeSale(input);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage(error) });
        }
      }),
  }),
});
