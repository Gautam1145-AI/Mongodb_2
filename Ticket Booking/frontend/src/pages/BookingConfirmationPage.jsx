import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  CheckCircle2,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Printer,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Share2
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingRef } = useParams();
  const location = useLocation();
  const toast = useToast();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!booking) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const data = await api.bookings.getByRef(bookingRef);
          setBooking(data);
        } catch (err) {
          setError(err.message || 'Unable to load booking details.');
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [bookingRef, booking]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRef = () => {
    if (!booking?.bookingRef) return;
    navigator.clipboard.writeText(booking.bookingRef);
    setCopied(true);
    toast.success(`Copied reference ${booking.bookingRef} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `E-Ticket: ${booking?.eventTitle}`,
        text: `Check out my booking for ${booking?.eventTitle}! Booking Ref: ${booking?.bookingRef}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ticket link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24">
        <LoadingSpinner message="Retrieving confirmed e-ticket..." size="large" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Booking Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'Could not locate this booking.'}</p>
        <Link to="/" className="px-5 py-2.5 btn-dynamic-primary text-xs">
          Return to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-slide-up">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Reservation Confirmed!
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your seats have been guaranteed and locked. Present this digital pass or save it to your records for gate entry.
          </p>
        </div>

        {/* Boarding Pass / MNC Concert Ticket */}
        <div id="printable-ticket" className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top Notch Cutouts */}
          <div className="ticket-notch-left" />
          <div className="ticket-notch-right" />

          {/* Ticket Header Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  OFFICIAL DIGITAL ADMISSION
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {booking.eventTitle}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <StatusBadge status={booking.status} />
              <button
                type="button"
                onClick={handleCopyRef}
                className="mt-2 group flex items-center sm:justify-end gap-1.5 font-mono text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Click to copy booking reference"
              >
                <span>{booking.bookingRef}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-dashed border-slate-800">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Primary Attendee</span>
                <span className="text-sm font-semibold text-white">{booking.userName}</span>
                <span className="text-xs text-slate-400 block font-mono">{booking.userEmail}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Date &amp; Time</span>
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Confirmed Event Date'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Venue Location</span>
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {booking.eventVenue || 'Main Arena'}, {booking.eventLocation || ''}
                </span>
              </div>
            </div>

            <div className="space-y-4 sm:border-l sm:border-slate-800 sm:pl-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Reserved Seat Numbers</span>
                <div className="flex flex-wrap gap-1.5">
                  {booking.seatNumbers?.map((seat) => (
                    <span
                      key={seat}
                      className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Total Paid</span>
                <span className="text-2xl font-mono font-extrabold text-emerald-400">
                  ${booking.totalAmount ? Number(booking.totalAmount).toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                  {booking.paymentStatus} &bull; Verified Electronic Transaction
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Barcode / QR Simulation */}
          <div className="p-6 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl p-1.5 flex items-center justify-center text-slate-950 shadow-md">
                <QrCode className="w-full h-full" />
              </div>
              <div className="text-xs text-slate-400">
                <span className="block font-mono font-bold text-slate-200">OFFICIAL GATE SCAN CODE</span>
                <span>Fast-track contactless admission</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              {/* Barcode lines simulation */}
              <div className="h-6 w-36 bg-[repeating-linear-gradient(90deg,#94a3b8,#94a3b8_2px,transparent_2px,transparent_5px,#94a3b8_5px,#94a3b8_8px,transparent_8px,transparent_10px)] opacity-60 mb-1" />
              <span className="text-[10px] font-mono text-slate-500">REF: {booking.bookingRef}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold btn-dynamic-secondary"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold btn-dynamic-secondary"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold btn-dynamic-primary"
          >
            <span>My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
