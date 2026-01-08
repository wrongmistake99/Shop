// src/routes/transactions.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/transactions - Fetch transactions with embedded items
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(tx => ({
      id: tx.transaction_number || tx.id,
      date: new Date(tx.created_at).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customer: tx.customer_name || 'Walk-in Customer',
      payment: tx.payment_method 
        ? tx.payment_method.replace('_', ' ').charAt(0).toUpperCase() + tx.payment_method.slice(1)
        : 'Cash',
      total: Number(tx.total_amount).toFixed(2),
      status: tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Completed',
      items: tx.items || []  // From JSONB column
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('GET /api/transactions error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch transactions'
    });
  }
});

// POST /api/transactions - Create transaction + safe stock deduction
router.post('/', async (req, res) => {
  let {
    customer_name = 'Walk-in Customer',
    customer_phone = null,
    payment_method = 'cash',
    total_amount,
    notes = null,
    items = []
  } = req.body;

  // Validation
  if (!total_amount || isNaN(total_amount) || Number(total_amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'total_amount is required and must be a positive number'
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one item must be included'
    });
  }

  total_amount = Number(total_amount);

  try {
    // Generate transaction number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = String(Math.floor(1000 + Math.random() * 9000));
    const transaction_number = `TXN-${dateStr}-${random}`;

    // Insert transaction with items as JSONB
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_number,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() || null,
        payment_method,
        total_amount,
        items,  // Full items array saved here
        status: 'completed',
        notes: notes?.trim() || null
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction insert error:', txError);
      throw txError;
    }

    // Deduct stock using safe PostgreSQL function
    for (const item of items) {
      const qty = Number(item.quantity);
      if (qty > 0) {
        const { error: rpcError } = await supabase
          .rpc('safe_decrement_stock', {
            p_sku: item.sku,
            p_quantity: qty
          });

        if (rpcError) {
          console.warn(`Failed to deduct stock for SKU ${item.sku}:`, rpcError.message);
          // Don't fail transaction — just warn
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...transaction,
        items: transaction.items || []
      }
    });

  } catch (err) {
    console.error('POST /api/transactions error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create transaction'
    });
  }
});

export default router;