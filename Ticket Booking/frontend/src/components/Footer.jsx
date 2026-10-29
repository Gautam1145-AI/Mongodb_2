import React from 'react';
import { ShieldCheck, Zap, Ticket, Calendar, Mail, Phone, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-auto py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              EventTicket &bull; Live Experiences
            </h3>
            <p className="text-sm text-slate-400 mb-4 max-w-md leading-relaxed">
              Your premier gateway for concerts, live sports, tech conferences, and theater performances. Experience real-time seat reservation, guaranteed instant ticketing, and secure booking management.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified &amp; Secure Tickets
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Instant Confirmation
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                Interactive Seat Mapping
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Event Categories</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/?category=CONCERT" className="hover:text-indigo-400 transition-colors">Music Concerts &amp; Festivals</Link></li>
              <li><Link to="/?category=SPORTS" className="hover:text-indigo-400 transition-colors">Championship Sports</Link></li>
              <li><Link to="/?category=CONFERENCE" className="hover:text-indigo-400 transition-colors">Tech &amp; AI Summits</Link></li>
              <li><Link to="/?category=THEATER" className="hover:text-indigo-400 transition-colors">Broadway &amp; Stage Shows</Link></li>
              <li><Link to="/?category=COMEDY" className="hover:text-indigo-400 transition-colors">Standup &amp; Comedy Nights</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Explore &amp; Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-indigo-400 transition-colors">Discover Events</Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-indigo-400 transition-colors">My Reservations &amp; E-Tickets</Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-indigo-400 transition-colors">Organizer Portal</Link>
              </li>
              <li>
                <Link to="/admin/events" className="hover:text-indigo-400 transition-colors">Create / Manage Event</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 EventTicket Inc. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">Premium Real-Time Event Booking Platform</p>
        </div>
      </div>
    </footer>
  );
}
