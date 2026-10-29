import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  DollarSign,
  Ticket,
  Calendar,
  XCircle,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export default function AdminDashboardPage() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [eventSales, setEventSales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ov, evs, cat, daily, rec] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getEvents(),
        api.analytics.getRevenueByCategory(),
        api.analytics.getDailySales(),
        api.bookings.getAllAdmin({ page: 0, size: 8 }),
      ]);
      setOverview(ov);
      setEventSales(evs || []);
      setCategorySales(cat || []);
      setDailySales(daily || []);
      setRecentBookings(rec.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load aggregation analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <LoadingSpinner message="Loading sales &amp; reservation metrics..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Analytics Error</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Live Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-indigo-400" />
            Executive Sales &amp; Reservation Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time revenue, booking conversion, and seat occupancy metrics.
          </p>
        </div>

        <button
          onClick={async () => {
            await fetchAnalytics();
            toast.success('Analytics KPIs updated in real-time!');
          }}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-bold btn-dynamic-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Confirmed Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            ${overview?.totalRevenue ? Number(overview.totalRevenue).toFixed(2) : '0.00'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Gross from CONFIRMED</p>
        </div>

        {/* Tickets Sold */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tickets Sold</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {overview?.confirmedTickets || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">From {overview?.confirmedBookings || 0} orders</p>
        </div>

        {/* Active Events */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Events</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {overview?.totalEvents || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">In inventory</p>
        </div>

        {/* Available Seats */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Available Seats</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {overview?.availableSeats || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Of {overview?.totalSeats || 0} total seats</p>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cancellation Rate</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">
            {overview?.cancellationRate ? overview.cancellationRate : '0.0'}%
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">{overview?.cancelledBookings || 0} cancellations</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Revenue & Bookings Trend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Sales &amp; Revenue Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily ticket volume and gross proceeds</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {dailySales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No historical sales records yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Revenue by Event Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                Revenue by Category Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution across concert, sports, conference, and comedy</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categorySales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category sales recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={5}
                    label={(entry) => `${entry.category}: $${entry.revenue}`}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Events Sales Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Event-Wise Ticket Sales &amp; Occupancy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time occupancy percentage and revenue per event</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Event Title</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Orders</th>
                <th className="pb-3 font-semibold text-right">Tickets Sold</th>
                <th className="pb-3 font-semibold text-right">Gross Revenue</th>
                <th className="pb-3 font-semibold text-right">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {eventSales.map((item) => (
                <tr key={item.eventId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-semibold text-white max-w-xs truncate">{item.eventTitle}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-[10px] text-indigo-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">{item.confirmedBookings}</td>
                  <td className="py-3 text-right font-mono text-slate-300">{item.ticketsSold} / {item.totalCapacity}</td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    ${Number(item.revenue).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${item.occupancyRate}%` }}
                        />
                      </div>
                      <span>{item.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white">Recent Booking Activity (Audit Log)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Event</th>
                <th className="pb-3 font-semibold">Seats</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-indigo-400">{b.bookingRef}</td>
                  <td className="py-3 text-slate-300">
                    <div>{b.userName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{b.userEmail}</div>
                  </td>
                  <td className="py-3 text-white max-w-xs truncate">{b.eventTitle}</td>
                  <td className="py-3 font-mono text-slate-400">{b.seatNumbers?.join(', ')}</td>
                  <td className="py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    ${Number(b.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

