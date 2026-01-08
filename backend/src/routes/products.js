// src/routes/products.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/products?id=eq.{uuid}
router.patch('/', async (req, res) => {
  try {
    let productId = req.query.id;

    // Handle both formats: ?id=uuid and ?id=eq.uuid
    if (productId?.startsWith('eq.')) {
      productId = productId.substring(3); // remove "eq."
    }

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Missing or invalid id' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('PATCH error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/products?id=eq.{uuid}
router.delete('/', async (req, res) => {
  try {
    let productId = req.query.id;

    // Handle both formats: ?id=uuid and ?id=eq.uuid
    if (productId?.startsWith('eq.')) {
      productId = productId.substring(3);
    }

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Missing or invalid id' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;