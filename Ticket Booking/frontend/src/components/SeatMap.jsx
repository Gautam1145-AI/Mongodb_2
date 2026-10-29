import React, { useState, useEffect } from 'react';
import { Clock, Check, Lock, Sparkles, Filter, Info, ShieldCheck, Tag } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SeatMap({
  seats,
  selectedSeats,
  onToggleSeat,
  holdExpiresAt,
  onHoldExpired
}) {
  const toast = useToast();
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Extract unique categories
  const categories = Array.from(new Set(seats.map(s => s.categoryCode)));

  // Countdown timer calculation
  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(holdExpiresAt).getTime();
      const distance = target - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        toast.error('Your temporary reservation hold has expired. Seats released.');
        if (onHoldExpired) onHoldExpired();
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, onHoldExpired]);

  const formatTimer = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const timerPercent = timeLeft !== null ? Math.min(100, (timeLeft / 600) * 100) : 0;

  const getSeatColor = (seat, isSelected, isDimmed) => {
    if (isSelected) {
      return 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-300 ring-4 ring-indigo-500/40 scale-110 shadow-lg shadow-indigo-500/40 z-10';
    }
    if (seat.status === 'BOOKED') {
      return 'bg-slate-900/60 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-40';
    }
    if (seat.status === 'HELD' && !seat.heldByMe) {
      return 'bg-amber-950/40 text-amber-500 border-amber-600/40 cursor-not-allowed opacity-80';
    }
    if (seat.heldByMe) {
      return 'bg-indigo-900/80 text-indigo-200 border-indigo-400 ring-2 ring-indigo-400/50 animate-pulse';
    }

    const baseDim = isDimmed ? 'opacity-30' : 'opacity-100';

    switch (seat.categoryCode) {
      case 'VIP':
      case 'ROYAL_BOX':
      case 'COURTSIDE':
        return `bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-600 hover:text-white hover:border-purple-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer ${baseDim}`;
      case 'PREMIUM':
      case 'STALLS':
      case 'ALL_ACCESS':
      case 'FRONT_ROW':
        return `bg-blue-950/40 text-blue-300 border-blue-500/40 hover:bg-blue-600 hover:text-white hover:border-blue-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer ${baseDim}`;
      default:
        return `bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white hover:border-emerald-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/30 cursor-pointer ${baseDim}`;
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'BOOKED' || (seat.status === 'HELD' && !seat.heldByMe)) {
      toast.info(`Seat ${seat.seatNumber} is currently unavailable.`);
      return;
    }
    onToggleSeat(seat);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
      {/* Active Hold Countdown Banner with Progress Bar */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-xl overflow-hidden relative">
          <div className="flex items-center justify-between relative z-10 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  Temporary Hold Active
                  <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Cart Reserved
                  </span>
                </p>
                <p className="text-xs text-slate-400">Seats held exclusively for you. Complete reservation before timeout.</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-mono text-3xl font-extrabold tracking-tight ${
                timeLeft < 120 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'
              }`}>
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                timeLeft < 120 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage Arc Visual */}
      <div className="w-full max-w-xl mx-auto mb-10 text-center">
        <div className="relative pt-4">
          {/* Ambient stage spotlight glow */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-72 h-16 bg-indigo-500/15 blur-2xl rounded-full pointer-events-none" />
          <div className="h-3 w-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-stage" />
          
          <div className="mt-2 text-xs font-mono uppercase tracking-widest text-indigo-300 font-semibold flex items-center justify-center gap-2">
            <span>&bull;</span>
            <span className="bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">
              STAGE / AUDITORIUM FRONT
            </span>
            <span>&bull;</span>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            activeCategoryFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>All Tiers ({seats.length})</span>
        </button>

        {categories.map((catCode) => {
          const count = seats.filter(s => s.categoryCode === catCode).length;
          const first = seats.find(s => s.categoryCode === catCode);
          const price = first ? Number(first.price).toFixed(0) : '0';
          const isActive = activeCategoryFilter === catCode;

          return (
            <button
              key={catCode}
              type="button"
              onClick={() => setActiveCategoryFilter(isActive ? 'ALL' : catCode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Tag className="w-3 h-3 text-indigo-400" />
              <span>{catCode} (${price})</span>
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Seats Layout */}
      <div className="space-y-8 max-w-3xl mx-auto">
        {categories.map((categoryCode) => {
          const isCategoryHidden = activeCategoryFilter !== 'ALL' && activeCategoryFilter !== categoryCode;
          const categorySeats = seats.filter(s => s.categoryCode === categoryCode);
          const firstSeat = categorySeats[0];
          const price = firstSeat ? Number(firstSeat.price).toFixed(0) : '0';

          return (
            <div
              key={categoryCode}
              className={`space-y-3 transition-opacity duration-300 ${isCategoryHidden ? 'opacity-25' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-200 flex items-center gap-2 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {categoryCode} SECTION
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                  ${price} / seat
                </span>
              </div>

              {/* Dynamic Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5 sm:gap-3 justify-center">
                {categorySeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  const isAvailable = seat.status === 'AVAILABLE' || seat.heldByMe;
                  const isDimmed = activeCategoryFilter !== 'ALL' && activeCategoryFilter !== seat.categoryCode;

                  return (
                    <div
                      key={seat.id}
                      className="relative group/seat"
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSeatClick(seat)}
                        className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-xs font-mono font-bold transition-all duration-200 active:scale-90 ${getSeatColor(
                          seat,
                          isSelected,
                          isDimmed
                        )}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : seat.status === 'BOOKED' ? (
                          <span className="text-[10px] opacity-40">SOLD</span>
                        ) : seat.status === 'HELD' && !seat.heldByMe ? (
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <span className="text-[11px] truncate">{seat.seatNumber.split('-')[1] || seat.seatNumber}</span>
                        )}
                      </button>

                      {/* Floating Tooltip */}
                      {hoveredSeat?.id === seat.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 pointer-events-none text-center animate-slide-up">
                          <p className="font-mono text-xs font-bold text-white">{seat.seatNumber}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{seat.categoryCode}</p>
                          <p className="font-mono text-xs font-bold text-emerald-400 mt-0.5">${Number(seat.price).toFixed(0)}</p>
                          <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isSelected ? 'bg-indigo-600 text-white' : isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isSelected ? 'SELECTED' : seat.status}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-emerald-950/40 border border-emerald-500/50 shadow-sm" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white text-[10px] shadow-sm">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-white font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-amber-950/50 border border-amber-600/50 flex items-center justify-center text-amber-500 shadow-sm">
            <Lock className="w-2.5 h-2.5" />
          </div>
          <span>Held by Other</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-slate-900 border border-slate-800 opacity-60 shadow-sm" />
          <span>Booked (Sold)</span>
        </div>
      </div>
    </div>
  );
}
