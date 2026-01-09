import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/transactions - Fetch all transactions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(tx => ({
      id: tx.id,
      transaction_number: tx.transaction_number,
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
      items: tx.items || []  // array of { sku, name, retail_price, quantity }
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('GET /api/transactions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
  let {
    customer_name = 'Walk-in Customer',
    customer_phone = null,
    payment_method = 'cash',
    total_amount,
    notes = null,
    items = []
  } = req.body;

  if (!total_amount || isNaN(total_amount) || Number(total_amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid total_amount' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one item required' });
  }

  total_amount = Number(total_amount);

  try {
    // Generate transaction number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = String(Math.floor(1000 + Math.random() * 9000));
    const transaction_number = `TXN-${dateStr}-${random}`;

    // Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_number,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() || null,
        payment_method,
        total_amount,
        items, // [{ sku, name, retail_price, quantity }]
        status: 'completed',
        notes: notes?.trim() || null
      })
      .select()
      .single();

    if (txError) throw txError;

    // Deduct stock (safe decrement)
    for (const item of items) {
      const qty = Number(item.quantity);
      if (qty > 0) {
        await supabase.rpc('safe_decrement_stock', {
          p_sku: item.sku,
          p_quantity: qty
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: transaction.id,
        transaction_number: transaction.transaction_number,
        date: new Date(transaction.created_at).toLocaleDateString('en-PH', { 
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        customer: transaction.customer_name || 'Walk-in Customer',
        payment: transaction.payment_method,
        total: Number(transaction.total_amount).toFixed(2),
        status: 'Completed',
        items: transaction.items
      }
    });

  } catch (err) {
    console.error('POST transaction error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/transactions/:id - Refund / Delete transaction (soft delete + restore stock)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get transaction first
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('items, status')
      .eq('id', id)
      .single();

    if (fetchError || !tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (tx.status === 'refunded') {
      return res.status(400).json({ success: false, error: 'Transaction already refunded' });
    }

    // Restore stock
    for (const item of tx.items || []) {
      const qty = Number(item.quantity);
      if (qty > 0) {
        await supabase.rpc('safe_increment_stock', {
          p_sku: item.sku,
          p_quantity: qty
        });
      }
    }

    // Mark as refunded
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'refunded' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Transaction refunded and stock restored' });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;