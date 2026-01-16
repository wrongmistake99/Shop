import React, { useState, useEffect, useMemo } from 'react';

function TransactionsPage() {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state for new transaction
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedItems, setSelectedItems] = useState([]); // [{ part, quantity }]

  // Search for adding products in modal
  const [productSearch, setProductSearch] = useState('');

  // Confirmation modal for refund
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [txToRefund, setTxToRefund] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, txRes] = await Promise.all([
          fetch('http://localhost:5000/api/products'),
          fetch('http://localhost:5000/api/transactions'),
        ]);

        if (!prodRes.ok || !txRes.ok) throw new Error('Failed to load data');

        const prodData = await prodRes.json();
        const txData = await txRes.json();

        if (!prodData.success || !txData.success) {
          throw new Error(prodData.error || txData.error || 'Unknown error');
        }

        setInventory(prodData.data.map(p => ({
          sku: p.sku,
          name: p.name,
          retail_price: Number(p.retail_price || 0),
          stock: Number(p.stock_quantity),
        })));

        setTransactions(txData.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Summary stats
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const avgTransaction = totalTransactions > 0 
    ? (totalRevenue / totalTransactions).toFixed(2) 
    : '0.00';

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const lower = searchTerm.toLowerCase();
    return transactions.filter(t =>
      t.transaction_number?.toLowerCase().includes(lower) ||
      t.customer?.toLowerCase().includes(lower) ||
      t.payment?.toLowerCase().includes(lower)
    );
  }, [transactions, searchTerm]);

  // Filter products in modal by search
  const filteredInventory = useMemo(() => {
    if (!productSearch.trim()) return inventory;
    const term = productSearch.toLowerCase();
    return inventory.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)
    );
  }, [inventory, productSearch]);

  // Cart functions
  const addItemToCart = (part) => {
    if (part.stock <= 0) return;
    setSelectedItems(prev => {
      const existing = prev.find(i => i.part.sku === part.sku);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > part.stock) return prev;
        return prev.map(i => i.part.sku === part.sku ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  const updateQuantity = (sku, qty) => {
    if (qty < 1) {
      setSelectedItems(prev => prev.filter(i => i.part.sku !== sku));
      return;
    }
    setSelectedItems(prev => prev.map(i =>
      i.part.sku === sku 
        ? { ...i, quantity: Math.min(qty, i.part.stock) }
        : i
    ));
  };

  const cartTotal = selectedItems.reduce((sum, item) => 
    sum + (item.part.retail_price * item.quantity), 0
  );

  const handleSaveTransaction = async () => {
    if (selectedItems.length === 0) return;

    const payload = {
      customer_name: customerName.trim() || 'Walk-in Customer',
      customer_phone: customerPhone.trim() || null,
      payment_method: paymentMethod,
      total_amount: cartTotal,
      notes: null,                    // ← removed / always null now
      items: selectedItems.map(i => ({
        sku: i.part.sku,
        name: i.part.name,
        retail_price: i.part.retail_price,
        quantity: i.quantity,
      })),
    };

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save transaction');
      }

      // Refresh
      const [txRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/transactions'),
        fetch('http://localhost:5000/api/products'),
      ]);

      const newTx = await txRes.json();
      const newProd = await prodRes.json();

      setTransactions(newTx.data);
      setInventory(newProd.data.map(p => ({
        sku: p.sku,
        name: p.name,
        retail_price: Number(p.retail_price || 0),
        stock: Number(p.stock_quantity),
      })));

      setSuccessMessage(`Transaction completed! Total: ₱${cartTotal.toFixed(2)}`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 4000);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setSelectedItems([]);
      setProductSearch('');
      setIsModalOpen(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Refund / Delete transaction
  const initiateRefund = (tx) => {
    setTxToRefund(tx);
    setShowRefundConfirm(true);
  };

  const confirmRefund = async () => {
    if (!txToRefund) return;

    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${txToRefund.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // backend handles refund logic
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Refund failed');
      }

      // Refresh
      const [txRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/transactions'),
        fetch('http://localhost:5000/api/products')
      ]);

      const newTx = await txRes.json();
      const newProd = await prodRes.json();

      setTransactions(newTx.data);
      setInventory(newProd.data.map(p => ({
        sku: p.sku,
        name: p.name,
        retail_price: Number(p.retail_price || 0),
        stock: Number(p.stock_quantity),
      })));

      setSuccessMessage(`Transaction ${txToRefund.transaction_number} refunded successfully. Stock restored.`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 4000);
    } catch (err) {
      alert('Refund error: ' + err.message);
    }

    setShowRefundConfirm(false);
    setTxToRefund(null);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading shop data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 text-2xl font-bold mb-4">Error</p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View and create sales transactions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition flex items-center gap-2 shadow-sm w-full md:w-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTransactions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Transaction</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₱{avgTransaction}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Transactions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{filteredTransactions.length} records</p>
            </div>
            <div className="relative max-w-md w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by #, customer, payment..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{tx.transaction_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{tx.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{tx.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{tx.payment}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">₱{tx.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      tx.status.toLowerCase() === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : tx.status.toLowerCase() === 'refunded'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-3 justify-end">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                      View
                    </button>
                    {tx.status.toLowerCase() === 'completed' && (
                      <button
                        onClick={() => initiateRefund(tx)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setSelectedTx(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-6">Transaction Receipt</h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">ID:</span> <strong>{selectedTx.transaction_number}</strong></div>
                <div><span className="text-gray-500">Date:</span> <strong>{selectedTx.date}</strong></div>
              </div>
              <div><span className="text-gray-500">Customer:</span> <strong>{selectedTx.customer}</strong></div>
              <div><span className="text-gray-500">Payment:</span> <strong>{selectedTx.payment}</strong></div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 text-base">Items Purchased</h3>
                {(selectedTx.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-b-0">
                    <span>{item.quantity} × {item.name} (₱{item.retail_price.toFixed(2)} each)</span>
                    <span className="font-medium">₱{(item.quantity * item.retail_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">₱{selectedTx.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">New Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Form + Product Search */}
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0917..."
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* ← Replaced Notes with Product Search */}
                <div className="mb-6 relative">
                  <label className="block text-sm font-medium mb-1">Search Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Type product name or SKU..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Available Products</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {filteredInventory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {productSearch ? "No matching products" : "No products available"}
                    </p>
                  ) : (
                    filteredInventory.map((part) => (
                      <div
                        key={part.sku}
                        className="flex justify-between items-center p-4 border rounded-lg hover:border-blue-500 transition"
                      >
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-gray-600">
                            ₱{part.retail_price.toFixed(2)} • Stock:{' '}
                            <span className={part.stock <= 10 ? 'text-red-600 font-bold' : ''}>
                              {part.stock}
                            </span>
                            {part.stock <= 10 && ' (Low)'}
                          </p>
                        </div>
                        <button
                          onClick={() => addItemToCart(part)}
                          disabled={part.stock === 0}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg disabled:cursor-not-allowed transition"
                        >
                          {part.stock === 0 ? 'Out of Stock' : 'Add'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Cart Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Cart Summary</h3>
                {selectedItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {selectedItems.map((item) => (
                        <div key={item.part.sku} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{item.part.name}</p>
                              <p className="text-sm text-gray-600">₱{item.part.retail_price.toFixed(2)} each</p>
                            </div>
                            <button
                              onClick={() => setSelectedItems(prev => prev.filter(i => i.part.sku !== item.part.sku))}
                              className="text-red-600 hover:text-red-800 text-sm transition"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <input
                              type="number"
                              min="1"
                              max={item.part.stock}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.part.sku, parseInt(e.target.value) || 1)}
                              className="w-24 px-3 py-2 border rounded text-center dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xl font-bold text-blue-600">
                              ₱{(item.part.retail_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex justify-between text-3xl font-bold">
                        <span>Total</span>
                        <span className="text-blue-600">₱{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTransaction}
                disabled={selectedItems.length === 0}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg disabled:cursor-not-allowed transition"
              >
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundConfirm && txToRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-red-600 mb-4">Refund Transaction?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to refund transaction <strong>{txToRefund.transaction_number}</strong>?<br/>
              This will restore the stock quantities and mark the transaction as refunded.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setShowRefundConfirm(false);
                  setTxToRefund(null);
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefund}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in scale-in">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Success!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsPage;