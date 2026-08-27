import { getDashboardSummary, listLowStockProducts, listProducts, listRecentSales } from "../server/commerce";

const [products, lowStock, recentSales, dashboard] = await Promise.all([
  listProducts(),
  listLowStockProducts(),
  listRecentSales(),
  getDashboardSummary(),
]);

console.log(JSON.stringify({
  products: products.length,
  lowStock: lowStock.length,
  recentSales: recentSales.length,
  dashboardProducts: dashboard.activeProducts,
}, null, 2));
