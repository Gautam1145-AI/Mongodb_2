import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  Trash2,
  CheckCircle,
  Ban,
  Sparkles,
  AlertTriangle,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function AdminEventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CONCERT');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [bannerUrl, setBannerUrl] = useState('');

  // Ticket Categories
  const [categories, setCategories] = useState([
    { categoryCode: 'VIP', categoryName: 'VIP Diamond Experience', price: 200, totalSeats: 10 },
    { categoryCode: 'GENERAL', categoryName: 'General Admission', price: 65, totalSeats: 30 },
  ]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.adminEvents.getAll({ size: 50 });
      setEvents(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddCategory = () => {
    setCategories([
      ...categories,
      { categoryCode: 'TIER' + (categories.length + 1), categoryName: 'New Tier', price: 50, totalSeats: 20 },
    ]);
  };

  const handleRemoveCategory = (index) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = field === 'price' || field === 'totalSeats' ? Number(value) : value;
    setCategories(updated);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim().toUpperCase(),
        venue: venue.trim(),
        location: location.trim(),
        eventDate,
        startTime,
        endTime,
        bannerUrl: bannerUrl.trim() || undefined,
        ticketCategories: categories,
      };

      await api.adminEvents.create(payload);
      toast.success(`Event "${payload.title}" created with ${categories.reduce((a,c)=>a+c.totalSeats,0)} seats!`);
      setShowCreateModal(false);
      resetForm();
      await fetchEvents();
    } catch (err) {
      setFormError(err.message || 'Failed to create event and generate seats.');
      toast.error(err.message || 'Event creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id, eventTitle) => {
    try {
      await api.adminEvents.publish(id);
      toast.success(`Event "${eventTitle || ''}" is now live and published!`);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to publish event.');
    }
  };

  const handleCancel = async (id, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel "${eventTitle || 'this event'}"?`)) return;
    try {
      await api.adminEvents.cancel(id);
      toast.info(`Event "${eventTitle || ''}" has been cancelled.`);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel event.');
    }
  };

  const handleDelete = async (id, eventTitle) => {
    if (!window.confirm(`Delete "${eventTitle || 'this event'}" and its unbooked seats? This action cannot be undone.`)) return;
    try {
      await api.adminEvents.delete(id);
      toast.success(`Event deleted successfully.`);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete event.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('CONCERT');
    setVenue('');
    setLocation('');
    setEventDate('');
    setBannerUrl('');
    setCategories([
      { categoryCode: 'VIP', categoryName: 'VIP Diamond Experience', price: 200, totalSeats: 10 },
      { categoryCode: 'GENERAL', categoryName: 'General Admission', price: 65, totalSeats: 30 },
    ]);
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            Event Inventory &amp; Seat Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage event definitions, configure seating tiers, and publish to the live discovery feed.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events Table / List */}
      {loading ? (
        <LoadingSpinner message="Loading events from MongoDB events collection..." size="large" />
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-300 mb-3">{error}</p>
          <button onClick={fetchEvents} className="px-4 py-2 bg-slate-900 text-white text-xs rounded-xl">
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
          <p className="text-sm text-slate-400 mb-4">No events in database. Create your first event to generate seats.</p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] bg-slate-950/50">
                  <th className="py-3.5 px-6 font-semibold">Event Details</th>
                  <th className="py-3.5 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3.5 px-4 font-semibold">Venue &amp; Location</th>
                  <th className="py-3.5 px-4 font-semibold">Seat Inventory</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white max-w-xs truncate">{e.title}</div>
                      <div className="text-[10px] font-mono text-indigo-400 mt-0.5">{e.category}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{new Date(e.eventDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{e.startTime}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{e.venue}</div>
                      <div className="text-[10px] text-slate-500">{e.location}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-200">
                        {e.availableSeats} of {e.totalSeats} avail
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {e.bookedSeats} booked &bull; {e.heldSeats} held
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        to={`/events/${e.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 inline-block"
                        title="View Live Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {e.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(e.id, e.title)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 active:scale-95 transition-all"
                        >
                          Publish
                        </button>
                      )}

                      {e.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleCancel(e.id, e.title)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 transition-all"
                        >
                          Cancel Event
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(e.id, e.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 inline-block active:scale-95 transition-all"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create New Event</h3>
                <p className="text-xs text-slate-400">Generates event document and atomic seat inventory</p>
              </div>
            </div>

            {formError && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hans Zimmer Live Orchestral Symphony"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Event overview, performers, lineup..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="CONCERT">Concert</option>
                    <option value="CONFERENCE">Tech Conference</option>
                    <option value="THEATER">Theater</option>
                    <option value="SPORTS">Sports</option>
                    <option value="COMEDY">Comedy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madison Square Garden"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location / City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, NY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Seating Tiers Builder */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-white">Ticket Tiers &amp; Seat Inventory</label>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-4 gap-2.5 items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Code</span>
                        <input
                          type="text"
                          required
                          value={cat.categoryCode}
                          onChange={(e) => handleCategoryChange(idx, 'categoryCode', e.target.value.toUpperCase())}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Price ($)</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={cat.price}
                          onChange={(e) => handleCategoryChange(idx, 'price', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Seats</span>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          value={cat.totalSeats}
                          onChange={(e) => handleCategoryChange(idx, 'totalSeats', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-end pt-3">
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 shadow-lg shadow-indigo-600/20"
                >
                  {submitting ? 'Generating Seats & Saving...' : 'Save & Generate Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

