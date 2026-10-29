import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SeatMap from '../components/SeatMap';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Seat Selection & Holds
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdMessage, setHoldMessage] = useState(null);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Mock payment fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('999');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evData, seatData] = await Promise.all([
        api.events.getById(id),
        api.events.getSeats(id)
      ]);
      setEvent(evData);
      setSeats(seatData);

      // Check if user already holds any seats
      const myHeldSeats = seatData.filter(s => s.heldByMe);
      if (myHeldSeats.length > 0) {
        setSelectedSeats(myHeldSeats.map(s => s.seatNumber));
        // Use earliest expiration
        const exp = myHeldSeats[0].holdExpiresAt;
        if (exp) setHoldExpiresAt(exp);
      }
    } catch (err) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleSeat = (seat) => {
    // If seat is currently held under an active hold, ignore direct toggle
    if (holdExpiresAt && seat.heldByMe) {
      return;
    }

    const exists = selectedSeats.includes(seat.seatNumber);
    if (exists) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat.seatNumber));
      toast.info(`Removed seat ${seat.seatNumber}`);
    } else {
      if (selectedSeats.length >= 8) {
        toast.error('Maximum 8 seats allowed per reservation.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat.seatNumber]);
      toast.success(`Selected seat ${seat.seatNumber}`);
    }
  };

  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (selectedSeats.length === 0) return;

    try {
      setIsHolding(true);
      setBookingError(null);
      const res = await api.events.holdSeats(id, selectedSeats);
      setHoldExpiresAt(res.expiresAt);
      setHoldMessage(res.message);
      toast.success(`${selectedSeats.length} seat(s) successfully held for 10 minutes!`);
      // Refresh seat inventory to reflect hold
      const updatedSeats = await api.events.getSeats(id);
      setSeats(updatedSeats);
    } catch (err) {
      setBookingError(err.message);
      toast.error(err.message || 'Seat hold conflict. Please choose another seat.');
      // Re-fetch seats in case someone else booked it
      const updatedSeats = await api.events.getSeats(id);
      setSeats(updatedSeats);
    } finally {
      setIsHolding(false);
    }
  };

  const handleHoldExpired = async () => {
    setHoldExpiresAt(null);
    setHoldMessage(null);
    setSelectedSeats([]);
    // Reload seats
    const updatedSeats = await api.events.getSeats(id);
    setSeats(updatedSeats);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    try {
      setIsBooking(true);
      setBookingError(null);

      const idempotencyKey = `PAY-${id}-${user.id}-${selectedSeats.sort().join('-')}-${Date.now()}`;

      const bookingData = {
        eventId: id,
        seatNumbers: selectedSeats,
        idempotencyKey,
        paymentMethod: 'MOCK_CREDIT_CARD',
      };

      const result = await api.bookings.create(bookingData);
      toast.success('Reservation confirmed! Generating your e-ticket...');
      navigate(`/confirmation/${result.bookingRef}`, { state: { booking: result } });
    } catch (err) {
      setBookingError(err.message || 'Booking conflict or payment failure.');
      toast.error(err.message || 'Booking failed.');
      const updatedSeats = await api.events.getSeats(id);
      setSeats(updatedSeats);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <LoadingSpinner message="Loading event details &amp; live seating map..." size="large" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Event Not Available</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'This event could not be found.'}</p>
        <Link to="/" className="px-5 py-2.5 btn-dynamic-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  const selectedSeatObjects = seats.filter(s => selectedSeats.includes(s.seatNumber));
  const totalPrice = selectedSeatObjects.reduce((acc, s) => acc + Number(s.price || 0), 0);

  return (
    <div className="min-h-screen pb-28">
      {/* Event Header Banner */}
      <div className="relative bg-slate-950 border-b border-slate-900 pt-8 pb-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80'}
            alt={event.title}
            className="w-full h-full object-cover blur-md scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Events</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {event.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {event.availableSeats} of {event.totalSeats} seats available
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{event.venue}, {event.location}</span>
                </div>
              </div>
            </div>

            {/* Quick Price Spotlight */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-right self-start lg:self-auto backdrop-blur-md shadow-xl">
              <span className="text-xs text-slate-400 block font-mono uppercase">Ticket Tiers From</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                ${event.minPrice ? Number(event.minPrice).toFixed(0) : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reservation Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Reservation Error Banner */}
        {bookingError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start gap-3 animate-slide-up shadow-xl">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Seat Hold Notice</p>
              <p className="text-xs text-rose-400/90 mt-0.5">{bookingError}</p>
            </div>
            <button onClick={() => setBookingError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Interactive Seat Map */}
          <div className="lg:col-span-2">
            <SeatMap
              seats={seats}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
              holdExpiresAt={holdExpiresAt}
              onHoldExpired={handleHoldExpired}
            />
          </div>

          {/* Right Col: Order Summary & Hold Actions */}
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl sticky top-24 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>Selected Seats</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  {selectedSeats.length} seat(s)
                </span>
              </h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  Click on any available seat in the amphitheater to reserve.
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {selectedSeatObjects.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-400">{seat.seatNumber}</span>
                          <span className="text-slate-400">({seat.categoryCode})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-emerald-400">${Number(seat.price).toFixed(0)}</span>
                          <button
                            onClick={() => handleToggleSeat(seat)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Calculation */}
                  <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-200">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee &amp; Taxes</span>
                      <span className="font-mono text-emerald-400">Included ($0.00)</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                      <span>Total Due</span>
                      <span className="font-mono text-emerald-400">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!holdExpiresAt ? (
                  <button
                    type="button"
                    disabled={selectedSeats.length === 0 || isHolding}
                    onClick={handleHoldSeats}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white btn-dynamic-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isHolding ? 'Securing Seats...' : 'Lock Seats & Reserve (10 Mins)'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Express Checkout</span>
                  </button>
                )}

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Your selected seats are locked exclusively for 10 minutes upon reservation. Zero double-booking guaranteed.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MNC Dynamic Sticky Floating Selection Bar (when seats are selected) */}
      {selectedSeats.length > 0 && !showCheckout && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-slate-900/95 border border-indigo-500/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {selectedSeats.length}
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Seats:</span>
                <span className="font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                  {selectedSeats.join(', ')}
                </span>
              </div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                Total: ${totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {!holdExpiresAt ? (
            <button
              onClick={handleHoldSeats}
              disabled={isHolding}
              className="px-5 py-2.5 rounded-xl text-xs font-bold btn-dynamic-primary"
            >
              {isHolding ? 'Securing...' : 'Lock Seats (10 Mins)'}
            </button>
          ) : (
            <button
              onClick={() => setShowCheckout(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
            >
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Express Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl overflow-hidden animate-slide-up">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Express Checkout</h3>
                <p className="text-xs text-slate-400">Secure Payment Gateway &bull; Instant E-Ticket Confirmation</p>
              </div>
            </div>

            {/* Order Review */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Event</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{event.title}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Seats</span>
                <span className="font-mono text-indigo-400 font-semibold">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Amount to Confirm</span>
                <span className="font-mono text-emerald-400">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={cardName || user?.name || ''}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Card Number (Pre-filled Sandbox)</label>
                <input
                  type="text"
                  disabled
                  value={cardNumber}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    disabled
                    value={cardExpiry}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Security Code (CVV)</label>
                  <input
                    type="text"
                    disabled
                    value={cardCvv}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBooking}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white btn-dynamic-primary disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isBooking ? 'Processing Instant Reservation...' : `Confirm & Pay $${totalPrice.toFixed(2)}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
