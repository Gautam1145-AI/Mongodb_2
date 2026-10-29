import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Calendar,
  Tag,
  ShieldCheck,
  Zap,
  X,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'CONCERT', label: 'Concerts & Festivals' },
  { id: 'SPORTS', label: 'Championship Sports' },
  { id: 'CONFERENCE', label: 'Tech & AI' },
  { id: 'THEATER', label: 'Broadway & Shows' },
  { id: 'COMEDY', label: 'Comedy Nights' },
];

const PRICE_TIERS = [
  { id: 'ALL', label: 'Any Price' },
  { id: 'UNDER_100', label: 'Under $100', max: 100 },
  { id: 'UNDER_200', label: '$100 - $200', min: 100, max: 200 },
  { id: 'VIP', label: '$200+ VIP', min: 200 },
];

export default function HomePage() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [priceTier, setPriceTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('eventDate');
  const [sortDir, setSortDir] = useState('asc');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: search.trim(),
        category: category !== 'ALL' ? category : undefined,
        sortBy,
        sortDir,
      };
      const data = await api.events.search(params);
      setEvents(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
      toast.error('Unable to fetch live event catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, sortBy, sortDir]);

  // Client-side price filter
  const filteredEvents = events.filter((ev) => {
    if (priceTier === 'ALL') return true;
    const tier = PRICE_TIERS.find((p) => p.id === priceTier);
    if (!tier) return true;
    const price = Number(ev.minPrice || 0);
    if (tier.min && tier.max) return price >= tier.min && price <= tier.max;
    if (tier.max) return price <= tier.max;
    if (tier.min) return price >= tier.min;
    return true;
  });

  const hasActiveFilters = search || category !== 'ALL' || priceTier !== 'ALL';

  const resetAllFilters = () => {
    setSearch('');
    setCategory('ALL');
    setPriceTier('ALL');
    setSortBy('eventDate');
    setSortDir('asc');
    toast.info('Filters have been reset.');
  };

  return (
    <div className="min-h-screen">
      {/* MNC Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-900 bg-gradient-to-b from-indigo-950/30 via-slate-950 to-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 mb-6 shadow-sm shadow-indigo-500/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Live Seat Selection &bull; 100% Guaranteed Reservations
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Discover &amp; Reserve <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Live Event Experiences
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 leading-relaxed">
            Book your tickets in real-time with instant reservation holds, interactive seating charts, and seamless instant booking confirmation.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-6">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event title, artist, venue, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-2xl text-sm transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Guaranteed Seat Protection
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              10-Minute Cart Hold Engine
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
              <Tag className="w-4 h-4 text-indigo-400" />
              Real-Time Interactive Seat Map
            </span>
          </div>
        </div>
      </section>

      {/* Main Events Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dynamic Controls Header */}
        <div className="space-y-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    category === cat.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [sb, sd] = e.target.value.split('-');
                  setSortBy(sb);
                  setSortDir(sd);
                }}
                className="bg-slate-900/90 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="eventDate-asc">Date: Upcoming First</option>
                <option value="eventDate-desc">Date: Furthest First</option>
                <option value="title-asc">Title: A &rarr; Z</option>
                <option value="minPrice-asc">Price: Lowest First</option>
                <option value="minPrice-desc">Price: Highest First</option>
              </select>
            </div>
          </div>

          {/* Quick Price Filters Bar & Results Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Price:
              </span>
              {PRICE_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setPriceTier(tier.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    priceTier === tier.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tier.label}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="ml-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 underline transition-colors"
                >
                  <X className="w-3 h-3" /> Reset all
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="font-bold text-white">{filteredEvents.length}</span> live experience{filteredEvents.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner message="Loading curated live events..." size="large" />
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Failed to Load Events</h3>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 rounded-xl btn-dynamic-secondary inline-flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Experiences Found</h3>
            <p className="text-sm text-slate-400 mb-6">
              No published events match your selected filters. Try broadening your criteria.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-5 py-2.5 btn-dynamic-primary text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
