import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/dashboard');
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load dashboard data');
        }

        setDashboardData(result.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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

  const d = dashboardData;

  // ── Chart: Most Sold Parts ─────────────────────────────────────────────────
  const mostSoldData = {
    labels: d.topSoldParts.map(p => p.name),
    datasets: [{
      label: 'Units Sold',
      data: d.topSoldParts.map(p => p.quantity),
      backgroundColor: 'rgba(59, 130, 246, 0.85)',
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const mostSoldOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.parsed.x} units sold`
        }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { display: false }, ticks: { color: '#374151' } },
    },
  };

  // ── Chart: Current Month Daily Gross Profit ────────────────────────────────
  const currentMonthYear = new Date().toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric'
  });

  // Generate days 1 to current day of month
  const today = new Date();
  const daysInMonth = today.getDate();
  const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

  const dailyProfits = d.currentMonthDailyProfits || new Array(daysInMonth).fill(0);

  const dailyProfitData = {
    labels: dailyLabels,
    datasets: [{
      label: 'Daily Gross Profit',
      data: dailyProfits,
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: '#10b981',
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const dailyProfitOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `₱${ctx.parsed.y.toLocaleString('en-PH')}`
        }
      },
      title: {
        display: true,
        text: `Daily Gross Profit - ${currentMonthYear}`,
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(156,163,175,0.15)' },
        ticks: {
          color: '#6b7280',
          callback: (value) => '₱' + Number(value).toLocaleString('en-PH')
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' },
      },
    },
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Business overview • {new Date().toLocaleDateString('en-PH')}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Capital Cost"
          value={`₱${Number(d.totalCapitalRevenue || 0).toLocaleString('en-PH')}`}
          subtitle="Cost of goods sold"
          iconColor="amber"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />

        <StatCard
          title="Total Retail Revenue"
          value={`₱${Number(d.totalRetailRevenue || 0).toLocaleString('en-PH')}`}
          subtitle="Sales income"
          iconColor="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <StatCard
          title="Total Parts"
          value={Number(d.totalParts || 0).toLocaleString('en-PH')}
          subtitle="Products in inventory"
          iconColor="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <StatCard
          title="Low Stock Items"
          value={d.lowStockCount || 0}
          subtitle="Need attention"
          iconColor="red"
          valueColor="text-red-600 dark:text-red-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Most Sold Parts" subtitle="Top 5 products by units sold">
          <div className="h-80">
            <Bar data={mostSoldData} options={mostSoldOptions} />
          </div>
        </ChartCard>

        <ChartCard 
          title="Current Month Daily Gross Profit" 
          subtitle={`Daily profit breakdown - ${currentMonthYear}`}
        >
          <div className="h-80">
            <Bar 
              data={dailyProfitData} 
              options={dailyProfitOptions} 
            />
          </div>
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products - No Revenue Column */}
        <TableCard title="Top Selling Products" subtitle="Ranked by units sold">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {d.topSoldParts?.length > 0 && d.topSoldParts[0].name !== 'No sales yet' ? (
                d.topSoldParts.map((part, index) => (
                  <tr key={index} className={index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{part.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">{part.quantity?.toLocaleString('en-PH')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    No sales recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>

        {/* Low Stock Alert */}
        <TableCard title="Low Stock Alert" subtitle="Items that need restocking">
          {d.lowStockItems?.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {d.lowStockItems.map((item, i) => (
                  <tr key={i} className={item.stock <= 5 ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600 dark:text-red-400">
                      {item.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">No low stock items at the moment ✓</p>
              <p className="text-sm mt-2">All products have sufficient stock (threshold: 10)</p>
            </div>
          )}
        </TableCard>
      </div>
    </div>
  );
}

// ── Reusable Components ───────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon, iconColor = "blue", valueColor = "" }) {
  const colors = {
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[iconColor] || colors.blue}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${valueColor || 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function TableCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default DashboardPage;