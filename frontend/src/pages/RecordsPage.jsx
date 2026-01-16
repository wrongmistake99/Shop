import React, { useState, useEffect, useMemo } from 'react';

function RecordsPage() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'transactions'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real records from backend
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = process.env.REACT_APP_API_URL;

        // Safety check – very useful during deployment
        if (!apiBase) {
          throw new Error(
            'REACT_APP_API_URL is not defined in Vercel environment variables. ' +
            'Please set it to https://jurison.onrender.com'
          );
        }

        const url = `${apiBase}/api/records?type=${activeTab}`;

        console.log('Fetching records from:', url); // ← debug – remove later if desired

        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',           // important if using cookies / sessions
          headers: {
            'Content-Type': 'application/json',
            // If your backend later requires JWT:
            // 'Authorization': `Bearer ${yourTokenHere}`
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized – please log in again');
          }
          if (res.status === 404) {
            throw new Error('Records endpoint not found on backend');
          }
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load records');
        }

        setRecords(result.data || []);
      } catch (err) {
        console.error('Records fetch error:', err);
        setError(err.message || 'Failed to fetch records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [activeTab]);

  // Filtered records based on search
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;

    const lower = searchTerm.toLowerCase();

    return records.filter(record => {
      if (activeTab === 'inventory') {
        return (
          record.item?.toLowerCase().includes(lower) ||
          record.action?.toLowerCase().includes(lower) ||
          record.details?.toLowerCase().includes(lower)
        );
      } else {
        return (
          record.id?.toLowerCase().includes(lower) ||
          record.customer?.toLowerCase().includes(lower) ||
          record.amount?.includes(searchTerm)
        );
      }
    });
  }, [records, searchTerm, activeTab]);

  const getActionBadgeColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'added': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'edited': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'deleted':
      case 'deleted/out of stock': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'refunded':
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading records...</p>
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
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Records</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View history of inventory changes and transactions
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'inventory'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Inventory History
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); setSearchTerm(''); }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'transactions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Transaction History
          </button>
        </div>
      </div>

      {/* Header with Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTab === 'inventory' ? 'Inventory Changes' : 'Transaction History'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab === 'inventory' ? 'inventory' : 'transaction'} history...`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                {activeTab === 'inventory' ? (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.date}</td>
                  {activeTab === 'inventory' ? (
                    <>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(record.action)}`}>
                          {record.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.item}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{record.user}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{record.details}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.customer}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{record.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No matching records found.' : 'No records yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordsPage;