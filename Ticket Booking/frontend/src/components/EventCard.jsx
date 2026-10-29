import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Heart, Eye, Flame, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function EventCard({ event }) {
  const {
    id,
    title,
    category,
    venue,
    location,
    eventDate,
    startTime,
    minPrice,
    availableSeats,
    totalSeats,
    bannerUrl
  } = event;

  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const percentAvailable = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0;
  const isSoldOut = availableSeats === 0;
  const isSellingFast = !isSoldOut && percentAvailable <= 30;

  const fallbackBanner = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success(`Saved "${title}" to your wishlist!`);
    } else {
      toast.info(`Removed "${title}" from wishlist.`);
    }
  };

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'CONCERT':
        return 'text-purple-300 border-purple-500/30 bg-purple-950/40';
      case 'SPORTS':
        return 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40';
      case 'CONFERENCE':
        return 'text-blue-300 border-blue-500/30 bg-blue-950/40';
      case 'THEATER':
        return 'text-amber-300 border-amber-500/30 bg-amber-950/40';
      default:
        return 'text-indigo-300 border-indigo-500/30 bg-indigo-950/40';
    }
  };

  return (
    <>
      <div className="group relative bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-700/80 transition-all duration-300 flex flex-col transform hover:-translate-y-1">
        {/* Banner Area */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-950">
          <img
            src={bannerUrl || fallbackBanner}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => { e.target.src = fallbackBanner; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Floating Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {/* Category Pill */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border flex items-center gap-1.5 shadow-md ${getCategoryTheme(category)}`}>
              <Sparkles className="w-3 h-3 text-current" />
              {category}
            </span>

            {/* Action Buttons: Quick View & Wishlist */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickView(true);
                }}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95"
                title="Quick Preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleToggleSave}
                className={`w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 ${
                  isSaved
                    ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/30'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Selling Fast Pulse Badge */}
          {isSellingFast && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-rose-950/80 backdrop-blur-md border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 shadow-md animate-pulse">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Selling Fast!</span>
            </div>
          )}

          {/* Price Tag */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-right shadow-md">
            <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">From</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              ${minPrice ? Number(minPrice).toFixed(0) : '0'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2.5">
              {title}
            </h3>

            <div className="space-y-2 text-xs text-slate-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-300">
                  {new Date(eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-slate-600">&bull;</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="line-clamp-1 text-slate-300">{venue}, {location}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Availability Progress Indicator */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Availability</span>
                <span className={`font-mono text-xs ${isSoldOut ? 'text-rose-400 font-bold' : isSellingFast ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                  {isSoldOut ? 'Sold Out' : `${availableSeats} of ${totalSeats} left`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    isSoldOut
                      ? 'bg-rose-500'
                      : percentAvailable < 25
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${percentAvailable}%` }}
                />
              </div>
            </div>

            {/* Dynamic CTA Button */}
            <Link
              to={`/events/${id}`}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isSoldOut
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'
                  : 'btn-dynamic-primary'
              }`}
            >
              <span>{isSoldOut ? 'Event Sold Out' : 'Select Seats'}</span>
              {!isSoldOut && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Quick View Modal */}
      {showQuickView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowQuickView(false)}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
              <img
                src={bannerUrl || fallbackBanner}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <button
                onClick={() => setShowQuickView(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 inline-block">
              {category}
            </span>

            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>

            <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{venue}, {location}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>{availableSeats} seats remaining &bull; Starting from ${Number(minPrice).toFixed(0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuickView(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/events/${id}`}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold btn-dynamic-primary"
              >
                Choose Seats &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
