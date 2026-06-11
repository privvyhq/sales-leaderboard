"use client";

import React, { useState, useEffect } from 'react';
import {
  Trophy, LogOut, Plus, DollarSign, TrendingUp, Award, Loader2,
  AlertCircle, CheckCircle2, BarChart3, ClipboardList, X, Edit3,
  MapPin, Calendar, User, FileText, Trash2
} from 'lucide-react';

const SUPABASE_URL = 'https://ymuiemzzjgklwtkfjnfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdWllbXp6amdrbHd0a2ZqbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzI2ODEsImV4cCI6MjA5Njc0ODY4MX0.REhrCETCLTUI-6CX7hDcZOUOU8MNrkrj5g9BP3fIVDw';

const NAVY = '#1a3a52';
const BURNT_ORANGE = '#c8651a';
const TEAL = '#4a9b8e';

const STATUS_OPTIONS = [
  { value: 'offer_made', label: 'Offer Made', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  { value: 'accepted', label: 'Accepted', color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  { value: 'pending', label: 'Pending', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  { value: 'closed', label: 'Closed', color: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
  { value: 'dead', label: 'Dead', color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
];

const getStatusMeta = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

export default function LeaderboardApp() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currentTab, setCurrentTab] = useState('leaderboard');
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState('');
  const [period, setPeriod] = useState('week');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newDeal, setNewDeal] = useState(blankDeal());
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [editingDeal, setEditingDeal] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  function blankDeal() {
    return {
      property_address: '', city: '', state: 'TX', zip: '', seller_name: '',
      offer_date: new Date().toISOString().split('T')[0],
      contract_date: '', option_period_expiration: '', closing_date: '',
      initial_assignment_fee: '', option_fee: '', final_assignment_fee: '',
      status: 'offer_made', notes: '',
    };
  }

  const supaFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      ...(options.headers || {}),
    };
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, { ...options, headers });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      throw new Error(data?.message || data?.error_description || data?.msg || data?.error || `HTTP ${res.status}`);
    }
    return data;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const data = await supaFetch('/auth/v1/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (data?.access_token && data?.user) {
          setAccessToken(data.access_token);
          await createProfile(data.access_token, data.user.id, email, fullName);
          setUser({ ...data.user, full_name: fullName || email.split('@')[0] });
        } else if (data?.user) {
          setAuthSuccess('Account created. Check your email to confirm, then log in.');
          setAuthMode('login');
        }
      } else {
        const data = await supaFetch('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(data.access_token);
        const profile = await fetchProfile(data.access_token, data.user.id);
        setUser({ ...data.user, full_name: profile?.full_name || email.split('@')[0] });
      }
      setEmail(''); setPassword(''); setFullName('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const createProfile = async (token, userId, userEmail, name) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ id: userId, email: userEmail, full_name: name || userEmail.split('@')[0] }),
      });
    } catch (e) { console.warn(e); }
  };

  const fetchProfile = async (token, userId) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return data?.[0];
    } catch { return null; }
  };

  const handleLogout = () => {
    setUser(null); setAccessToken(null); setDeals([]);
  };

  const loadDeals = async () => {
    if (!accessToken) return;
    setLoadingDeals(true); setDealsError('');
    try {
      const data = await supaFetch(`/rest/v1/deals?select=*,profiles(full_name,email)&order=created_at.desc`);
      setDeals(data);
    } catch (err) {
      setDealsError(err.message);
    } finally {
      setLoadingDeals(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) loadDeals();
  }, [user, accessToken]);

  const handleSubmitNewDeal = async () => {
    if (!newDeal.property_address || !newDeal.initial_assignment_fee) {
      setSubmitMsg('Property address and initial fee are required');
      return;
    }
    setSubmitting(true); setSubmitMsg('');
    try {
      const payload = {
        user_id: user.id,
        property_address: newDeal.property_address,
        city: newDeal.city || null,
        state: newDeal.state || null,
        zip: newDeal.zip || null,
        seller_name: newDeal.seller_name || null,
        offer_date: newDeal.offer_date || null,
        contract_date: newDeal.contract_date || null,
        option_period_expiration: newDeal.option_period_expiration || null,
        closing_date: newDeal.closing_date || null,
        initial_assignment_fee: parseFloat(newDeal.initial_assignment_fee),
        option_fee: newDeal.option_fee ? parseFloat(newDeal.option_fee) : null,
        final_assignment_fee: newDeal.final_assignment_fee ? parseFloat(newDeal.final_assignment_fee) : null,
        status: newDeal.status,
        notes: newDeal.notes || null,
      };
      await supaFetch('/rest/v1/deals', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(payload),
      });
      setNewDeal(blankDeal());
      setSubmitMsg('Offer added');
      await loadDeals();
      setCurrentTab('offers');
      setTimeout(() => setSubmitMsg(''), 2500);
    } catch (err) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDeal) return;
    setSavingEdit(true);
    try {
      const payload = {
        property_address: editingDeal.property_address,
        city: editingDeal.city || null,
        state: editingDeal.state || null,
        zip: editingDeal.zip || null,
        seller_name: editingDeal.seller_name || null,
        offer_date: editingDeal.offer_date || null,
        contract_date: editingDeal.contract_date || null,
        option_period_expiration: editingDeal.option_period_expiration || null,
        closing_date: editingDeal.closing_date || null,
        initial_assignment_fee: editingDeal.initial_assignment_fee ? parseFloat(editingDeal.initial_assignment_fee) : null,
        option_fee: editingDeal.option_fee ? parseFloat(editingDeal.option_fee) : null,
        final_assignment_fee: editingDeal.final_assignment_fee ? parseFloat(editingDeal.final_assignment_fee) : null,
        status: editingDeal.status,
        notes: editingDeal.notes || null,
        updated_at: new Date().toISOString(),
      };
      await supaFetch(`/rest/v1/deals?id=eq.${editingDeal.id}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(payload),
      });
      setEditingDeal(null);
      await loadDeals();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!editingDeal || !confirm('Delete this deal? This cannot be undone.')) return;
    setSavingEdit(true);
    try {
      await supaFetch(`/rest/v1/deals?id=eq.${editingDeal.id}`, { method: 'DELETE' });
      setEditingDeal(null);
      await loadDeals();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const computeLeaderboard = () => {
    const now = new Date();
    const startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);
    const startISO = startDate.toISOString();

    const grouped = {};
    deals.forEach((d) => {
      const uid = d.user_id;
      const name = d.profiles?.full_name || d.profiles?.email?.split('@')[0] || 'Unknown';
      if (!grouped[uid]) {
        grouped[uid] = { userId: uid, name, pipeline: 0, closed: 0, closedCount: 0, activeCount: 0 };
      }
      if (d.status !== 'closed' && d.status !== 'dead' && d.created_at >= startISO) {
        if (d.initial_assignment_fee) {
          grouped[uid].pipeline += parseFloat(d.initial_assignment_fee);
        }
        grouped[uid].activeCount += 1;
      }
      if (d.status === 'closed') {
        const dealDate = d.closing_date || d.created_at;
        if (dealDate >= startISO.split('T')[0]) {
          if (d.final_assignment_fee) {
            grouped[uid].closed += parseFloat(d.final_assignment_fee);
          }
          grouped[uid].closedCount += 1;
        }
      }
    });

    return Object.values(grouped).sort((a, b) => b.closed - a.closed || b.pipeline - a.pipeline);
  };

  const filteredOffers = () => {
    if (statusFilter === 'all') return deals;
    return deals.filter(d => d.status === statusFilter);
  };

  const fmtMoney = (n) => {
    if (n == null || n === '') return '—';
    const num = parseFloat(n);
    if (isNaN(num)) return '—';
    return `$${Math.round(num).toLocaleString()}`;
  };

  const fmtMoneyShort = (n) => {
    if (n == null || n === 0) return '$0';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Math.round(n)}`;
  };

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${NAVY} 0%, #0f2030 100%)` }} className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }} className="px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur mb-4">
                <Trophy size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Sales Leaderboard</h1>
              <p className="text-white/80 mt-2 text-sm">Ironbridge Wholesale Company</p>
            </div>
            <div className="p-8">
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${authMode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Log In</button>
                <button onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }} className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${authMode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Sign Up</button>
              </div>
              {authError && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"><AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-red-800">{authError}</p></div>)}
              {authSuccess && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"><CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-green-800">{authSuccess}</p></div>)}
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="Geno McNeil" required />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="At least 6 characters" minLength={6} required />
                </div>
                <button type="submit" disabled={authLoading} style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }} className="w-full text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {authLoading && <Loader2 size={18} className="animate-spin" />}
                  {authLoading ? 'Loading...' : authMode === 'signup' ? 'Create Account' : 'Log In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const leaderboard = computeLeaderboard();
  const offers = filteredOffers();

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, #0f2030 100%)` }} className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div style={{ background: `linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)` }} className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Ironbridge Wholesale</h1>
              <p className="text-white/60 text-xs">Hi {user.full_name || user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 md:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium backdrop-blur">
            <LogOut size={16} /> <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>

        <div className="flex gap-1 mb-5 bg-white/5 backdrop-blur p-1 rounded-xl overflow-x-auto">
          <TabButton active={currentTab === 'leaderboard'} onClick={() => setCurrentTab('leaderboard')} icon={<Trophy size={16} />}>Leaderboard</TabButton>
          <TabButton active={currentTab === 'offers'} onClick={() => setCurrentTab('offers')} icon={<ClipboardList size={16} />}>Offers ({deals.length})</TabButton>
          <TabButton active={currentTab === 'new'} onClick={() => setCurrentTab('new')} icon={<Plus size={16} />}>New Offer</TabButton>
        </div>

        {currentTab === 'leaderboard' && (
          <div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-5">
              <div style={{ background: NAVY }} className="px-5 py-3 border-b border-white/10">
                <div className="flex gap-2 flex-wrap">
                  {['week', 'month', 'year'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} style={period === p ? { background: BURNT_ORANGE } : {}} className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all ${period === p ? 'text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                    </button>
                  ))}
                </div>
              </div>
              {loadingDeals ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: TEAL }} /></div>
              ) : dealsError ? (
                <div className="p-5"><div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" /><div><p className="font-semibold text-red-900">Cannot load data</p><p className="text-sm text-red-800 mt-1">{dealsError}</p></div></div></div>
              ) : leaderboard.length === 0 ? (
                <div className="py-12 text-center px-5"><Trophy size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No deals yet</p><p className="text-gray-400 text-sm mt-1">Add an offer to start the leaderboard</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-3 md:px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Rank</th>
                        <th className="text-left py-3 px-3 md:px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Employee</th>
                        <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Pipeline</th>
                        <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase tracking-wider text-gray-500">Closed</th>
                        <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase tracking-wider text-gray-500"># Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((m, idx) => {
                        const rankColors = ['#facc15', '#94a3b8', BURNT_ORANGE];
                        return (
                          <tr key={m.userId} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-3 md:px-5"><div style={{ background: rankColors[idx] || '#475569' }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow text-white">{idx + 1}</div></td>
                            <td className="py-4 px-3 md:px-5"><div className="flex items-center gap-3"><div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">{initials(m.name)}</div><p className="font-semibold text-gray-900">{m.name}</p></div></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-base md:text-lg font-bold text-gray-700">{fmtMoneyShort(m.pipeline)}</p><p className="text-xs text-gray-400">{m.activeCount} active</p></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-lg md:text-xl font-bold" style={{ color: NAVY }}>{fmtMoney(m.closed)}</p></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-base font-semibold text-gray-700">{m.closedCount}</p></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {leaderboard.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Pipeline" value={fmtMoney(leaderboard.reduce((s, u) => s + u.pipeline, 0))} icon={<TrendingUp size={32} className="text-white/40" />} bg={`linear-gradient(135deg, ${TEAL} 0%, #3a7a70 100%)`} />
                <StatCard label="Total Closed" value={fmtMoney(leaderboard.reduce((s, u) => s + u.closed, 0))} icon={<DollarSign size={32} className="text-white/40" />} bg={`linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)`} />
                <StatCard label="Deals Closed" value={leaderboard.reduce((s, u) => s + u.closedCount, 0)} icon={<Award size={32} className="text-white/40" />} bg={`linear-gradient(135deg, ${NAVY} 0%, #0f2030 100%)`} />
              </div>
            )}
          </div>
        )}

        {currentTab === 'offers' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{ background: NAVY }} className="px-5 py-3 border-b border-white/10">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-white/80 text-sm font-semibold mr-1">Filter:</span>
                <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All ({deals.length})</FilterButton>
                {STATUS_OPTIONS.map(s => {
                  const count = deals.filter(d => d.status === s.value).length;
                  return (<FilterButton key={s.value} active={statusFilter === s.value} onClick={() => setStatusFilter(s.value)}>{s.label} ({count})</FilterButton>);
                })}
              </div>
            </div>
            {loadingDeals ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: TEAL }} /></div>
            ) : offers.length === 0 ? (
              <div className="py-12 text-center px-5"><ClipboardList size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No offers yet</p><button onClick={() => setCurrentTab('new')} style={{ background: BURNT_ORANGE }} className="mt-4 text-white font-semibold py-2 px-4 rounded-lg shadow hover:shadow-lg transition">Add First Offer</button></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {offers.map(d => {
                  const sm = getStatusMeta(d.status);
                  const submitter = d.profiles?.full_name || d.profiles?.email?.split('@')[0] || 'Unknown';
                  return (
                    <button key={d.id} onClick={() => setEditingDeal({ ...d })} className="w-full text-left p-4 md:p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span style={{ background: sm.bg, color: sm.text }} className="px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">{sm.label}</span>
                            <span className="text-xs text-gray-500">by {submitter}</span>
                          </div>
                          <p className="font-bold text-gray-900 truncate">{d.property_address || 'No address'}</p>
                          <p className="text-sm text-gray-600">{[d.city, d.state, d.zip].filter(Boolean).join(', ') || '—'}{d.seller_name && ` · ${d.seller_name}`}</p>
                        </div>
                        <div className="flex gap-4 md:gap-6 text-right">
                          <div><p className="text-xs text-gray-500 font-semibold uppercase">Initial</p><p className="text-base font-bold text-gray-700">{fmtMoney(d.initial_assignment_fee)}</p></div>
                          <div><p className="text-xs text-gray-500 font-semibold uppercase">Final</p><p className="text-base font-bold" style={{ color: d.final_assignment_fee ? NAVY : '#9ca3af' }}>{fmtMoney(d.final_assignment_fee)}</p></div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'new' && (
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Plus size={22} style={{ color: BURNT_ORANGE }} /> New Offer</h2>
            <DealFormFields deal={newDeal} setDeal={setNewDeal} />
            {submitMsg && (<div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${submitMsg.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{submitMsg.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}{submitMsg}</div>)}
            <button onClick={handleSubmitNewDeal} disabled={submitting} style={{ background: `linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)` }} className="mt-5 w-full text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Saving...' : 'Add Offer'}
            </button>
          </div>
        )}

        {editingDeal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <div style={{ background: NAVY }} className="sticky top-0 px-5 py-4 flex justify-between items-center z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit3 size={20} /> Edit Deal</h2>
                <button onClick={() => setEditingDeal(null)} className="text-white/70 hover:text-white"><X size={24} /></button>
              </div>
              <div className="p-5">
                <DealFormFields deal={editingDeal} setDeal={setEditingDeal} />
                <div className="mt-6 flex gap-3 flex-col sm:flex-row">
                  <button onClick={handleSaveEdit} disabled={savingEdit} style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }} className="flex-1 text-white font-semibold py-3 rounded-lg shadow hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingEdit && <Loader2 size={18} className="animate-spin" />}
                    Save Changes
                  </button>
                  <button onClick={handleDeleteDeal} disabled={savingEdit} className="px-4 py-3 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"><Trash2 size={18} /> Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (<button onClick={onClick} style={active ? { background: BURNT_ORANGE } : {}} className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${active ? 'text-white shadow' : 'text-white/70 hover:bg-white/10'}`}>{icon}<span className="whitespace-nowrap">{children}</span></button>);
}

function FilterButton({ active, onClick, children }) {
  return (<button onClick={onClick} className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${active ? 'bg-white text-gray-900 shadow' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{children}</button>);
}

function StatCard({ label, value, icon, bg }) {
  return (<div style={{ background: bg }} className="rounded-xl shadow-xl p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-white/80 text-xs font-bold uppercase tracking-wider">{label}</p><p className="text-2xl md:text-3xl font-bold mt-2 tracking-tight">{value}</p></div>{icon}</div></div>);
}

function FormField({ label, icon, children }) {
  return (<div><label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">{icon}{label}</label>{children}</div>);
}

function DealFormFields({ deal, setDeal }) {
  const update = (field, value) => setDeal({ ...deal, [field]: value });
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STATUS_OPTIONS.map(s => (
            <button key={s.value} type="button" onClick={() => update('status', s.value)} style={deal.status === s.value ? { background: s.color, color: 'white', borderColor: s.color } : { background: s.bg, color: s.text, borderColor: s.bg }} className="px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all">{s.label}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><MapPin size={16} style={{ color: BURNT_ORANGE }} /> Property</h3>
        <div className="space-y-3">
          <FormField label="Street Address"><input type="text" value={deal.property_address || ''} onChange={(e) => update('property_address', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="2006 Placerville" /></FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="City"><input type="text" value={deal.city || ''} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="Forney" /></FormField>
            <FormField label="State"><input type="text" value={deal.state || ''} onChange={(e) => update('state', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="TX" maxLength={2} /></FormField>
            <FormField label="Zip"><input type="text" value={deal.zip || ''} onChange={(e) => update('zip', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="75126" /></FormField>
          </div>
          <FormField label="Seller Name" icon={<User size={12} />}><input type="text" value={deal.seller_name || ''} onChange={(e) => update('seller_name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" placeholder="John Smith" /></FormField>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><Calendar size={16} style={{ color: BURNT_ORANGE }} /> Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Offer Date"><input type="date" value={deal.offer_date || ''} onChange={(e) => update('offer_date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" /></FormField>
          <FormField label="Contract Date"><input type="date" value={deal.contract_date || ''} onChange={(e) => update('contract_date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" /></FormField>
          <FormField label="Option Period Expires"><input type="date" value={deal.option_period_expiration || ''} onChange={(e) => update('option_period_expiration', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" /></FormField>
          <FormField label="Closing Date"><input type="date" value={deal.closing_date || ''} onChange={(e) => update('closing_date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900" /></FormField>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><DollarSign size={16} style={{ color: BURNT_ORANGE }} /> Financials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Initial Assignment Fee *"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span><input type="number" value={deal.initial_assignment_fee || ''} onChange={(e) => update('initial_assignment_fee', e.target.value)} className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 font-semibold" placeholder="15000" /></div></FormField>
          <FormField label="Option Fee"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span><input type="number" value={deal.option_fee || ''} onChange={(e) => update('option_fee', e.target.value)} className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 font-semibold" placeholder="100" /></div></FormField>
          <FormField label="Final Assignment Fee"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span><input type="number" value={deal.final_assignment_fee || ''} onChange={(e) => update('final_assignment_fee', e.target.value)} className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 font-semibold" placeholder="15000" /></div></FormField>
        </div>
      </div>
      <FormField label="Notes" icon={<FileText size={12} />}><textarea value={deal.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 text-sm resize-none" placeholder="Buyer info, contingencies, etc." /></FormField>
    </div>
  );
}
