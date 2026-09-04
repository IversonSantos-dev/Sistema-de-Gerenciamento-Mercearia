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
  categoryId: z.number().int().positive().nullable().optional(),
  useCategoryMinimum: z.boolean().optional(),
  scalePlu: z.number().int().positive().max(999999).nullable().optional(),
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

const nfeEntryItem = z.object({
  productId: z.number().int().positive().nullable(),
  productCode: z.string().trim().min(1).max(120),
  barcode: z.string().trim().max(14).optional().nullable(),
  name: z.string().trim().min(2).max(255),
  unit: z.enum(["un", "kg"]),
  quantity: z.number().positive().max(999999999),
  unitCost: z.number().min(0).max(999999999),
  salePrice: z.number().positive().max(999999999).optional(),
});

const nfeEntryInput = z.object({
  accessKey: z.string().regex(/^\d{44}$/, "A chave de acesso deve possuir 44 dígitos."),
  invoiceNumber: z.string().trim().min(1).max(40),
  series: z.string().trim().max(20).optional().nullable(),
  issueDate: z.string().datetime().optional().nullable(),
  supplierName: z.string().trim().min(1).max(255),
  supplierDocument: z.string().trim().max(18).optional().nullable(),
  totalAmount: z.number().min(0).max(999999999),
  items: z.array(nfeEntryItem).min(1).max(500).superRefine((items, context) => {
    items.forEach((item, index) => {
      if (item.productId === null && item.salePrice === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "salePrice"], message: "Informe o preço de venda para produto novo." });
    });
  }),
});

const categoryInput = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(120),
  stockMinimum: z.number().min(0).max(999999999),
});

const closureDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida no formato AAAA-MM-DD.");
const cashClosingInput = z.object({
  closureDate: closureDateSchema,
  countedCash: z.number().min(0).max(999999999),
  countedDebit: z.number().min(0).max(999999999),
  countedCredit: z.number().min(0).max(999999999),
  countedPix: z.number().min(0).max(999999999),
  notes: z.string().trim().max(1000).optional(),
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
  categories: router({
    list: protectedProcedure.query(() => commerce.listCategories()),
    create: protectedProcedure.input(categoryInput).mutation(async ({ input }) => {
      try { return await commerce.createCategory(input); }
      catch (error) { throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) }); }
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: categoryInput })).mutation(async ({ input }) => {
      try { return await commerce.updateCategory(input.id, input.data); }
      catch (error) { throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) }); }
    }),
  }),
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().trim().max(120).optional(), categoryId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => commerce.listProducts(input?.search, input?.categoryId)),
    lowStock: protectedProcedure.query(() => commerce.listLowStockProducts()),
    byBarcode: protectedProcedure
      .input(z.object({ barcode: z.string().trim().min(1).max(32) }))
      .query(({ input }) => commerce.getProductByBarcode(input.barcode)),
    byScalePlu: protectedProcedure
      .input(z.object({ scalePlu: z.number().int().positive().max(999999) }))
      .query(({ input }) => commerce.getProductByScalePlu(input.scalePlu)),
    weightProductsForScale: protectedProcedure
      .input(z.object({ search: z.string().trim().max(120).optional() }).optional())
      .query(({ input }) => commerce.listWeightProductsForScalePlu(input?.search)),
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
    adjustStock: protectedProcedure
      .input(z.object({ productId: z.number().int().positive(), newQuantity: z.number().min(0).max(999999999), reason: z.string().trim().max(300).optional() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return await commerce.adjustProductStock({ ...input, adjustedBy: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage(error) });
        }
      }),
    updateScalePlu: protectedProcedure
      .input(z.object({ productId: z.number().int().positive(), scalePlu: z.number().int().positive().max(999999).nullable() }))
      .mutation(async ({ input }) => {
        try {
          return await commerce.updateProductScalePlu(input);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage(error) });
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
  nfe: router({
    import: protectedProcedure.input(nfeEntryInput).mutation(async ({ input, ctx }) => {
      try {
        return await commerce.importNfeEntry({ ...input, importedBy: ctx.user.id });
      } catch (error) {
        throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) });
      }
    }),
  }),
  scale: router({
    barcodeSettings: protectedProcedure.query(() => commerce.getScaleBarcodeSettings()),
  }),
  sales: router({
    recent: protectedProcedure.query(() => commerce.listRecentSales()),
    receipt: protectedProcedure.input(z.object({ saleId: z.number().int().positive() })).query(async ({ input }) => {
      try {
        return await commerce.getSaleReceipt(input.saleId);
      } catch (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: errorMessage(error) });
      }
    }),
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
          clientSaleId: z.string().uuid().optional(),
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
  cash: router({
    summary: protectedProcedure.input(z.object({ closureDate: closureDateSchema })).query(async ({ input }) => {
      try {
        return await commerce.getCashSummary(input.closureDate);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMessage(error) });
      }
    }),
    recentClosings: protectedProcedure.query(async () => {
      try {
        return await commerce.listCashClosings();
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMessage(error) });
      }
    }),
    closeDay: protectedProcedure.input(cashClosingInput).mutation(async ({ input, ctx }) => {
      try {
        return await commerce.closeCashDay({ ...input, closedBy: ctx.user.id });
      } catch (error) {
        throw new TRPCError({ code: "CONFLICT", message: errorMessage(error) });
      }
    }),
  }),
});
