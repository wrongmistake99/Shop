// src/routes/dashboard.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    console.log('Dashboard API called');

    // 1. Fetch all completed transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, total_amount, created_at, items')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (txError) {
      console.error('Transactions fetch error:', txError.message);
      throw txError;
    }

    const txList = transactions || [];

    // 2. Total retail revenue (what customers actually paid)
    const totalRetailRevenue = txList.reduce((sum, tx) => 
      sum + Number(tx.total_amount || 0), 0);

    // 3. Total products count
    const { count: totalParts = 0 } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    // 4. Low stock items
    const LOW_STOCK_THRESHOLD = 10;
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('name, stock_quantity')
      .lte('stock_quantity', LOW_STOCK_THRESHOLD)
      .order('stock_quantity', { ascending: true });

    const lowStockItems = (lowStockProducts || []).map(p => ({
      name: p.name || 'Unnamed Product',
      stock: Number(p.stock_quantity || 0)
    }));

    // ── 5. Calculate capital cost & total profit ─────────────────────────────
    let totalCapitalCost = 0;

    // Collect all unique SKUs from transactions
    const allSkus = new Set();
    txList.forEach(tx => {
      if (Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          if (item?.sku) allSkus.add(item.sku.trim());
        });
      }
    });

    // Bulk fetch products with capital prices
    const { data: products } = await supabase
      .from('products')
      .select('sku, capital_price')
      .in('sku', Array.from(allSkus));

    const productMap = new Map(products.map(p => [p.sku, Number(p.capital_price || 0)]));

    // Calculate capital cost per transaction
    txList.forEach(tx => {
      if (!Array.isArray(tx.items)) return;

      let txCapitalCost = 0;

      tx.items.forEach(item => {
        const sku = item?.sku?.trim();
        if (!sku) return;

        const capitalPrice = productMap.get(sku) || 0;
        const quantity = Number(item.quantity || 1); // Default to 1 if missing

        txCapitalCost += capitalPrice * quantity;
      });

      totalCapitalCost += txCapitalCost;
    });

    const totalGrossProfit = totalRetailRevenue - totalCapitalCost;

    // ── 6. Daily gross profit for CURRENT MONTH only ─────────────────────────
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Initialize array: index 0 = day 1, index 1 = day 2, ..., up to today
    const dailyProfits = new Array(daysInCurrentMonth).fill(0);

    txList.forEach(tx => {
      const txDate = new Date(tx.created_at);
      if (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      ) {
        const dayOfMonth = txDate.getDate() - 1; // 0-based index

        // Retail revenue for this transaction
        const retail = Number(tx.total_amount || 0);

        // Capital cost for this transaction
        let txCapital = 0;
        if (Array.isArray(tx.items)) {
          tx.items.forEach(item => {
            const sku = item?.sku?.trim();
            if (!sku) return;
            const capitalPrice = productMap.get(sku) || 0;
            const qty = Number(item.quantity || 1);
            txCapital += capitalPrice * qty;
          });
        }

        const dailyProfit = retail - txCapital;

        // Add to the correct day
        dailyProfits[dayOfMonth] += dailyProfit;
      }
    });

    // ── 7. Top 5 sold products (by quantity) ────────────────────────────────
    const skuCountMap = {};
    txList.forEach(tx => {
      if (!Array.isArray(tx.items)) return;
      tx.items.forEach(item => {
        const sku = item?.sku?.trim();
        if (sku) {
          skuCountMap[sku] = (skuCountMap[sku] || 0) + (Number(item.quantity) || 1);
        }
      });
    });

    const topSoldSkus = Object.entries(skuCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sku]) => sku);

    const { data: topProducts } = await supabase
      .from('products')
      .select('sku, name')
      .in('sku', topSoldSkus);

    const topSoldParts = topSoldSkus.map(sku => {
      const product = topProducts?.find(p => p.sku === sku);
      const quantity = skuCountMap[sku] || 0;
      return {
        name: product?.name || `Unknown (${sku})`,
        quantity,
      };
    });

    const fallbackPart = { name: 'No sales yet', quantity: 0 };

    // Final response
    res.json({
      success: true,
      data: {
        totalCapitalRevenue: Number(totalCapitalCost.toFixed(2)),
        totalRetailRevenue: Number(totalRetailRevenue.toFixed(2)),
        totalGrossProfit: Number(totalGrossProfit.toFixed(2)),
        totalParts: totalParts || 0,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.length > 0 ? lowStockItems : [],
        topSoldParts: topSoldParts.length > 0 ? topSoldParts : [fallbackPart],
        currentMonthDailyProfits: dailyProfits.map(v => Number(v.toFixed(2)))
      }
    });

  } catch (err) {
    console.error('Dashboard API error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  }
});

export default router;