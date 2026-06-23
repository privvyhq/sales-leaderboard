"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, LogOut, Plus, DollarSign, TrendingUp, Award, Loader2,
  AlertCircle, CheckCircle2, ClipboardList, X, Edit3, MapPin,
  Calendar, User, FileText, Trash2, FileSignature, Settings,
  Download, Eye, Users, UserCheck, BarChart3, Upload, File,
  Image, ChevronDown, Phone, Mail, Building, Home
} from 'lucide-react';

const SUPABASE_URL = 'https://hhpaxztybnhtflstjfqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocGF4enR5Ym5odGZsc3RqZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTg4NzgsImV4cCI6MjA5Nzc3NDg3OH0.GyAciYLTzy-yteEFSj_hNQgtpWOhpqNPo6i-5EjHWdo';

const NAVY = '#1a3a52';
const BURNT_ORANGE = '#c8651a';
const TEAL = '#4a9b8e';
const GOLD = '#c8a96a';
const COMPANY = 'QP HOLDINGS LLC';

const STATUS_OPTIONS = [
  { value: 'offer_made', label: 'Offer Made', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  { value: 'accepted', label: 'Accepted', color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  { value: 'pending', label: 'Pending', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  { value: 'closed', label: 'Closed', color: '#6366f1', bg: '#e0e7ff', text: '#3730a3' },
  { value: 'dead', label: 'Dead', color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
];

const DEAD_REASONS = ['No motivation', 'Price gap too big', 'Timing', 'Title issues', 'Agent unresponsive', 'Seller changed mind', 'Other'];
const COMP_SOURCES = ['MLS Dallas', 'PropWire', 'Both'];
const LEAD_SOURCES = ['MLS Active', 'Referral', 'Other'];
const DOC_TYPES = [
  { value: 'mortgage_statement', label: 'Mortgage Statement' },
  { value: 'comp_report', label: 'Comp Report' },
  { value: 'loi', label: 'LOI' },
  { value: 'contract', label: 'Contract' },
  { value: 'assignment', label: 'Assignment Agreement' },
  { value: 'photo', label: 'Property Photo' },
  { value: 'other', label: 'Other' },
];

const getStatusMeta = (s) => STATUS_OPTIONS.find(x => x.value === s) || STATUS_OPTIONS[0];

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const s = document.createElement('script');
  s.src = src; s.onload = resolve; s.onerror = reject;
  document.body.appendChild(s);
});

// ============================================================
// MAIN APP
// ============================================================
export default function IronbridgeApp() {
  // Auth
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Nav
  const [tab, setTab] = useState('leaderboard');

  // Data
  const [deals, setDeals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dataError, setDataError] = useState('');

  // Leaderboard
  const [period, setPeriod] = useState('week');

  // Offers filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [savingDeal, setSavingDeal] = useState(false);
  const [newDeal, setNewDeal] = useState(blankDeal());
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Agents
  const [editingAgent, setEditingAgent] = useState(null);
  const [newAgent, setNewAgent] = useState(blankAgent());
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);

  // Buyers
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [newBuyer, setNewBuyer] = useState(blankBuyer());
  const [showNewBuyer, setShowNewBuyer] = useState(false);
  const [savingBuyer, setSavingBuyer] = useState(false);

  // LOI
  const [loiForm, setLoiForm] = useState(blankLoi());
  const [loiBusy, setLoiBusy] = useState(false);
  const [loiMsg, setLoiMsg] = useState('');

  // Profile
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [dealDocs, setDealDocs] = useState([]);
  const fileRef = useRef(null);

  // ── Blank templates ──
  function blankDeal() {
    return {
      property_address: '', city: '', state: 'TX', zip: '', seller_name: '',
      offer_date: new Date().toISOString().split('T')[0],
      contract_date: '', option_period_expiration: '', closing_date: '',
      initial_assignment_fee: '', option_fee: '', final_assignment_fee: '',
      status: 'offer_made', notes: '', dead_reason: '',
      lead_source: 'MLS Active',
      // Agent fields
      agent_name: '', agent_phone: '', agent_email: '', agent_brokerage: '',
      // Financing
      list_price: '', days_on_market: '', interest_rate: '', piti: '', loan_balance: '',
      // Comps
      arv: '', repair_estimate: '', offer_range_low: '', offer_range_high: '',
      comp_source: 'MLS Dallas', comp_notes: '',
      // Assignment
      buyer_id: '', loi_generated_date: '', assignment_signed_date: '',
    };
  }

  function blankAgent() {
    return { name: '', phone: '', email: '', brokerage: '', notes: '' };
  }

  function blankBuyer() {
    return { name: '', company: '', email: '', phone: '', type: 'daisy_chain', buy_box_min: '', buy_box_max: '', buy_box_areas: '', notes: '', active: true };
  }

  function blankLoi() {
    return {
      agent_name: '', agent_phone: '', agent_email: '',
      offer_date: new Date().toISOString().split('T')[0],
      property_address: '', city: '', state: 'TX', zip: '', seller_name: '',
      cash_offer: '', include_subto: true, due_diligence_days: 10, closing_days: 15,
    };
  }

  // ── Supabase helper ──
  const supa = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      ...options.headers,
    };
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, { ...options, headers });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new Error(data?.message || data?.error_description || data?.error || `HTTP ${res.status}`);
    return data;
  };

  // ── Auth ──
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const data = await supa('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (data?.access_token && data?.user) {
          setAccessToken(data.access_token);
          await createProfile(data.access_token, data.user.id, email, fullName);
          setUser({ ...data.user, full_name: fullName || email.split('@')[0], phone: '' });
        } else {
          setAuthSuccess('Check your email to confirm, then log in.');
          setAuthMode('login');
        }
      } else {
        const data = await supa('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
        setAccessToken(data.access_token);
        const profile = await fetchProfile(data.access_token, data.user.id);
        setUser({ ...data.user, full_name: profile?.full_name || email.split('@')[0], phone: profile?.phone || '' });
        setProfilePhone(profile?.phone || '');
      }
      setEmail(''); setPassword(''); setFullName('');
    } catch (err) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };

  const createProfile = async (token, id, email, name) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}`, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ id, email, full_name: name || email.split('@')[0] }),
      });
    } catch (e) { console.warn(e); }
  };

  const fetchProfile = async (token, id) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
      });
      return (await res.json())?.[0];
    } catch { return null; }
  };

  const handleLogout = () => { setUser(null); setAccessToken(null); setDeals([]); setAgents([]); setBuyers([]); };

  // ── Load data ──
  const loadAll = async () => {
    if (!accessToken) return;
    setLoadingDeals(true); setDataError('');
    try {
      const [d, a, b] = await Promise.all([
        supa('/rest/v1/deals?select=*,profiles(full_name,email)&order=created_at.desc'),
        supa('/rest/v1/agents?select=*&order=name.asc'),
        supa('/rest/v1/buyers?select=*&order=name.asc'),
      ]);
      setDeals(d || []);
      setAgents(a || []);
      setBuyers(b || []);
    } catch (err) { setDataError(err.message); }
    finally { setLoadingDeals(false); }
  };

  useEffect(() => { if (user && accessToken) loadAll(); }, [user, accessToken]);

  const loadDealDocs = async (dealId) => {
    try {
      const docs = await supa(`/rest/v1/documents?deal_id=eq.${dealId}&select=*&order=created_at.desc`);
      setDealDocs(docs || []);
    } catch { setDealDocs([]); }
  };

  // ── File upload ──
  const uploadFile = async (file, dealId, docType) => {
    const ext = file.name.split('.').pop();
    const path = `${dealId}/${docType}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/offer-documents/${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': file.type, 'x-upsert': 'true' },
      body: file,
    });
    if (!res.ok) throw new Error('Upload failed');
    return path;
  };

  const getSignedUrl = async (path) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/offer-documents/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600 }),
      });
      const data = await res.json();
      return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
    } catch { return null; }
  };

  const handleFileUpload = async (e, dealId, docType) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true); setUploadMsg('');
    try {
      for (const file of files) {
        const path = await uploadFile(file, dealId, docType);
        await supa('/rest/v1/documents', {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            deal_id: dealId,
            uploaded_by: user.id,
            name: file.name,
            type: docType,
            storage_path: path,
            file_type: file.type,
            file_size: file.size,
          }),
        });
      }
      setUploadMsg(`${files.length} file(s) uploaded`);
      await loadDealDocs(dealId);
      setTimeout(() => setUploadMsg(''), 3000);
    } catch (err) { setUploadMsg(`Error: ${err.message}`); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const openDoc = async (doc) => {
    const url = await getSignedUrl(doc.storage_path);
    if (url) window.open(url, '_blank');
  };

  const deleteDoc = async (doc, dealId) => {
    if (!confirm(`Delete ${doc.name}?`)) return;
    try {
      await fetch(`${SUPABASE_URL}/storage/v1/object/offer-documents/${doc.storage_path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY },
      });
      await supa(`/rest/v1/documents?id=eq.${doc.id}`, { method: 'DELETE' });
      await loadDealDocs(dealId);
    } catch (err) { alert(err.message); }
  };

  // ── Deal CRUD ──
  const saveAgentFromDeal = async (deal) => {
    if (!deal.agent_email && !deal.agent_name) return null;
    try {
      const existing = agents.find(a => a.email && a.email === deal.agent_email);
      if (existing) return existing.id;
      const res = await supa('/rest/v1/agents', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name: deal.agent_name || '',
          phone: deal.agent_phone || null,
          email: deal.agent_email || null,
          brokerage: deal.agent_brokerage || null,
          created_by: user.id,
        }),
      });
      if (res?.[0]) {
        setAgents(prev => [...prev, res[0]]);
        return res[0].id;
      }
    } catch { }
    return null;
  };

  const submitNewDeal = async () => {
    if (!newDeal.property_address) { setSubmitMsg('Property address is required'); return; }
    setSubmitting(true); setSubmitMsg('');
    try {
      const agentId = await saveAgentFromDeal(newDeal);
      const payload = buildDealPayload(newDeal, agentId);
      payload.user_id = user.id;
      await supa('/rest/v1/deals', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(payload) });
      setNewDeal(blankDeal());
      setSubmitMsg('Offer added');
      await loadAll();
      setTab('offers');
      setTimeout(() => setSubmitMsg(''), 2500);
    } catch (err) { setSubmitMsg(`Error: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const saveEditDeal = async () => {
    if (!editingDeal) return;
    setSavingDeal(true);
    try {
      const agentId = await saveAgentFromDeal(editingDeal);
      const payload = buildDealPayload(editingDeal, agentId || editingDeal.agent_id);
      payload.updated_at = new Date().toISOString();
      await supa(`/rest/v1/deals?id=eq.${editingDeal.id}`, { method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(payload) });
      setEditingDeal(null);
      setSelectedDeal(null);
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSavingDeal(false); }
  };

  const deleteDeal = async () => {
    if (!editingDeal || !confirm('Delete this offer? Cannot be undone.')) return;
    setSavingDeal(true);
    try {
      await supa(`/rest/v1/deals?id=eq.${editingDeal.id}`, { method: 'DELETE' });
      setEditingDeal(null); setSelectedDeal(null);
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSavingDeal(false); }
  };

  const buildDealPayload = (d, agentId) => ({
    property_address: d.property_address || null,
    city: d.city || null, state: d.state || null, zip: d.zip || null,
    seller_name: d.seller_name || null,
    offer_date: d.offer_date || null,
    contract_date: d.contract_date || null,
    option_period_expiration: d.option_period_expiration || null,
    closing_date: d.closing_date || null,
    initial_assignment_fee: d.initial_assignment_fee ? parseFloat(d.initial_assignment_fee) : null,
    option_fee: d.option_fee ? parseFloat(d.option_fee) : null,
    final_assignment_fee: d.final_assignment_fee ? parseFloat(d.final_assignment_fee) : null,
    status: d.status,
    notes: d.notes || null,
    dead_reason: d.dead_reason || null,
    lead_source: d.lead_source || null,
    agent_id: agentId || null,
    agent_name: d.agent_name || null,
    agent_phone: d.agent_phone || null,
    agent_email: d.agent_email || null,
    agent_brokerage: d.agent_brokerage || null,
    list_price: d.list_price ? parseFloat(d.list_price) : null,
    days_on_market: d.days_on_market ? parseInt(d.days_on_market) : null,
    interest_rate: d.interest_rate ? parseFloat(d.interest_rate) : null,
    piti: d.piti ? parseFloat(d.piti) : null,
    loan_balance: d.loan_balance ? parseFloat(d.loan_balance) : null,
    arv: d.arv ? parseFloat(d.arv) : null,
    repair_estimate: d.repair_estimate ? parseFloat(d.repair_estimate) : null,
    offer_range_low: d.offer_range_low ? parseFloat(d.offer_range_low) : null,
    offer_range_high: d.offer_range_high ? parseFloat(d.offer_range_high) : null,
    comp_source: d.comp_source || null,
    comp_notes: d.comp_notes || null,
    buyer_id: d.buyer_id || null,
    loi_generated_date: d.loi_generated_date || null,
    assignment_signed_date: d.assignment_signed_date || null,
  });

  // ── Agent CRUD ──
  const saveAgent = async (isNew) => {
    setSavingAgent(true);
    try {
      const data = isNew ? newAgent : editingAgent;
      if (isNew) {
        await supa('/rest/v1/agents', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ ...data, created_by: user.id }) });
        setNewAgent(blankAgent()); setShowNewAgent(false);
      } else {
        await supa(`/rest/v1/agents?id=eq.${editingAgent.id}`, { method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }) });
        setEditingAgent(null);
      }
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSavingAgent(false); }
  };

  const deleteAgent = async () => {
    if (!editingAgent || !confirm('Delete this agent?')) return;
    try {
      await supa(`/rest/v1/agents?id=eq.${editingAgent.id}`, { method: 'DELETE' });
      setEditingAgent(null); await loadAll();
    } catch (err) { alert(err.message); }
  };

  // ── Buyer CRUD ──
  const saveBuyer = async (isNew) => {
    setSavingBuyer(true);
    try {
      const data = isNew ? newBuyer : editingBuyer;
      const payload = { ...data, buy_box_min: data.buy_box_min ? parseFloat(data.buy_box_min) : null, buy_box_max: data.buy_box_max ? parseFloat(data.buy_box_max) : null };
      if (isNew) {
        await supa('/rest/v1/buyers', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ ...payload, created_by: user.id }) });
        setNewBuyer(blankBuyer()); setShowNewBuyer(false);
      } else {
        await supa(`/rest/v1/buyers?id=eq.${editingBuyer.id}`, { method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }) });
        setEditingBuyer(null);
      }
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSavingBuyer(false); }
  };

  const deleteBuyer = async () => {
    if (!editingBuyer || !confirm('Delete this buyer?')) return;
    try {
      await supa(`/rest/v1/buyers?id=eq.${editingBuyer.id}`, { method: 'DELETE' });
      setEditingBuyer(null); await loadAll();
    } catch (err) { alert(err.message); }
  };

  // ── Profile ──
  const saveProfile = async () => {
    setProfileSaving(true); setProfileMsg('');
    try {
      await supa(`/rest/v1/profiles?id=eq.${user.id}`, { method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ phone: profilePhone }) });
      setUser({ ...user, phone: profilePhone });
      setProfileMsg('Saved'); setTimeout(() => setProfileMsg(''), 2000);
    } catch (err) { setProfileMsg(`Error: ${err.message}`); }
    finally { setProfileSaving(false); }
  };

  // ── LOI ──
  const buildLoiData = () => {
    const senderName = user.full_name || user.email?.split('@')[0] || '';
    const agentFirstName = (loiForm.agent_name || '').trim().split(' ')[0] || '';
    const offerDateFmt = loiForm.offer_date ? new Date(loiForm.offer_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    return { ...loiForm, agent_first_name: agentFirstName, sender_name: senderName, sender_phone: user.phone || '', sender_email: user.email || '', offer_date_formatted: offerDateFmt };
  };

  const saveLoiOffer = async (data) => {
    try {
      await supa('/rest/v1/deals', {
        method: 'POST', headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          user_id: user.id, property_address: data.property_address, city: data.city || null, state: data.state || null, zip: data.zip || null, seller_name: data.seller_name || null, offer_date: data.offer_date || null, initial_assignment_fee: data.cash_offer ? parseFloat(data.cash_offer) : null, status: 'offer_made', agent_name: data.agent_name || null, agent_phone: data.agent_phone || null, agent_email: data.agent_email || null, lead_source: 'MLS Active', loi_generated_date: new Date().toISOString().split('T')[0],
          notes: `LOI sent to ${data.agent_name}. Cash: $${data.cash_offer}. ${data.include_subto ? 'Sub-To included.' : ''}`,
        }),
      });
      await loadAll();
    } catch { }
  };

  const downloadLoiWord = async () => {
    if (!loiForm.property_address || !loiForm.cash_offer || !loiForm.agent_name) { setLoiMsg('Agent name, property, and cash offer required'); return; }
    setLoiBusy(true); setLoiMsg('');
    try {
      const data = buildLoiData();
      const html = generateLoiHtml(data);
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(data.property_address || 'LOI').replace(/[^a-z0-9]/gi, '_')}_LOI.doc`; a.click();
      URL.revokeObjectURL(url);
      await saveLoiOffer(data);
      setLoiMsg('Word downloaded + offer logged'); setTimeout(() => setLoiMsg(''), 3000);
    } catch (err) { setLoiMsg(`Error: ${err.message}`); }
    finally { setLoiBusy(false); }
  };

  const downloadLoiPdf = async () => {
    if (!loiForm.property_address || !loiForm.cash_offer || !loiForm.agent_name) { setLoiMsg('Agent name, property, and cash offer required'); return; }
    setLoiBusy(true); setLoiMsg('');
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const { jsPDF } = window.jspdf;
      const data = buildLoiData();
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      generateLoiPdf(doc, data);
      doc.save(`${(data.property_address || 'LOI').replace(/[^a-z0-9]/gi, '_')}_LOI.pdf`);
      await saveLoiOffer(data);
      setLoiMsg('PDF downloaded + offer logged'); setTimeout(() => setLoiMsg(''), 3000);
    } catch (err) { setLoiMsg(`Error: ${err.message}`); }
    finally { setLoiBusy(false); }
  };

  // ── Computations ──
  const computeLeaderboard = () => {
    const now = new Date(), startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);
    const startISO = startDate.toISOString();

    const grouped = {};
    deals.forEach(d => {
      const uid = d.user_id;
      const name = d.profiles?.full_name || d.profiles?.email?.split('@')[0] || 'Unknown';
      if (!grouped[uid]) grouped[uid] = { userId: uid, name, pipeline: 0, closed: 0, closedCount: 0, activeCount: 0, offerCount: 0 };
      if (d.created_at >= startISO) grouped[uid].offerCount += 1;
      if (d.status !== 'closed' && d.status !== 'dead' && d.created_at >= startISO) {
        if (d.initial_assignment_fee) grouped[uid].pipeline += parseFloat(d.initial_assignment_fee);
        grouped[uid].activeCount += 1;
      }
      if (d.status === 'closed') {
        const dt = d.closing_date || d.created_at;
        if (dt >= startISO.split('T')[0]) {
          if (d.final_assignment_fee) grouped[uid].closed += parseFloat(d.final_assignment_fee);
          grouped[uid].closedCount += 1;
        }
      }
    });
    return Object.values(grouped).sort((a, b) => b.closed - a.closed || b.pipeline - a.pipeline);
  };

  const getReports = () => {
    const total = deals.length;
    const closed = deals.filter(d => d.status === 'closed').length;
    const dead = deals.filter(d => d.status === 'dead').length;
    const active = deals.filter(d => !['closed', 'dead'].includes(d.status)).length;
    const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0';
    const totalRevenue = deals.filter(d => d.status === 'closed').reduce((s, d) => s + parseFloat(d.final_assignment_fee || 0), 0);
    const avgDeal = closed > 0 ? totalRevenue / closed : 0;
    const deadReasons = {};
    deals.filter(d => d.status === 'dead' && d.dead_reason).forEach(d => { deadReasons[d.dead_reason] = (deadReasons[d.dead_reason] || 0) + 1; });
    return { total, closed, dead, active, conversionRate, totalRevenue, avgDeal, deadReasons };
  };

  const filteredOffers = () => statusFilter === 'all' ? deals : deals.filter(d => d.status === statusFilter);

  const fmtM = (n) => { if (n == null || n === '') return '—'; const num = parseFloat(n); if (isNaN(num)) return '—'; return `$${Math.round(num).toLocaleString()}`; };
  const fmtMShort = (n) => { if (!n) return '$0'; return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`; };
  const fmtDate = (d) => { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const initials = (name) => { if (!name) return '?'; const p = name.split(' '); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase(); };

  // ── LOI PDF & HTML generators ──
  const generateLoiPdf = (doc, data) => {
    const W = 612, M = 50, CW = W - 2 * M;
    let y = 50;
    const hex = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [nr,ng,nb] = hex(NAVY); const [gr,gg,gb] = hex(GOLD);

    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.setTextColor(nr,ng,nb);
    doc.text(COMPANY, M, y);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(nr,ng,nb);
    doc.text(data.sender_name, W-M, y-4, { align:'right' });
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(0,0,0);
    if (data.sender_phone) doc.text(`P. ${data.sender_phone}`, W-M, y+8, { align:'right' });
    doc.text(`E. ${data.sender_email}`, W-M, y+20, { align:'right' });
    y+=8; doc.setFontSize(7); doc.setTextColor(gr,gg,gb); doc.text('R E A L    E S T A T E', M, y);
    y+=12; doc.setDrawColor(gr,gg,gb); doc.setLineWidth(1); doc.line(M,y,W-M,y);
    y+=25; doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(nr,ng,nb);
    doc.text('LETTER OF INTENT TO PURCHASE', W/2, y, { align:'center' });
    y+=15; doc.setFillColor(248,245,238); doc.rect(M,y,CW,70,'F');
    doc.setDrawColor(gr,gg,gb); doc.setLineWidth(0.5); doc.line(M,y,M+CW,y); doc.line(M,y+70,M+CW,y+70);
    y+=18; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(nr,ng,nb); doc.text('To:', M+10, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.text(data.agent_name, M+35, y);
    doc.setFontSize(9); doc.setTextColor(100,100,100);
    const ac = [data.agent_phone?`P. ${data.agent_phone}`:null, data.agent_email?`E. ${data.agent_email}`:null].filter(Boolean).join('   ');
    if (ac) doc.text(ac, W-M-10, y, { align:'right' });
    y+=18; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(nr,ng,nb); doc.text('Date:', M+10, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.text(data.offer_date_formatted, M+45, y);
    y+=18; doc.setFont('helvetica','bold'); doc.setTextColor(nr,ng,nb); doc.text('Property:', M+10, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.text([data.property_address, data.city, data.state, data.zip].filter(Boolean).join(', '), M+60, y);
    y+=30; doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(0,0,0);
    const intro = `${data.agent_first_name||'Hello'}, thank you for your time. Below is the offer we discussed for ${data.property_address}.`;
    const il = doc.splitTextToSize(intro, CW); doc.text(il, M, y); y+=il.length*12;
    y+=10; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(nr,ng,nb); doc.text('OPTION 1 — CASH OFFER', M, y);
    y+=15; doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(0,0,0);
    [`Purchase Price (Cash): $${parseFloat(data.cash_offer).toLocaleString()}`,`Due Diligence: ${data.due_diligence_days} days`,`Closing: ${data.closing_days} days from Effective Date`,'Buyer pays all closing costs','As-Is purchase · Buyer\'s choice of Escrow'].forEach(b=>{doc.text('•',M+5,y);doc.text(b,M+15,y);y+=13;});
    if (data.include_subto) {
      y+=8; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(nr,ng,nb); doc.text('OPTION 2 — SUBJECT-TO EXISTING MORTGAGE', M, y);
      y+=15; doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(0,0,0);
      ['Purchase Price: Subject-to existing mortgage · $0 cash to Seller','Seller leaves loan; Buyer assumes payments','Listing Agent Fee: 1% paid by Buyer · Buyer pays closing costs','Due Diligence: 15 business days · Closing: On or before 60 days','As-Is · Buyer\'s choice of Escrow · Vesting determined during Escrow','Buyer responsible for taxes, insurance, all payments after COE'].forEach(b=>{const bl=doc.splitTextToSize(b,CW-20);doc.text('•',M+5,y);doc.text(bl,M+15,y);y+=bl.length*13;});
    }
    y+=8; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Summary:', M, y);
    doc.setFont('helvetica','normal');
    const sum = data.include_subto?'Cash = fast certain close. Sub-To = $0 obligation for seller, we take full responsibility + pay your commission. Happy to discuss.':'Cash provides a fast certain close. Happy to discuss further.';
    const sl = doc.splitTextToSize(sum, CW-55); doc.text(sl, M+55, y); y+=sl.length*12+15;
    doc.text('Sincerely,', M, y); y+=30; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(nr,ng,nb); doc.text(data.sender_name, M, y);
    y+=13; doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,100,100);
    doc.text([COMPANY, data.sender_phone, data.sender_email].filter(Boolean).join(' · '), M, y);
  };

  const generateLoiHtml = (data) => {
    const full = [data.property_address,data.city,data.state,data.zip].filter(Boolean).join(', ');
    const cash = data.cash_offer ? parseFloat(data.cash_offer).toLocaleString() : '';
    const sub = data.include_subto ? `<h3 style="color:${NAVY};font-family:Arial;font-size:11pt;margin-top:14px;margin-bottom:6px;">OPTION 2 &mdash; SUBJECT-TO EXISTING MORTGAGE</h3><ul style="font-family:Arial;font-size:10pt;margin:0;padding-left:20px;"><li><strong>Purchase Price:</strong> Subject-to existing mortgage &middot; $0 cash to Seller at COE</li><li>Seller leaves loan; Buyer assumes payments</li><li><strong>Agent Fee:</strong> 1% by Buyer &middot; Buyer pays closing costs</li><li><strong>DD:</strong> 15 biz days &middot; Close: On or before 60 days</li><li>As-Is &middot; Buyer's choice of Escrow &middot; Vesting during Escrow</li><li>Buyer responsible for taxes, insurance, all payments after COE</li></ul>` : '';
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:8.5in 11in;margin:.5in}body{font-family:Arial;font-size:10pt}</style></head><body>
<table style="width:100%;border-collapse:collapse;"><tr><td style="vertical-align:top;"><div style="font-size:18pt;font-weight:bold;color:${NAVY};">${COMPANY}</div><div style="font-size:7pt;color:${GOLD};letter-spacing:3px;">R E A L &nbsp; E S T A T E</div></td><td style="vertical-align:top;text-align:right;"><div style="font-weight:bold;color:${NAVY};">${data.sender_name}</div>${data.sender_phone?`<div>P. ${data.sender_phone}</div>`:''}<div>E. ${data.sender_email}</div></td></tr></table>
<hr style="border:none;border-top:1.5pt solid ${GOLD};margin:8pt 0;">
<h1 style="font-size:14pt;color:${NAVY};text-align:center;margin:10pt 0;">LETTER OF INTENT TO PURCHASE</h1>
<table style="width:100%;border-collapse:collapse;background:#f8f5ee;border-top:1pt solid ${GOLD};border-bottom:1pt solid ${GOLD};"><tr><td style="padding:8pt 10pt;">
<div style="margin-bottom:6pt;display:flex;justify-content:space-between;"><span><strong style="color:${NAVY};">To:</strong> ${data.agent_name}</span><span style="color:#6b7280;font-size:9pt;">${data.agent_phone?`P. ${data.agent_phone}&nbsp;&nbsp;`:''}${data.agent_email?`E. ${data.agent_email}`:''}</span></div>
<div style="margin-bottom:6pt;"><strong style="color:${NAVY};">Date:</strong> ${data.offer_date_formatted}</div>
<div><strong style="color:${NAVY};">Property:</strong> ${full}</div>
</td></tr></table>
<p>${data.agent_first_name||'Hello'}, thank you for your time. Below is the offer we discussed for <strong>${data.property_address}</strong>.</p>
<h3 style="color:${NAVY};font-size:11pt;margin-top:14px;margin-bottom:6px;">OPTION 1 &mdash; CASH OFFER</h3>
<ul style="font-size:10pt;margin:0;padding-left:20px;"><li><strong>Purchase Price (Cash):</strong> $${cash}</li><li><strong>Due Diligence:</strong> ${data.due_diligence_days} days</li><li><strong>Closing:</strong> ${data.closing_days} days from Effective Date</li><li>Buyer pays all reasonable closing costs</li><li>As-Is &middot; Buyer's choice of Escrow / Title</li></ul>
${sub}
<p><strong>Summary:</strong> ${data.include_subto?`Cash = fast certain close. Sub-To = $0 obligation, we take full responsibility + pay your commission. Happy to discuss.`:'Cash provides a fast certain close. Happy to discuss.'}</p>
<p style="margin-top:18pt;">Sincerely,</p>
<p style="font-weight:bold;color:${NAVY};margin-top:18pt;margin-bottom:0;">${data.sender_name}</p>
<p style="font-size:8pt;color:#6b7280;margin-top:2pt;">${COMPANY} &middot; ${data.sender_phone||''} ${data.sender_phone&&data.sender_email?'&middot;':''} ${data.sender_email}</p>
</body></html>`;
  };

  // ============================================================
  // LOGIN SCREEN
  // ============================================================
  if (!user) {
    return (
      <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${NAVY} 0%,#0f2030 100%)` }} className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{ background:`linear-gradient(135deg,${NAVY} 0%,${TEAL} 100%)` }} className="px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 mb-4"><Trophy size={32} className="text-white"/></div>
              <h1 className="text-3xl font-bold text-white">Ironbridge Platform</h1>
              <p className="text-white/80 mt-2 text-sm">QP Holdings LLC · Wholesale Operations</p>
            </div>
            <div className="p-8">
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button onClick={()=>{setAuthMode('login');setAuthError('');setAuthSuccess('');}} className={`flex-1 py-2 rounded-md font-semibold text-sm ${authMode==='login'?'bg-white shadow text-gray-900':'text-gray-500'}`}>Log In</button>
                <button onClick={()=>{setAuthMode('signup');setAuthError('');setAuthSuccess('');}} className={`flex-1 py-2 rounded-md font-semibold text-sm ${authMode==='signup'?'bg-white shadow text-gray-900':'text-gray-500'}`}>Sign Up</button>
              </div>
              {authError&&<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"><AlertCircle size={18} className="text-red-600 mt-0.5"/><p className="text-sm text-red-800">{authError}</p></div>}
              {authSuccess&&<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"><CheckCircle2 size={18} className="text-green-600 mt-0.5"/><p className="text-sm text-green-800">{authSuccess}</p></div>}
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode==='signup'&&<div><label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label><input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Geno McNeil" required/></div>}
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="you@example.com" required/></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="At least 6 characters" minLength={6} required/></div>
                <button type="submit" disabled={authLoading} style={{background:`linear-gradient(135deg,${NAVY} 0%,${TEAL} 100%)`}} className="w-full text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {authLoading&&<Loader2 size={18} className="animate-spin"/>}
                  {authLoading?'Loading...':authMode==='signup'?'Create Account':'Log In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================
  const leaderboard = computeLeaderboard();
  const reports = getReports();
  const offers = filteredOffers();
  const loiData = buildLoiData();

  const TABS = [
    { id:'leaderboard', label:'Leaderboard', icon:<Trophy size={16}/> },
    { id:'offers', label:`Offers (${deals.length})`, icon:<ClipboardList size={16}/> },
    { id:'new', label:'New Offer', icon:<Plus size={16}/> },
    { id:'loi', label:'LOI', icon:<FileSignature size={16}/> },
    { id:'agents', label:`Agents (${agents.length})`, icon:<UserCheck size={16}/> },
    { id:'buyers', label:`Buyers (${buyers.length})`, icon:<Users size={16}/> },
    { id:'reports', label:'Reports', icon:<BarChart3 size={16}/> },
    { id:'profile', label:'Profile', icon:<Settings size={16}/> },
  ];

  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(180deg,${NAVY} 0%,#0f2030 100%)`}} className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
              <Home size={22} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Ironbridge Platform</h1>
              <p className="text-white/60 text-xs">Hi {user.full_name || user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg flex items-center gap-2 text-sm font-medium">
            <LogOut size={16}/><span className="hidden sm:inline">Log Out</span>
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 mb-5 bg-white/5 p-1 rounded-xl overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={tab===t.id?{background:BURNT_ORANGE}:{}}
              className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${tab===t.id?'text-white shadow':'text-white/70 hover:bg-white/10'}`}>
              {t.icon}<span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── LEADERBOARD TAB ── */}
        {tab==='leaderboard'&&(
          <div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-5">
              <div style={{background:NAVY}} className="px-5 py-3 flex gap-2 flex-wrap">
                {['week','month','year'].map(p=>(
                  <button key={p} onClick={()=>setPeriod(p)} style={period===p?{background:BURNT_ORANGE}:{}} className={`px-4 py-1.5 rounded-md font-semibold text-sm capitalize ${period===p?'text-white':'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    {p==='week'?'This Week':p==='month'?'This Month':'This Year'}
                  </button>
                ))}
              </div>
              {loadingDeals?<div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{color:TEAL}}/></div>
              :dataError?<div className="p-5"><div className="p-4 bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={20} className="text-red-600 inline mr-2"/><span className="text-red-900 font-semibold">Cannot load data</span><p className="text-sm text-red-800 mt-1">{dataError}</p></div></div>
              :leaderboard.length===0?<div className="py-12 text-center"><Trophy size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No deals yet — add your first offer</p></div>
              :(
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500">Rank</th>
                      <th className="text-left py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500">Employee</th>
                      <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500">Offers</th>
                      <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500">Pipeline</th>
                      <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500">Closed</th>
                      <th className="text-right py-3 px-3 md:px-5 text-xs font-bold uppercase text-gray-500"># Closed</th>
                    </tr></thead>
                    <tbody>
                      {leaderboard.map((m,idx)=>{
                        const rc=['#facc15','#94a3b8',BURNT_ORANGE];
                        return(
                          <tr key={m.userId} className="border-b border-gray-100 hover:bg-slate-50">
                            <td className="py-4 px-3 md:px-5"><div style={{background:rc[idx]||'#475569'}} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white">{idx+1}</div></td>
                            <td className="py-4 px-3 md:px-5"><div className="flex items-center gap-3"><div style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials(m.name)}</div><p className="font-semibold text-gray-900">{m.name}</p></div></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-base font-bold text-gray-700">{m.offerCount}</p></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-base font-bold text-gray-600">{fmtMShort(m.pipeline)}</p><p className="text-xs text-gray-400">{m.activeCount} active</p></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-xl font-bold" style={{color:NAVY}}>{fmtM(m.closed)}</p></td>
                            <td className="py-4 px-3 md:px-5 text-right"><p className="text-base font-semibold text-gray-700">{m.closedCount}</p></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {leaderboard.length>0&&(
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Offers" value={deals.length} icon={<ClipboardList size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${TEAL} 0%,#3a7a70 100%)`}/>
                <StatCard label="Active Deals" value={deals.filter(d=>!['closed','dead'].includes(d.status)).length} icon={<TrendingUp size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)`}/>
                <StatCard label="Total Closed" value={fmtMShort(leaderboard.reduce((s,u)=>s+u.closed,0))} icon={<DollarSign size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}/>
                <StatCard label="Deals Closed" value={leaderboard.reduce((s,u)=>s+u.closedCount,0)} icon={<Award size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${NAVY} 0%,#0f2030 100%)`}/>
              </div>
            )}
          </div>
        )}

        {/* ── OFFERS TAB ── */}
        {tab==='offers'&&(
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{background:NAVY}} className="px-5 py-3">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-white/80 text-sm font-semibold mr-1">Filter:</span>
                <FilterBtn active={statusFilter==='all'} onClick={()=>setStatusFilter('all')}>All ({deals.length})</FilterBtn>
                {STATUS_OPTIONS.map(s=>(
                  <FilterBtn key={s.value} active={statusFilter===s.value} onClick={()=>setStatusFilter(s.value)}>
                    {s.label} ({deals.filter(d=>d.status===s.value).length})
                  </FilterBtn>
                ))}
              </div>
            </div>
            {loadingDeals?<div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{color:TEAL}}/></div>
            :offers.length===0?<div className="py-12 text-center"><ClipboardList size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No offers yet</p><button onClick={()=>setTab('new')} style={{background:BURNT_ORANGE}} className="mt-4 text-white font-semibold py-2 px-4 rounded-lg">Add First Offer</button></div>
            :(
              <div className="divide-y divide-gray-100">
                {offers.map(d=>{
                  const sm=getStatusMeta(d.status);
                  const sub=d.profiles?.full_name||d.profiles?.email?.split('@')[0]||'Unknown';
                  const buyer=buyers.find(b=>b.id===d.buyer_id);
                  return(
                    <button key={d.id} onClick={()=>{setSelectedDeal(d);loadDealDocs(d.id);}} className="w-full text-left p-4 md:p-5 hover:bg-slate-50">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span style={{background:sm.bg,color:sm.text}} className="px-2 py-0.5 rounded-md text-xs font-bold uppercase">{sm.label}</span>
                            <span className="text-xs text-gray-500">by {sub}</span>
                            {d.lead_source&&<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{d.lead_source}</span>}
                          </div>
                          <p className="font-bold text-gray-900 truncate">{d.property_address||'No address'}</p>
                          <p className="text-sm text-gray-600">{[d.city,d.state,d.zip].filter(Boolean).join(', ')||'—'}</p>
                          {d.agent_name&&<p className="text-xs text-gray-500 mt-0.5"><UserCheck size={11} className="inline mr-1"/>{d.agent_name}{d.agent_brokerage&&` · ${d.agent_brokerage}`}</p>}
                          {buyer&&<p className="text-xs text-gray-500"><Users size={11} className="inline mr-1"/>{buyer.name} ({buyer.company})</p>}
                        </div>
                        <div className="flex gap-4 md:gap-5 text-right flex-shrink-0">
                          {d.arv&&<div><p className="text-xs text-gray-500 font-semibold uppercase">ARV</p><p className="text-sm font-bold text-gray-600">{fmtM(d.arv)}</p></div>}
                          <div><p className="text-xs text-gray-500 font-semibold uppercase">Initial</p><p className="text-base font-bold text-gray-700">{fmtM(d.initial_assignment_fee)}</p></div>
                          <div><p className="text-xs text-gray-500 font-semibold uppercase">Final</p><p className="text-base font-bold" style={{color:d.final_assignment_fee?NAVY:'#9ca3af'}}>{fmtM(d.final_assignment_fee)}</p></div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── NEW OFFER TAB ── */}
        {tab==='new'&&(
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2"><Plus size={22} style={{color:BURNT_ORANGE}}/> New Offer</h2>
            <OfferForm deal={newDeal} setDeal={setNewDeal} buyers={buyers}/>
            {submitMsg&&<div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${submitMsg.startsWith('Error')?'bg-red-50 text-red-800':'bg-green-50 text-green-800'}`}>{submitMsg.startsWith('Error')?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}{submitMsg}</div>}
            <button onClick={submitNewDeal} disabled={submitting} style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="mt-5 w-full text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting&&<Loader2 size={18} className="animate-spin"/>}{submitting?'Saving...':'Save Offer'}
            </button>
          </div>
        )}

        {/* ── LOI TAB ── */}
        {tab==='loi'&&(
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2"><FileSignature size={22} style={{color:BURNT_ORANGE}}/> Generate LOI</h2>
              <p className="text-sm text-gray-500 mb-4">Downloads Word + PDF and auto-logs to Offers</p>
              {!user.phone&&<div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"><AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0"/><p className="text-sm text-amber-800">Add your phone in <button onClick={()=>setTab('profile')} className="underline font-semibold">Profile</button> to auto-fill LOIs.</p></div>}
              <LoiForm loi={loiForm} setLoi={setLoiForm}/>
              {loiMsg&&<div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${loiMsg.startsWith('Error')?'bg-red-50 text-red-800':'bg-green-50 text-green-800'}`}>{loiMsg.startsWith('Error')?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}{loiMsg}</div>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={downloadLoiWord} disabled={loiBusy} style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">{loiBusy?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}Word</button>
                <button onClick={downloadLoiPdf} disabled={loiBusy} style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">{loiBusy?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}PDF</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div style={{background:NAVY}} className="px-5 py-3 flex items-center gap-2"><Eye size={18} className="text-white"/><span className="text-white font-semibold text-sm">Live Preview</span></div>
              <div className="p-4 md:p-6 overflow-auto max-h-[700px]"><LoiPreviewBlock data={loiData}/></div>
            </div>
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {tab==='agents'&&(
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><UserCheck size={20}/> Agent Rolodex</h2>
              <button onClick={()=>setShowNewAgent(true)} style={{background:BURNT_ORANGE}} className="text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><Plus size={16}/>Add Agent</button>
            </div>
            {agents.length===0?<div className="py-12 text-center"><UserCheck size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No agents yet — they auto-populate as you log offers</p></div>
            :(
              <div className="divide-y divide-gray-100">
                {agents.map(a=>{
                  const agentDeals=deals.filter(d=>d.agent_email&&d.agent_email===a.email||d.agent_name===a.name);
                  return(
                    <button key={a.id} onClick={()=>setEditingAgent({...a})} className="w-full text-left p-4 md:p-5 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{initials(a.name)}</div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900">{a.name}</p>
                            {a.brokerage&&<p className="text-sm text-gray-600"><Building size={12} className="inline mr-1"/>{a.brokerage}</p>}
                            <div className="flex gap-3 mt-0.5">
                              {a.phone&&<p className="text-xs text-gray-500"><Phone size={11} className="inline mr-1"/>{a.phone}</p>}
                              {a.email&&<p className="text-xs text-gray-500"><Mail size={11} className="inline mr-1"/>{a.email}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold" style={{color:NAVY}}>{agentDeals.length}</p>
                          <p className="text-xs text-gray-500">offers</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BUYERS TAB ── */}
        {tab==='buyers'&&(
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Users size={20}/> Buyers List</h2>
              <button onClick={()=>setShowNewBuyer(true)} style={{background:BURNT_ORANGE}} className="text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><Plus size={16}/>Add Buyer</button>
            </div>
            {buyers.length===0?<div className="py-12 text-center"><Users size={32} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No buyers yet</p></div>
            :(
              <div className="divide-y divide-gray-100">
                {buyers.map(b=>{
                  const buyerDeals=deals.filter(d=>d.buyer_id===b.id);
                  return(
                    <button key={b.id} onClick={()=>setEditingBuyer({...b})} className="w-full text-left p-4 md:p-5 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{initials(b.name)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900">{b.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${b.type==='daisy_chain'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>{b.type==='daisy_chain'?'Daisy Chain':'End Buyer'}</span>
                              {!b.active&&<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>}
                            </div>
                            {b.company&&<p className="text-sm text-gray-600"><Building size={12} className="inline mr-1"/>{b.company}</p>}
                            <div className="flex gap-3 mt-0.5">
                              {b.phone&&<p className="text-xs text-gray-500"><Phone size={11} className="inline mr-1"/>{b.phone}</p>}
                              {b.email&&<p className="text-xs text-gray-500"><Mail size={11} className="inline mr-1"/>{b.email}</p>}
                            </div>
                            {(b.buy_box_min||b.buy_box_max)&&<p className="text-xs text-gray-500 mt-0.5">Buy box: {b.buy_box_min?fmtM(b.buy_box_min):''}{b.buy_box_min&&b.buy_box_max?' – ':''}{b.buy_box_max?fmtM(b.buy_box_max):''}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold" style={{color:NAVY}}>{buyerDeals.length}</p>
                          <p className="text-xs text-gray-500">deals</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab==='reports'&&(
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Offers" value={reports.total} icon={<ClipboardList size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${TEAL} 0%,#3a7a70 100%)`}/>
              <StatCard label="Closed" value={reports.closed} icon={<CheckCircle2 size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,#10b981 0%,#065f46 100%)`}/>
              <StatCard label="Conversion Rate" value={`${reports.conversionRate}%`} icon={<TrendingUp size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}/>
              <StatCard label="Total Revenue" value={fmtMShort(reports.totalRevenue)} icon={<DollarSign size={28} className="text-white/40"/>} bg={`linear-gradient(135deg,${NAVY} 0%,#0f2030 100%)`}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pipeline breakdown */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4">Pipeline Breakdown</h3>
                {STATUS_OPTIONS.map(s=>{
                  const count=deals.filter(d=>d.status===s.value).length;
                  const pct=reports.total>0?Math.round(count/reports.total*100):0;
                  return(
                    <div key={s.value} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{s.label}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div style={{width:`${pct}%`,background:s.color}} className="h-2 rounded-full"/>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Dead reasons */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4">Why Deals Die</h3>
                {Object.keys(reports.deadReasons).length===0?<p className="text-gray-500 text-sm">No dead deals yet</p>
                :Object.entries(reports.deadReasons).sort((a,b)=>b[1]-a[1]).map(([reason,count])=>{
                  const pct=reports.dead>0?Math.round(count/reports.dead*100):0;
                  return(
                    <div key={reason} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{reason}</span>
                        <span className="font-bold text-gray-900">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div style={{width:`${pct}%`,background:'#ef4444'}} className="h-2 rounded-full"/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Lead source */}
            <div className="bg-white rounded-2xl shadow-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Lead Sources</h3>
              <div className="grid grid-cols-3 gap-4">
                {LEAD_SOURCES.map(src=>{
                  const count=deals.filter(d=>d.lead_source===src).length;
                  return(
                    <div key={src} className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold" style={{color:NAVY}}>{count}</p>
                      <p className="text-sm text-gray-600 mt-1">{src}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab==='profile'&&(
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6 max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2"><Settings size={22} style={{color:BURNT_ORANGE}}/> Profile</h2>
            <p className="text-sm text-gray-500 mb-5">Your info appears on every LOI you generate</p>
            <div className="space-y-4">
              <FField label="Full Name"><input type="text" value={user.full_name||''} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"/></FField>
              <FField label="Email"><input type="email" value={user.email||''} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"/></FField>
              <FField label="Phone Number"><input type="tel" value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="214.702.6883"/></FField>
            </div>
            {profileMsg&&<div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.startsWith('Error')?'bg-red-50 text-red-800':'bg-green-50 text-green-800'}`}>{profileMsg.startsWith('Error')?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}{profileMsg}</div>}
            <button onClick={saveProfile} disabled={profileSaving} style={{background:`linear-gradient(135deg,${NAVY} 0%,${TEAL} 100%)`}} className="mt-5 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-60 flex items-center gap-2">
              {profileSaving&&<Loader2 size={18} className="animate-spin"/>}Save Profile
            </button>
          </div>
        )}

        {/* ── OFFER DETAIL MODAL ── */}
        {selectedDeal&&(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div style={{background:NAVY}} className="sticky top-0 px-5 py-4 flex justify-between items-center z-10">
                <h2 className="text-lg font-bold text-white truncate">{selectedDeal.property_address||'Offer Detail'}</h2>
                <div className="flex gap-2">
                  <button onClick={()=>{setEditingDeal({...selectedDeal});}} style={{background:BURNT_ORANGE}} className="text-white py-1.5 px-3 rounded-lg text-sm font-semibold flex items-center gap-1"><Edit3 size={14}/>Edit</button>
                  <button onClick={()=>{setSelectedDeal(null);setDealDocs([]);}} className="text-white/70 hover:text-white"><X size={24}/></button>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { const sm=getStatusMeta(selectedDeal.status); return <span style={{background:sm.bg,color:sm.text}} className="px-3 py-1 rounded-lg font-bold text-sm uppercase">{sm.label}</span>; })()}
                  {selectedDeal.lead_source&&<span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">{selectedDeal.lead_source}</span>}
                  {selectedDeal.dead_reason&&<span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-sm">❌ {selectedDeal.dead_reason}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Property */}
                  <DetailSection title="Property" icon={<MapPin size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="Address" value={[selectedDeal.property_address,selectedDeal.city,selectedDeal.state,selectedDeal.zip].filter(Boolean).join(', ')}/>
                    <DetailRow label="Seller" value={selectedDeal.seller_name}/>
                    <DetailRow label="List Price" value={fmtM(selectedDeal.list_price)}/>
                    <DetailRow label="Days on Market" value={selectedDeal.days_on_market?`${selectedDeal.days_on_market} days`:null}/>
                  </DetailSection>

                  {/* Agent */}
                  <DetailSection title="Agent" icon={<UserCheck size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="Name" value={selectedDeal.agent_name}/>
                    <DetailRow label="Brokerage" value={selectedDeal.agent_brokerage}/>
                    <DetailRow label="Phone" value={selectedDeal.agent_phone}/>
                    <DetailRow label="Email" value={selectedDeal.agent_email}/>
                  </DetailSection>

                  {/* Financing */}
                  <DetailSection title="Financing" icon={<DollarSign size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="Interest Rate" value={selectedDeal.interest_rate?`${selectedDeal.interest_rate}%`:null}/>
                    <DetailRow label="PITI" value={fmtM(selectedDeal.piti)}/>
                    <DetailRow label="Loan Balance" value={fmtM(selectedDeal.loan_balance)}/>
                  </DetailSection>

                  {/* Comp Analysis */}
                  <DetailSection title="Comp Analysis" icon={<BarChart3 size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="ARV" value={fmtM(selectedDeal.arv)}/>
                    <DetailRow label="Repair Est." value={fmtM(selectedDeal.repair_estimate)}/>
                    <DetailRow label="Offer Range" value={selectedDeal.offer_range_low||selectedDeal.offer_range_high?`${fmtM(selectedDeal.offer_range_low)} – ${fmtM(selectedDeal.offer_range_high)}`:null}/>
                    <DetailRow label="Comp Source" value={selectedDeal.comp_source}/>
                    {selectedDeal.comp_notes&&<div className="mt-2"><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p><p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{selectedDeal.comp_notes}</p></div>}
                  </DetailSection>

                  {/* Offer Details */}
                  <DetailSection title="Offer" icon={<FileText size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="Offer Date" value={fmtDate(selectedDeal.offer_date)}/>
                    <DetailRow label="Cash Offer" value={fmtM(selectedDeal.initial_assignment_fee)}/>
                    <DetailRow label="Option Fee" value={fmtM(selectedDeal.option_fee)}/>
                    <DetailRow label="Final Fee" value={fmtM(selectedDeal.final_assignment_fee)}/>
                    <DetailRow label="LOI Sent" value={fmtDate(selectedDeal.loi_generated_date)}/>
                  </DetailSection>

                  {/* Timeline */}
                  <DetailSection title="Timeline" icon={<Calendar size={16} style={{color:BURNT_ORANGE}}/>}>
                    <DetailRow label="Contract Date" value={fmtDate(selectedDeal.contract_date)}/>
                    <DetailRow label="Option Expires" value={fmtDate(selectedDeal.option_period_expiration)}/>
                    <DetailRow label="Closing Date" value={fmtDate(selectedDeal.closing_date)}/>
                    <DetailRow label="Assignment Signed" value={fmtDate(selectedDeal.assignment_signed_date)}/>
                    {selectedDeal.buyer_id&&<DetailRow label="Buyer" value={buyers.find(b=>b.id===selectedDeal.buyer_id)?.name||'—'}/>}
                  </DetailSection>
                </div>

                {selectedDeal.notes&&(
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
                    <p className="text-sm text-gray-700">{selectedDeal.notes}</p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><File size={16} style={{color:BURNT_ORANGE}}/>Documents & Photos</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {DOC_TYPES.map(dt=>(
                      <label key={dt.value} className="relative">
                        <input type="file" multiple accept={dt.value==='photo'?'image/*':'application/pdf,image/*'} onChange={e=>handleFileUpload(e,selectedDeal.id,dt.value)} className="sr-only" disabled={uploading}/>
                        <div style={{borderColor:TEAL}} className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-teal-50 transition ${uploading?'opacity-50':''}`}>
                          {dt.value==='photo'?<Image size={18} className="mx-auto mb-1" style={{color:TEAL}}/>:<File size={18} className="mx-auto mb-1" style={{color:TEAL}}/>}
                          <p className="text-xs font-semibold text-gray-700">{dt.label}</p>
                          <p className="text-xs text-gray-400">Click to upload</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {uploadMsg&&<p className={`text-sm mb-3 ${uploadMsg.startsWith('Error')?'text-red-600':'text-green-600'}`}>{uploadMsg}</p>}
                  {uploading&&<div className="flex items-center gap-2 text-sm text-gray-500 mb-3"><Loader2 size={16} className="animate-spin"/>Uploading...</div>}
                  {dealDocs.length>0&&(
                    <div className="space-y-2">
                      {dealDocs.map(doc=>{
                        const isPhoto=doc.type==='photo'||doc.file_type?.startsWith('image/');
                        return(
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 min-w-0">
                              {isPhoto?<Image size={16} className="text-blue-500 flex-shrink-0"/>:<File size={16} className="text-red-500 flex-shrink-0"/>}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-500">{DOC_TYPES.find(t=>t.value===doc.type)?.label||doc.type} · {doc.file_size?`${(doc.file_size/1024/1024).toFixed(1)}MB`:''}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={()=>openDoc(doc)} style={{color:TEAL}} className="text-sm font-semibold hover:underline">View</button>
                              <button onClick={()=>deleteDoc(doc,selectedDeal.id)} className="text-red-500 text-sm font-semibold hover:underline">Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {dealDocs.length===0&&!uploading&&<p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT OFFER MODAL ── */}
        {editingDeal&&(
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div style={{background:NAVY}} className="sticky top-0 px-5 py-4 flex justify-between items-center z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit3 size={20}/>Edit Offer</h2>
                <button onClick={()=>setEditingDeal(null)} className="text-white/70 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-5">
                <OfferForm deal={editingDeal} setDeal={setEditingDeal} buyers={buyers}/>
                <div className="mt-6 flex gap-3 flex-col sm:flex-row">
                  <button onClick={saveEditDeal} disabled={savingDeal} style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="flex-1 text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingDeal&&<Loader2 size={18} className="animate-spin"/>}Save Changes
                  </button>
                  <button onClick={deleteDeal} disabled={savingDeal} className="px-4 py-3 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 flex items-center justify-center gap-2"><Trash2 size={18}/>Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW AGENT MODAL ── */}
        {showNewAgent&&(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">Add Agent</h2>
                <button onClick={()=>setShowNewAgent(false)} className="text-white/70 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-5 space-y-4">
                <FField label="Name *"><input type="text" value={newAgent.name} onChange={e=>setNewAgent({...newAgent,name:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Mark Abraham"/></FField>
                <FField label="Brokerage"><input type="text" value={newAgent.brokerage} onChange={e=>setNewAgent({...newAgent,brokerage:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="Keller Williams"/></FField>
                <div className="grid grid-cols-2 gap-3">
                  <FField label="Phone"><input type="tel" value={newAgent.phone} onChange={e=>setNewAgent({...newAgent,phone:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="214.555.1234"/></FField>
                  <FField label="Email"><input type="email" value={newAgent.email} onChange={e=>setNewAgent({...newAgent,email:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900" placeholder="agent@example.com"/></FField>
                </div>
                <FField label="Notes"><textarea value={newAgent.notes} onChange={e=>setNewAgent({...newAgent,notes:e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none" placeholder="Notes..."/></FField>
                <button onClick={()=>saveAgent(true)} disabled={savingAgent||!newAgent.name} style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="w-full text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingAgent&&<Loader2 size={18} className="animate-spin"/>}Save Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT AGENT MODAL ── */}
        {editingAgent&&(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">Edit Agent</h2>
                <button onClick={()=>setEditingAgent(null)} className="text-white/70 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-5 space-y-4">
                <FField label="Name *"><input type="text" value={editingAgent.name} onChange={e=>setEditingAgent({...editingAgent,name:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"/></FField>
                <FField label="Brokerage"><input type="text" value={editingAgent.brokerage||''} onChange={e=>setEditingAgent({...editingAgent,brokerage:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"/></FField>
                <div className="grid grid-cols-2 gap-3">
                  <FField label="Phone"><input type="tel" value={editingAgent.phone||''} onChange={e=>setEditingAgent({...editingAgent,phone:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"/></FField>
                  <FField label="Email"><input type="email" value={editingAgent.email||''} onChange={e=>setEditingAgent({...editingAgent,email:e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"/></FField>
                </div>
                <FField label="Notes"><textarea value={editingAgent.notes||''} onChange={e=>setEditingAgent({...editingAgent,notes:e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none"/></FField>
                <div className="flex gap-3">
                  <button onClick={()=>saveAgent(false)} disabled={savingAgent} style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="flex-1 text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingAgent&&<Loader2 size={18} className="animate-spin"/>}Save
                  </button>
                  <button onClick={deleteAgent} disabled={savingAgent} className="px-4 py-3 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 flex items-center gap-2"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW BUYER MODAL ── */}
        {showNewBuyer&&(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">Add Buyer</h2>
                <button onClick={()=>setShowNewBuyer(false)} className="text-white/70 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-5 space-y-4">
                <BuyerFormFields buyer={newBuyer} setBuyer={setNewBuyer}/>
                <button onClick={()=>saveBuyer(true)} disabled={savingBuyer||!newBuyer.name} style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}} className="w-full text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingBuyer&&<Loader2 size={18} className="animate-spin"/>}Save Buyer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT BUYER MODAL ── */}
        {editingBuyer&&(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div style={{background:NAVY}} className="px-5 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">Edit Buyer</h2>
                <button onClick={()=>setEditingBuyer(null)} className="text-white/70 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-5 space-y-4">
                <BuyerFormFields buyer={editingBuyer} setBuyer={setEditingBuyer}/>
                <div className="flex gap-3">
                  <button onClick={()=>saveBuyer(false)} disabled={savingBuyer} style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}} className="flex-1 text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingBuyer&&<Loader2 size={18} className="animate-spin"/>}Save
                  </button>
                  <button onClick={deleteBuyer} disabled={savingBuyer} className="px-4 py-3 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 flex items-center gap-2"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function TabBtn({ active, onClick, icon, children }) {
  return <button onClick={onClick} style={active?{background:BURNT_ORANGE}:{}} className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${active?'text-white shadow':'text-white/70 hover:bg-white/10'}`}>{icon}<span className="whitespace-nowrap">{children}</span></button>;
}

function FilterBtn({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-2.5 py-1 rounded-md font-medium text-xs ${active?'bg-white text-gray-900 shadow':'bg-white/10 text-white/80 hover:bg-white/20'}`}>{children}</button>;
}

function StatCard({ label, value, icon, bg }) {
  return <div style={{background:bg}} className="rounded-xl shadow-xl p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-white/80 text-xs font-bold uppercase tracking-wider">{label}</p><p className="text-2xl md:text-3xl font-bold mt-2">{value}</p></div>{icon}</div></div>;
}

function FField({ label, children }) {
  return <div><label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{label}</label>{children}</div>;
}

function DetailSection({ title, icon, children }) {
  return <div className="bg-gray-50 rounded-xl p-4"><h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">{icon}{title}</h4><div className="space-y-1.5">{children}</div></div>;
}

function DetailRow({ label, value }) {
  if (!value || value === '—') return null;
  return <div className="flex justify-between gap-2"><span className="text-xs text-gray-500 font-medium flex-shrink-0">{label}</span><span className="text-sm text-gray-900 font-semibold text-right">{value}</span></div>;
}

function OfferForm({ deal, setDeal, buyers }) {
  const u = (f, v) => setDeal({ ...deal, [f]: v });
  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-1";
  const moneyInput = (field, placeholder) => (
    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span><input type="number" value={deal[field]||''} onChange={e=>u(field,e.target.value)} className={inputCls+" pl-7 font-semibold"} placeholder={placeholder}/></div>
  );

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {STATUS_OPTIONS.map(s=>(
            <button key={s.value} type="button" onClick={()=>u('status',s.value)} style={deal.status===s.value?{background:s.color,color:'white',borderColor:s.color}:{background:s.bg,color:s.text,borderColor:s.bg}} className="px-2 py-2 rounded-lg text-xs font-bold border-2">{s.label}</button>
          ))}
        </div>
        {deal.status==='dead'&&(
          <div className="mt-2"><label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Dead Reason</label>
          <select value={deal.dead_reason||''} onChange={e=>u('dead_reason',e.target.value)} className={inputCls}>
            <option value="">Select reason...</option>
            {DEAD_REASONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select></div>
        )}
      </div>

      {/* Lead Source */}
      <div><label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Lead Source</label>
      <select value={deal.lead_source||'MLS Active'} onChange={e=>u('lead_source',e.target.value)} className={inputCls}>
        {LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
      </select></div>

      {/* Property */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><MapPin size={14} style={{color:BURNT_ORANGE}}/>Property</h3>
      <div className="space-y-3">
        <FField label="Street Address *"><input type="text" value={deal.property_address||''} onChange={e=>u('property_address',e.target.value)} className={inputCls} placeholder="2006 Placerville"/></FField>
        <div className="grid grid-cols-3 gap-2">
          <FField label="City"><input type="text" value={deal.city||''} onChange={e=>u('city',e.target.value)} className={inputCls} placeholder="Forney"/></FField>
          <FField label="State"><input type="text" value={deal.state||''} onChange={e=>u('state',e.target.value)} className={inputCls} placeholder="TX" maxLength={2}/></FField>
          <FField label="Zip"><input type="text" value={deal.zip||''} onChange={e=>u('zip',e.target.value)} className={inputCls} placeholder="75126"/></FField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Seller Name"><input type="text" value={deal.seller_name||''} onChange={e=>u('seller_name',e.target.value)} className={inputCls} placeholder="John Smith"/></FField>
          <FField label="List Price">{moneyInput('list_price','285000')}</FField>
        </div>
        <FField label="Days on Market"><input type="number" value={deal.days_on_market||''} onChange={e=>u('days_on_market',e.target.value)} className={inputCls} placeholder="45"/></FField>
      </div></div>

      {/* Agent */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><UserCheck size={14} style={{color:BURNT_ORANGE}}/>Agent (from MLS)</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FField label="Agent Name"><input type="text" value={deal.agent_name||''} onChange={e=>u('agent_name',e.target.value)} className={inputCls} placeholder="Mark Abraham"/></FField>
          <FField label="Brokerage"><input type="text" value={deal.agent_brokerage||''} onChange={e=>u('agent_brokerage',e.target.value)} className={inputCls} placeholder="Keller Williams"/></FField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Agent Phone"><input type="tel" value={deal.agent_phone||''} onChange={e=>u('agent_phone',e.target.value)} className={inputCls} placeholder="214.555.1234"/></FField>
          <FField label="Agent Email"><input type="email" value={deal.agent_email||''} onChange={e=>u('agent_email',e.target.value)} className={inputCls} placeholder="agent@example.com"/></FField>
        </div>
      </div></div>

      {/* Financing */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><DollarSign size={14} style={{color:BURNT_ORANGE}}/>Financing (Mike collects)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FField label="Interest Rate (%)"><input type="number" step="0.001" value={deal.interest_rate||''} onChange={e=>u('interest_rate',e.target.value)} className={inputCls} placeholder="6.875"/></FField>
        <FField label="PITI / Month">{moneyInput('piti','1850')}</FField>
        <FField label="Loan Balance">{moneyInput('loan_balance','220000')}</FField>
      </div></div>

      {/* Comp Analysis */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><BarChart3 size={14} style={{color:BURNT_ORANGE}}/>Comp Analysis (Geno)</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <FField label="ARV">{moneyInput('arv','350000')}</FField>
          <FField label="Repair Est.">{moneyInput('repair_estimate','25000')}</FField>
          <FField label="Comp Source"><select value={deal.comp_source||'MLS Dallas'} onChange={e=>u('comp_source',e.target.value)} className={inputCls}>{COMP_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></FField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Offer Range Low">{moneyInput('offer_range_low','280000')}</FField>
          <FField label="Offer Range High">{moneyInput('offer_range_high','295000')}</FField>
        </div>
        <FField label="Comp Notes"><textarea value={deal.comp_notes||''} onChange={e=>u('comp_notes',e.target.value)} rows={2} className={inputCls+" resize-none"} placeholder="Key comps, adjustments, notes..."/></FField>
      </div></div>

      {/* Offer */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><FileText size={14} style={{color:BURNT_ORANGE}}/>Offer Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FField label="Offer Date"><input type="date" value={deal.offer_date||''} onChange={e=>u('offer_date',e.target.value)} className={inputCls}/></FField>
        <FField label="Cash Offer Amount">{moneyInput('initial_assignment_fee','285000')}</FField>
        <FField label="Option Fee">{moneyInput('option_fee','100')}</FField>
        <FField label="Final Assignment Fee">{moneyInput('final_assignment_fee','')}</FField>
        <FField label="LOI Sent Date"><input type="date" value={deal.loi_generated_date||''} onChange={e=>u('loi_generated_date',e.target.value)} className={inputCls}/></FField>
      </div></div>

      {/* Timeline */}
      <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><Calendar size={14} style={{color:BURNT_ORANGE}}/>Timeline</h3>
      <div className="grid grid-cols-2 gap-3">
        <FField label="Contract Date"><input type="date" value={deal.contract_date||''} onChange={e=>u('contract_date',e.target.value)} className={inputCls}/></FField>
        <FField label="Option Period Expires"><input type="date" value={deal.option_period_expiration||''} onChange={e=>u('option_period_expiration',e.target.value)} className={inputCls}/></FField>
        <FField label="Closing Date"><input type="date" value={deal.closing_date||''} onChange={e=>u('closing_date',e.target.value)} className={inputCls}/></FField>
        <FField label="Assignment Signed"><input type="date" value={deal.assignment_signed_date||''} onChange={e=>u('assignment_signed_date',e.target.value)} className={inputCls}/></FField>
      </div></div>

      {/* Buyer */}
      {buyers.length>0&&(
        <div><h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><Users size={14} style={{color:BURNT_ORANGE}}/>Assign Buyer</h3>
        <select value={deal.buyer_id||''} onChange={e=>u('buyer_id',e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm">
          <option value="">Not assigned</option>
          {buyers.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name} — {b.company}</option>)}
        </select></div>
      )}

      {/* Notes */}
      <FField label="Notes"><textarea value={deal.notes||''} onChange={e=>u('notes',e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none" placeholder="Additional notes, contingencies, etc."/></FField>
    </div>
  );
}

function BuyerFormFields({ buyer, setBuyer }) {
  const u = (f, v) => setBuyer({ ...buyer, [f]: v });
  const cls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm";
  return (
    <>
      <FField label="Name *"><input type="text" value={buyer.name||''} onChange={e=>u('name',e.target.value)} className={cls} placeholder="Ash Hoss"/></FField>
      <FField label="Company"><input type="text" value={buyer.company||''} onChange={e=>u('company',e.target.value)} className={cls} placeholder="Prophet Homes"/></FField>
      <div className="grid grid-cols-2 gap-3">
        <FField label="Phone"><input type="tel" value={buyer.phone||''} onChange={e=>u('phone',e.target.value)} className={cls} placeholder="214.555.1234"/></FField>
        <FField label="Email"><input type="email" value={buyer.email||''} onChange={e=>u('email',e.target.value)} className={cls} placeholder="ash@prophethomes.com"/></FField>
      </div>
      <FField label="Type"><select value={buyer.type||'daisy_chain'} onChange={e=>u('type',e.target.value)} className={cls}><option value="daisy_chain">Daisy Chain Buyer</option><option value="end_buyer">End Buyer</option></select></FField>
      <div className="grid grid-cols-2 gap-3">
        <FField label="Buy Box Min ($)"><input type="number" value={buyer.buy_box_min||''} onChange={e=>u('buy_box_min',e.target.value)} className={cls} placeholder="150000"/></FField>
        <FField label="Buy Box Max ($)"><input type="number" value={buyer.buy_box_max||''} onChange={e=>u('buy_box_max',e.target.value)} className={cls} placeholder="500000"/></FField>
      </div>
      <FField label="Areas"><input type="text" value={buyer.buy_box_areas||''} onChange={e=>u('buy_box_areas',e.target.value)} className={cls} placeholder="DFW, Collin County, Denton County"/></FField>
      <FField label="Notes"><textarea value={buyer.notes||''} onChange={e=>u('notes',e.target.value)} rows={2} className={cls+" resize-none"} placeholder="Notes..."/></FField>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={buyer.active} onChange={e=>u('active',e.target.checked)} className="w-4 h-4"/><span className="text-sm text-gray-700">Active buyer</span></label>
    </>
  );
}

function LoiForm({ loi, setLoi }) {
  const u = (f, v) => setLoi({ ...loi, [f]: v });
  const cls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm";
  return (
    <div className="space-y-4">
      <div><h3 className="text-sm font-bold text-gray-900 mb-2">Agent</h3>
      <FField label="Agent Name *"><input type="text" value={loi.agent_name} onChange={e=>u('agent_name',e.target.value)} className={cls} placeholder="Mark Abraham"/></FField>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <FField label="Phone"><input type="tel" value={loi.agent_phone} onChange={e=>u('agent_phone',e.target.value)} className={cls} placeholder="214.555.1234"/></FField>
        <FField label="Email"><input type="email" value={loi.agent_email} onChange={e=>u('agent_email',e.target.value)} className={cls} placeholder="agent@example.com"/></FField>
      </div></div>
      <div><h3 className="text-sm font-bold text-gray-900 mb-2">Property</h3>
      <FField label="Street Address *"><input type="text" value={loi.property_address} onChange={e=>u('property_address',e.target.value)} className={cls} placeholder="2006 Placerville"/></FField>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <FField label="City"><input type="text" value={loi.city} onChange={e=>u('city',e.target.value)} className={cls} placeholder="Forney"/></FField>
        <FField label="State"><input type="text" value={loi.state} onChange={e=>u('state',e.target.value)} className={cls} placeholder="TX" maxLength={2}/></FField>
        <FField label="Zip"><input type="text" value={loi.zip} onChange={e=>u('zip',e.target.value)} className={cls} placeholder="75126"/></FField>
      </div></div>
      <div className="grid grid-cols-2 gap-3">
        <FField label="Offer Date"><input type="date" value={loi.offer_date} onChange={e=>u('offer_date',e.target.value)} className={cls}/></FField>
        <FField label="Cash Offer *"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span><input type="number" value={loi.cash_offer} onChange={e=>u('cash_offer',e.target.value)} className={cls+" pl-7 font-semibold"} placeholder="315000"/></div></FField>
        <FField label="Due Diligence (days)"><input type="number" value={loi.due_diligence_days} onChange={e=>u('due_diligence_days',parseInt(e.target.value)||0)} className={cls} placeholder="10"/></FField>
        <FField label="Closing (days)"><input type="number" value={loi.closing_days} onChange={e=>u('closing_days',parseInt(e.target.value)||0)} className={cls} placeholder="15"/></FField>
      </div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={loi.include_subto} onChange={e=>u('include_subto',e.target.checked)} className="w-4 h-4"/><span className="text-sm text-gray-700">Include Subject-To option</span></label>
    </div>
  );
}

function LoiPreviewBlock({ data }) {
  const full=[data.property_address,data.city,data.state,data.zip].filter(Boolean).join(', ');
  const cash=data.cash_offer?parseFloat(data.cash_offer).toLocaleString():'___';
  return(
    <div style={{fontFamily:'Arial,sans-serif',fontSize:'10pt'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><div style={{fontWeight:'bold',fontSize:'18pt',color:NAVY}}>{COMPANY}</div><div style={{fontSize:'7pt',color:GOLD,letterSpacing:'3px'}}>R E A L &nbsp; E S T A T E</div></div>
        <div style={{textAlign:'right'}}><div style={{fontWeight:'bold',color:NAVY}}>{data.sender_name}</div>{data.sender_phone&&<div style={{fontSize:'9pt'}}>P. {data.sender_phone}</div>}<div style={{fontSize:'9pt'}}>E. {data.sender_email}</div></div>
      </div>
      <hr style={{border:'none',borderTop:`1.5pt solid ${GOLD}`,margin:'8pt 0'}}/>
      <h1 style={{fontSize:'14pt',color:NAVY,textAlign:'center',margin:'10pt 0'}}>LETTER OF INTENT TO PURCHASE</h1>
      <div style={{background:'#f8f5ee',borderTop:`1pt solid ${GOLD}`,borderBottom:`1pt solid ${GOLD}`,padding:'8pt 10pt'}}>
        <div style={{marginBottom:'6pt',display:'flex',justifyContent:'space-between'}}><span><strong style={{color:NAVY}}>To:</strong> {data.agent_name||'___'}</span><span style={{color:'#6b7280',fontSize:'9pt'}}>{data.agent_phone&&`P. ${data.agent_phone}  `}{data.agent_email&&`E. ${data.agent_email}`}</span></div>
        <div style={{marginBottom:'6pt'}}><strong style={{color:NAVY}}>Date:</strong> {data.offer_date_formatted||'___'}</div>
        <div><strong style={{color:NAVY}}>Property:</strong> {full||'___'}</div>
      </div>
      <p>{data.agent_first_name||'[Agent]'}, thank you for your time. Below is our offer for <strong>{data.property_address||'[property]'}</strong>.</p>
      <h3 style={{color:NAVY,fontSize:'11pt',marginTop:'14px',marginBottom:'6px'}}>OPTION 1 — CASH OFFER</h3>
      <ul style={{marginTop:0,paddingLeft:'20px'}}>
        <li><strong>Purchase Price (Cash):</strong> ${cash}</li>
        <li><strong>Due Diligence:</strong> {data.due_diligence_days} days</li>
        <li><strong>Closing:</strong> {data.closing_days} days from Effective Date</li>
        <li>Buyer pays all reasonable closing costs · As-Is · Buyer's choice of Escrow</li>
      </ul>
      {data.include_subto&&<><h3 style={{color:NAVY,fontSize:'11pt',marginTop:'14px',marginBottom:'6px'}}>OPTION 2 — SUBJECT-TO EXISTING MORTGAGE</h3><ul style={{marginTop:0,paddingLeft:'20px'}}><li><strong>Purchase Price:</strong> Subject-to existing mortgage · $0 cash to Seller at COE</li><li>Seller leaves loan; Buyer assumes payments</li><li><strong>Agent Fee:</strong> 1% by Buyer · Buyer pays closing costs</li><li><strong>DD:</strong> 15 biz days · Close: On or before 60 days</li></ul></>}
      <p><strong>Summary:</strong> {data.include_subto?'Cash = fast close. Sub-To = $0 obligation for seller, we take full responsibility + pay your commission.':'Cash provides a fast certain close.'} Happy to discuss.</p>
      <p style={{marginTop:'18pt'}}>Sincerely,</p>
      <p style={{fontWeight:'bold',color:NAVY,marginTop:'18pt',marginBottom:0}}>{data.sender_name}</p>
      <p style={{fontSize:'8pt',color:'#6b7280',marginTop:'2pt'}}>{COMPANY} · {data.sender_phone||''} {data.sender_phone&&data.sender_email?'·':''} {data.sender_email}</p>
    </div>
  );
}
