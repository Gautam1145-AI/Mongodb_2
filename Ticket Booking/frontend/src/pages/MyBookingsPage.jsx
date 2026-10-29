import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  History,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  X,
  CheckCircle,
  ExternalLink,
  Ban,
  Search,
  Copy,
  Check,
  Ticket
} from 'lucide-react';

export default function MyBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('ALL'); // ALL, CONFIRMED, CANCELLED
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedRef, setCopiedRef] = useState(null);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.bookings.getMyBookings();
      setBookings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your booking history.');
      toast.error('Unable to fetch your booking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCopy = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    toast.success(`Booking ref ${ref} copied!`);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    try {
      setCancelling(true);
      setCancelError(null);
      await api.bookings.cancel(cancelTarget.bookingRef);
      toast.success(`Booking ${cancelTarget.bookingRef} successfully cancelled. Seats released.`);
      setCancelTarget(null);
      await fetchBookings();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking.');
      toast.error(err.message || 'Cancellation rejected.');
    } finally {
      setCancelling(false);
    }
  };

  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;

  const filteredBookings = bookings.filter((b) => {
    if (tab !== 'ALL' && b.status !== tab) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchRef = b.bookingRef?.toLowerCase().includes(q);
      const matchTitle = b.eventTitle?.toLowerCase().includes(q);
      const matchSeat = b.seatNumbers?.some(s => s.toLowerCase().includes(q));
      return matchRef || matchTitle || matchSeat;
    }
    return true;
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-400" />
            My Bookings &amp; Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your confirmed e-tickets, manage active reservations, and review past orders.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto shadow-md">
          <button
            onClick={() => setTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setTab('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === 'CONFIRMED'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setTab('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === 'CANCELLED'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Quick Search in Bookings */}
      {bookings.length > 0 && (
        <div className="mb-6 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by event, reference or seat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner message="Loading your tickets and booking records..." size="large" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center max-w-lg mx-auto">
          <p className="text-sm text-rose-300 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 btn-dynamic-secondary text-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 max-w-xl mx-auto">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Reservations Found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {searchTerm
              ? `No bookings match your search "${searchTerm}".`
              : tab === 'ALL'
              ? "You haven't made any ticket reservations yet."
              : `No ${tab.toLowerCase()} bookings found.`}
          </p>
          <Link
            to="/"
            className="px-5 py-2.5 btn-dynamic-primary text-xs"
          >
            Explore Events &amp; Reserve Seats
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === 'CONFIRMED';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-700/80 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={booking.status} />

                    {/* Copyable Reference Pill */}
                    <button
                      type="button"
                      onClick={() => handleCopy(booking.bookingRef)}
                      className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 flex items-center gap-1.5 hover:bg-indigo-500/20 transition-colors"
                      title="Click to copy reference"
                    >
                      <span>{booking.bookingRef}</span>
                      {copiedRef === booking.bookingRef ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    <span className="text-xs text-slate-500 font-mono">
                      Booked {new Date(booking.bookedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {booking.eventTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    {booking.eventDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(booking.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {booking.eventVenue && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {booking.eventVenue}
                      </span>
                    )}
                  </div>

                  {/* Seat badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-400 mr-1">Seats:</span>
                    {booking.seatNumbers.map((seat) => (
                      <span
                        key={seat}
                        className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs font-semibold text-slate-200"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side: Amount and actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 gap-4">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Total Paid</span>
                    <span className="text-xl font-mono font-extrabold text-emerald-400">
                      ${Number(booking.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/confirmation/${booking.bookingRef}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold btn-dynamic-secondary"
                    >
                      <span>View Ticket</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {isConfirmed && (
                      <button
                        onClick={() => setCancelTarget(booking)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1.5 active:scale-95"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Cancellation */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Cancel Reservation?</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-white font-mono">{cancelTarget.bookingRef}</strong> for <strong className="text-white">{cancelTarget.eventTitle}</strong>?
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-6 space-y-1 font-mono">
              <div>Seats to release: <span className="text-rose-400 font-bold">{cancelTarget.seatNumbers.join(', ')}</span></div>
              <div>Refund amount: <span className="text-emerald-400 font-bold">${Number(cancelTarget.totalAmount).toFixed(2)}</span></div>
            </div>

            {cancelError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                {cancelling ? 'Releasing Seats...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
