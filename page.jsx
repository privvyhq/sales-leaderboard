"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, LogOut, Plus, DollarSign, TrendingUp, Award, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const SUPABASE_URL = 'https://ymuiemzzjgklwtkfjnfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdWllbXp6amdrbHd0a2ZqbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzI2ODEsImV4cCI6MjA5Njc0ODY4MX0.REhrCETCLTUI-6CX7hDcZOUOU8MNrkrj5g9BP3fIVDw';

// Thrive brand colors
const NAVY = '#1a3a52';
const BURNT_ORANGE = '#c8651a';
const TEAL = '#4a9b8e';

export default function LeaderboardApp() {
  // Auth state (in-memory only — refresh = logout)
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Dashboard state
  const [period, setPeriod] = useState('week');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState('');

  // Deal entry
  const [feeInput, setFeeInput] = useState('');
  const [contractInput, setContractInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // === Supabase helpers ===

  const supaFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...(options.headers || {}),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const res = await fetch(`${SUPABASE_URL}${endpoint}`, { ...options, headers });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const message = data?.message || data?.error_description || data?.msg || data?.error || `HTTP ${res.status}`;
      throw new Error(message);
    }
    return data;
  };

  // === Auth handlers ===

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const data = await supaFetch('/auth/v1/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        // If session returned, log in immediately
        if (data?.access_token && data?.user) {
          setAccessToken(data.access_token);
          // Create profile
          await createProfile(data.access_token, data.user.id, email, fullName);
          setUser({ ...data.user, full_name: fullName || email.split('@')[0] });
        } else if (data?.user) {
          // Email confirmation required
          setAuthSuccess('Account created! Check your email to confirm, then log in.');
          setAuthMode('login');
        }
      } else {
        const data = await supaFetch('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(data.access_token);

        // Try to fetch profile
        const profile = await fetchProfile(data.access_token, data.user.id);
        setUser({ ...data.user, full_name: profile?.full_name || email.split('@')[0] });
      }

      setEmail('');
      setPassword('');
      setFullName('');
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
        body: JSON.stringify({
          id: userId,
          email: userEmail,
          full_name: name || userEmail.split('@')[0],
        }),
      });
    } catch (e) {
      console.warn('Profile creation:', e.message);
    }
  };

  const fetchProfile = async (token, userId) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      return data?.[0];
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setLeaderboard([]);
  };

  // === Leaderboard data ===

  const loadLeaderboard = async () => {
    if (!accessToken) return;
    setLoadingDeals(true);
    setDealsError('');

    try {
      const now = new Date();
      const startDate = new Date();
      if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      const deals = await supaFetch(
        `/rest/v1/deals?created_at=gte.${startDate.toISOString()}&select=*,profiles(full_name,email)`
      );

      // Aggregate by user
      const grouped = {};
      deals.forEach((d) => {
        const uid = d.user_id;
        const name = d.profiles?.full_name || d.profiles?.email?.split('@')[0] || 'Unknown';
        if (!grouped[uid]) {
          grouped[uid] = { userId: uid, name, totalFees: 0, totalContracts: 0, dealCount: 0 };
        }
        grouped[uid].totalFees += parseFloat(d.assignment_fee);
        grouped[uid].totalContracts += d.contract_count;
        grouped[uid].dealCount += 1;
      });

      const sorted = Object.values(grouped)
        .map((u) => ({
          ...u,
          avg: u.dealCount > 0 ? u.totalFees / u.dealCount : 0,
        }))
        .sort((a, b) => b.totalFees - a.totalFees);

      setLeaderboard(sorted);
    } catch (err) {
      setDealsError(err.message);
    } finally {
      setLoadingDeals(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      loadLeaderboard();
    }
  }, [user, accessToken, period]);

  // === Deal submission ===

  const handleSubmitDeal = async () => {
    if (!feeInput || !contractInput) {
      setSubmitMsg('Please fill in fee and contract count');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');

    try {
      await supaFetch('/rest/v1/deals', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          user_id: user.id,
          assignment_fee: parseFloat(feeInput),
          contract_count: parseInt(contractInput),
          notes: notesInput || null,
        }),
      });

      setFeeInput('');
      setContractInput('');
      setNotesInput('');
      setSubmitMsg('Deal logged');
      await loadLeaderboard();
      setTimeout(() => setSubmitMsg(''), 2500);
    } catch (err) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // === Formatters ===

  const fmtMoney = (n) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${Math.round(n)}`;
  };

  const fmtFull = (n) => `$${Math.round(n).toLocaleString()}`;

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // === LOGIN SCREEN ===

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${NAVY} 0%, #0f2030 100%)` }} className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }} className="px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur mb-4">
                <Trophy size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Sales Leaderboard</h1>
              <p className="text-white/80 mt-2 text-sm">Ironbridge Wholesale Company</p>
            </div>

            {/* Form */}
            <div className="p-8">
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${authMode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  Log In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${authMode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
              {authSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{authSuccess}</p>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900"
                      style={{ borderColor: '#d1d5db' }}
                      placeholder="Geno McNeil"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                    placeholder="geno@ironbridge.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}
                  className="w-full text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {authLoading && <Loader2 size={18} className="animate-spin" />}
                  {authLoading ? 'Loading...' : authMode === 'signup' ? 'Create Account' : 'Log In'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Setup Required</p>
                <p className="text-xs text-amber-800">
                  Before first use, run the SQL schema in your Supabase SQL Editor (see DEPLOYMENT_GUIDE.md).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === MAIN DASHBOARD ===

  const totalFees = leaderboard.reduce((s, u) => s + u.totalFees, 0);
  const totalDeals = leaderboard.reduce((s, u) => s + u.dealCount, 0);
  const avgDeal = totalDeals > 0 ? totalFees / totalDeals : 0;

  const rankColor = (idx) => {
    if (idx === 0) return '#facc15'; // gold
    if (idx === 1) return '#94a3b8'; // silver
    if (idx === 2) return BURNT_ORANGE; // bronze
    return '#475569';
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, #0f2030 100%)` }} className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div style={{ background: `linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)` }} className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Sales Leaderboard</h1>
              <p className="text-white/60 text-sm">Hi {user.full_name || user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium backdrop-blur"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Leaderboard - main column */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Period selector */}
            <div style={{ background: NAVY }} className="px-6 py-4 border-b border-white/10">
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={period === p ? { background: BURNT_ORANGE } : {}}
                    className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-all capitalize ${
                      period === p ? 'text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loadingDeals ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: TEAL }} />
              </div>
            ) : dealsError ? (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Cannot load data</p>
                    <p className="text-sm text-red-800 mt-1">{dealsError}</p>
                    <p className="text-xs text-red-700 mt-2">
                      Make sure you ran the SQL schema in Supabase SQL Editor.
                    </p>
                  </div>
                </div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Trophy size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No deals yet</p>
                <p className="text-gray-400 text-sm mt-1">Log your first deal to start the leaderboard</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 md:px-6 text-xs font-bold uppercase tracking-wider text-gray-500">Rank</th>
                      <th className="text-left py-4 px-4 md:px-6 text-xs font-bold uppercase tracking-wider text-gray-500">Employee</th>
                      <th className="text-right py-4 px-4 md:px-6 text-xs font-bold uppercase tracking-wider text-gray-500">Total Closed</th>
                      <th className="text-right py-4 px-4 md:px-6 text-xs font-bold uppercase tracking-wider text-gray-500"># Closed</th>
                      <th className="text-right py-4 px-4 md:px-6 text-xs font-bold uppercase tracking-wider text-gray-500">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((m, idx) => (
                      <tr key={m.userId} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 md:px-6">
                          <div
                            style={{ background: rankColor(idx), color: idx < 3 ? '#fff' : '#fff' }}
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow"
                          >
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` }}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                            >
                              {initials(m.name)}
                            </div>
                            <p className="font-semibold text-gray-900">{m.name}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6 text-right">
                          <p className="text-lg md:text-xl font-bold text-gray-900">{fmtFull(m.totalFees)}</p>
                        </td>
                        <td className="py-4 px-4 md:px-6 text-right">
                          <p className="text-base font-semibold text-gray-700">{m.totalContracts}</p>
                        </td>
                        <td className="py-4 px-4 md:px-6 text-right">
                          <p className="text-base font-semibold text-gray-700">{fmtFull(m.avg)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deal entry */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <div style={{ background: BURNT_ORANGE }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Plus size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Log a Deal</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Assignment Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                    <input
                      type="number"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 text-lg font-semibold"
                      placeholder="15,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Contracts Closed</label>
                  <input
                    type="number"
                    value={contractInput}
                    onChange={(e) => setContractInput(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 text-lg font-semibold"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-gray-900 text-sm resize-none"
                    placeholder="Property address, buyer, etc."
                  />
                </div>

                <button
                  onClick={handleSubmitDeal}
                  disabled={submitting}
                  style={{ background: `linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)` }}
                  className="w-full text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {submitting ? 'Logging...' : 'Submit Deal'}
                </button>

                {submitMsg && (
                  <div className={`p-2.5 rounded-lg text-sm flex items-center gap-2 ${
                    submitMsg.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                  }`}>
                    {submitMsg.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {submitMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #3a7a70 100%)` }} className="rounded-xl shadow-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Total Closed</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{fmtFull(totalFees)}</p>
                </div>
                <DollarSign size={36} className="text-white/40" />
              </div>
            </div>

            <div style={{ background: `linear-gradient(135deg, ${BURNT_ORANGE} 0%, #a04f12 100%)` }} className="rounded-xl shadow-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Total Deals</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{totalDeals}</p>
                </div>
                <TrendingUp size={36} className="text-white/40" />
              </div>
            </div>

            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0f2030 100%)` }} className="rounded-xl shadow-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Avg Deal Size</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{fmtFull(avgDeal)}</p>
                </div>
                <Award size={36} className="text-white/40" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}