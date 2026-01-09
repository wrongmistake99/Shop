// src/routes/records.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/records?type=inventory|transactions
router.get('/', async (req, res) => {
  const { type = 'inventory' } = req.query;

  try {
    if (type === 'inventory') {
      // Recent product changes (created/updated)
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          stock_quantity,
          retail_price
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const records = (products || []).map(p => {
        const created = new Date(p.created_at);
        const updated = new Date(p.updated_at);
        const isNew = Math.abs(updated - created) < 10000; // ~10 seconds

        let action = 'Edited';
        let details = `Stock updated to ${p.stock_quantity} units`;

        if (isNew) {
          action = 'Added';
          details = `New product • ₱${Number(p.retail_price || 0).toFixed(2)} retail • Stock: ${p.stock_quantity}`;
        } else if (p.stock_quantity === 0) {
          action = 'Out of Stock';
          details = 'Stock reached zero';
        }

        return {
          date: updated.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          action,
          item: p.name || 'Unnamed Product',
          user: 'System/Admin',
          details
        };
      });

      return res.json({ success: true, data: records });
    }

    if (type === 'transactions') {
      const { data: txs, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          customer_name,
          total_amount,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const records = (txs || []).map(tx => ({
        date: new Date(tx.created_at).toLocaleString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        id: tx.transaction_number || tx.id.substring(0, 8).toUpperCase(),
        customer: tx.customer_name || 'Walk-in Customer',
        amount: `₱${Number(tx.total_amount || 0).toFixed(2)}`,
        status: tx.status 
          ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) 
          : 'Completed'
      }));

      return res.json({ success: true, data: records });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid type. Use ?type=inventory or ?type=transactions'
    });

  } catch (err) {
    console.error('Records API error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  }
});

export default router;