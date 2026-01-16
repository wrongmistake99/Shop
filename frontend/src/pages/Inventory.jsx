import React, { useState, useRef, useEffect, useMemo } from 'react';

function InventoryPage() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successAction, setSuccessAction] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch real products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Unknown error from server');
        }

        const formattedParts = result.data.map(product => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category_name || 'Uncategorized',
          description: product.description || '',
          capital_price: Number(product.capital_price || 0),
          retail_price: Number(product.retail_price || 0),
          stock: Number(product.stock_quantity),
          status: Number(product.stock_quantity) <= 10 ? 'low-stock' : 'in-stock'
        }));

        setParts(formattedParts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Refresh products after CRUD operations
  const refreshProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const result = await response.json();
      if (result.success) {
        const formatted = result.data.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category_name || 'Uncategorized',
          description: p.description || '',
          capital_price: Number(p.capital_price || 0),
          retail_price: Number(p.retail_price || 0),
          stock: Number(p.stock_quantity),
          status: Number(p.stock_quantity) <= 10 ? 'low-stock' : 'in-stock'
        }));
        setParts(formatted);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentPart(null);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const openEditModal = (part) => {
    setIsEditMode(true);
    setCurrentPart(part);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const partData = {
      name: formData.get('partName')?.trim(),
      category_name: formData.get('category')?.trim(),
      description: formData.get('description')?.trim() || null,
      capital_price: parseFloat(formData.get('capitalPrice')) || 0,
      retail_price: parseFloat(formData.get('retailPrice')) || 0,
      stock_quantity: parseInt(formData.get('stock'))
    };

    // Only include SKU when creating new product
    if (!isEditMode) {
      const sku = formData.get('sku')?.trim();
      if (!sku) {
        alert('SKU is required for new products');
        return;
      }
      partData.sku = sku;
    }

    try {
      let response;

      if (isEditMode) {
        response = await fetch(`http://localhost:5000/api/products?id=${currentPart.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partData)
        });
        setSuccessMessage(`"${partData.name}" updated successfully!`);
        setSuccessAction('updated');
      } else {
        response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partData)
        });
        setSuccessMessage(`"${partData.name}" added successfully!`);
        setSuccessAction('added');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      await refreshProducts();
      setIsModalOpen(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }

    e.target.reset();
  };

  const handleDeleteConfirm = (part) => {
    setPartToDelete(part);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const confirmDelete = async () => {
    if (!partToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products?id=${partToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      await refreshProducts();

      setSuccessMessage(`"${partToDelete.name}" deleted successfully!`);
      setSuccessAction('deleted');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }

    setShowDeleteModal(false);
    setPartToDelete(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredParts = useMemo(() => {
    if (!searchTerm.trim()) return parts;
    const lower = searchTerm.toLowerCase();
    return parts.filter(p =>
      p.sku.toLowerCase().includes(lower) ||
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
    );
  }, [parts, searchTerm]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading inventory...</p>
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
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your motorcycle parts inventory</p>
      </div>

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Parts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{parts.length} total items</p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Part
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, name, category, or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capital Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retail Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{part.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{part.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{part.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                    {part.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    ₱{part.capital_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    ₱{part.retail_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{part.stock}</span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          part.status === 'in-stock'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {part.status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative" ref={openDropdown === part.id ? dropdownRef : null}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === part.id ? null : part.id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openDropdown === part.id && (
                      <div className="absolute right-4 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                        <button
                          onClick={() => openEditModal(part)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(part)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isEditMode ? 'Edit Part' : 'Add New Part'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {isEditMode ? 'Update part details' : 'Add a new motorcycle part to your inventory'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Part Name</label>
                <input
                  type="text"
                  name="partName"
                  defaultValue={isEditMode ? currentPart?.name : ''}
                  placeholder="e.g., Engine Oil Filter"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  defaultValue={isEditMode ? currentPart?.category : ''}
                  placeholder="e.g., Filters, Brakes, Engine"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={isEditMode ? currentPart?.description : ''}
                  placeholder="e.g., High-quality oil filter for motorcycle engines"
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={isEditMode ? currentPart?.sku : ''}
                    placeholder="e.g., FOF-001"
                    required={!isEditMode}
                    disabled={isEditMode}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={isEditMode ? currentPart?.stock : ''}
                    min="0"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capital Price (₱)</label>
                  <input
                    type="number"
                    name="capitalPrice"
                    defaultValue={isEditMode ? currentPart?.capital_price : '0'}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price (₱)</label>
                  <input
                    type="number"
                    name="retailPrice"
                    defaultValue={isEditMode ? currentPart?.retail_price : '0'}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition shadow-sm"
                >
                  {isEditMode ? 'Update Part' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && partToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowDeleteModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 p-6 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Delete Part?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 text-center">
              Are you sure you want to delete <strong>"{partToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition shadow-sm flex-1"
              >
                Delete Part
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Part {successAction === 'deleted' ? 'Deleted' : successAction === 'updated' ? 'Updated' : 'Added'} Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {successMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;