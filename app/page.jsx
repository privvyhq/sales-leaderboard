"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, LogOut, Plus, DollarSign, TrendingUp, Award, Loader2,
  AlertCircle, CheckCircle2, ClipboardList, X, Edit3, MapPin,
  Calendar, User, FileText, Trash2, FileSignature, Settings,
  Download, Eye, Users, UserCheck, BarChart3, Upload, File,
  Image, ChevronDown, Phone, Mail, Building, Home, ScrollText
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

  // PSA
  const [psaForm, setPsaForm] = useState(blankPsa());
  const [psaBusy, setPsaBusy] = useState(false);
  const [psaMsg, setPsaMsg] = useState('');

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

  function blankPsa() {
    return {
      property_address: '', city: '', state: 'TX', zip: '',
      property_apn: '', legal_description: '',
      earnest_money: '150',
      existing_1st_mortgage: '', existing_2nd_mortgage: '',
      new_loan: '', seller_carryback: '',
      cash_to_seller: '', cash_to_seller_exact: true,
      agent_fee_cash: '', agent_fee_approximate: true,
      total_price: '',
      coe_date: '',
      escrow_company: 'Closed Title', escrow_officer: '', escrow_phone: '', escrow_email: '',
      association: '',
      seller_1_name: '', seller_2_name: '',
      seller_address: '', seller_1_phone: '', seller_2_phone: '',
      seller_1_email: '', seller_2_email: '',
      inspection_days: '15',
      occupancy_seller: true, occupancy_notes: '',
      addendum_subject_to: true, addendum_post_closing: false, addendum_seller_ack: false,
      additional_terms: '', personal_property: '',
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
    { id:'psa', label:'PSA', icon:<ScrollText size={16}/> },
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
        {tab==='psa'&&(
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PSA Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6 overflow-y-auto" style={{maxHeight:'90vh'}}>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <ScrollText size={22} style={{color:BURNT_ORANGE}}/> Generate PSA
              </h2>
              <p className="text-sm text-gray-500 mb-4">Purchase Contract &amp; Escrow Instructions · QP Holdings LLC</p>
              <PsaForm psa={psaForm} setPsa={setPsaForm}/>
              {psaMsg&&<div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${psaMsg.startsWith('Error')?'bg-red-50 text-red-800':'bg-green-50 text-green-800'}`}>{psaMsg.startsWith('Error')?<AlertCircle size={16}/>:<CheckCircle2 size={16}/>}{psaMsg}</div>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={()=>downloadPsaWord(psaForm,user,setPsaBusy,setPsaMsg)} disabled={psaBusy}
                  style={{background:`linear-gradient(135deg,${TEAL} 0%,${NAVY} 100%)`}}
                  className="text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {psaBusy?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}Word
                </button>
                <button onClick={()=>downloadPsaPdf(psaForm,user,setPsaBusy,setPsaMsg)} disabled={psaBusy}
                  style={{background:`linear-gradient(135deg,${BURNT_ORANGE} 0%,#a04f12 100%)`}}
                  className="text-white font-semibold py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {psaBusy?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}PDF
                </button>
              </div>
            </div>
            {/* PSA Preview */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div style={{background:NAVY}} className="px-5 py-3 flex items-center gap-2">
                <Eye size={18} className="text-white"/>
                <span className="text-white font-semibold text-sm">Live Preview — Basic Terms</span>
              </div>
              <div className="p-4 md:p-6 overflow-auto" style={{maxHeight:'85vh'}}>
                <PsaPreview psa={psaForm}/>
              </div>
            </div>
          </div>
        )}

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

// ============================================================
// PSA HELPERS
// ============================================================

const BUYER_FIXED = {
  name: 'QP Holdings, LLC, a Wyoming limited liability company ("Buyer")',
  shortName: 'QP Holdings, LLC',
  address: '30 N Gould St. Ste: R\nSheridan, WY 82801',
  phone: '214-702-6883',
  signer: 'Michael Harry',
  title: 'Authorized Signer',
};

function fmtDollars(val) {
  if (!val || val === '') return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcTotal(p) {
  if (p.total_price) return parseFloat(p.total_price);
  return (
    (parseFloat(p.earnest_money) || 0) +
    (parseFloat(p.existing_1st_mortgage) || 0) +
    (parseFloat(p.existing_2nd_mortgage) || 0) +
    (parseFloat(p.new_loan) || 0) +
    (parseFloat(p.seller_carryback) || 0) +
    (parseFloat(p.cash_to_seller) || 0) +
    (parseFloat(p.agent_fee_cash) || 0)
  );
}

function fmtCoeDate(d) {
  if (!d) return { month: '___', day: '___', year: '___' };
  const dt = new Date(d + 'T00:00:00');
  return {
    month: dt.toLocaleString('en-US', { month: 'long' }),
    day: String(dt.getDate()),
    year: String(dt.getFullYear()),
  };
}

async function downloadPsaWord(psa, user, setBusy, setMsg) {
  if (!psa.property_address || !psa.seller_1_name) {
    setMsg('Property address and seller name are required'); return;
  }
  setBusy(true); setMsg('');
  try {
    const html = generatePsaHtml(psa);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(psa.property_address || 'PSA').replace(/[^a-z0-9]/gi, '_')}_PSA.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Word downloaded'); setTimeout(() => setMsg(''), 3000);
  } catch (err) { setMsg(`Error: ${err.message}`); }
  finally { setBusy(false); }
}

async function downloadPsaPdf(psa, user, setBusy, setMsg) {
  if (!psa.property_address || !psa.seller_1_name) {
    setMsg('Property address and seller name are required'); return;
  }
  setBusy(true); setMsg('');
  try {
    await new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="jspdf"]')) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = reject;
      document.body.appendChild(s);
    });
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    generatePsaPdfContent(doc, psa);
    doc.save(`${(psa.property_address || 'PSA').replace(/[^a-z0-9]/gi, '_')}_PSA.pdf`);
    setMsg('PDF downloaded'); setTimeout(() => setMsg(''), 3000);
  } catch (err) { setMsg(`Error: ${err.message}`); }
  finally { setBusy(false); }
}

function generatePsaHtml(p) {
  const coe = fmtCoeDate(p.coe_date);
  const total = calcTotal(p);
  const fullAddr = [p.property_address, p.city, p.state, p.zip].filter(Boolean).join(', ');

  const priceRow = (label, val, note = '') => val
    ? `<tr><td style="padding:2pt 8pt;font-family:Courier New;font-size:10pt;white-space:nowrap;">$&nbsp;${fmtDollars(val)}</td><td style="padding:2pt 8pt;font-family:Arial;font-size:10pt;">${label}${note ? `<br><span style="font-size:9pt;">${note}</span>` : ''}</td></tr>`
    : `<tr><td style="padding:2pt 8pt;font-family:Arial;font-size:10pt;color:#aaa;">$____________</td><td style="padding:2pt 8pt;font-family:Arial;font-size:10pt;color:#aaa;">${label}</td></tr>`;

  const checkBox = (checked) => checked ? '&#9746;' : '&#9744;';

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">
<style>
@page { size:8.5in 11in; margin:.75in .75in .75in .75in; }
body { font-family:Arial,sans-serif; font-size:10pt; line-height:1.4; }
h1 { font-size:12pt; text-align:center; font-weight:bold; }
h2 { font-size:11pt; font-weight:bold; }
p { margin:6pt 0; text-align:justify; }
.section { margin-top:12pt; }
table { border-collapse:collapse; }
.basic-terms td { padding:4pt 6pt; vertical-align:top; }
</style></head><body>

<h1>PURCHASE CONTRACT AND ESCROW INSTRUCTIONS</h1>

<p><strong>THIS PURCHASE CONTRACT AND ESCROW INSTRUCTIONS</strong> ("Contract"), is effective as of the latest date this Contract is executed by the Parties as set forth below (the "Effective Date"), and comprises the entire contract and agreement between Seller (defined in Section 1.9 below) and Buyer (defined in Section 1.9 below).</p>

<p><strong>1. BASIC TERMS.</strong> This Section 1 defines the Basic Terms of this Contract.</p>

<table class="basic-terms" style="width:100%;">
<tr><td style="width:130pt;font-weight:bold;vertical-align:top;">1.1&nbsp;&nbsp;Property Address:</td><td><strong><u>${fullAddr || '___________________________________'}</u></strong></td></tr>
<tr><td style="height:8pt;"></td><td></td></tr>
<tr><td style="font-weight:bold;vertical-align:top;">1.2&nbsp;&nbsp;Property APN:</td><td><u>${p.property_apn || '__________________________'}</u></td></tr>
<tr><td style="font-weight:bold;vertical-align:top;padding-top:6pt;">1.3&nbsp;&nbsp;Legal Description:</td><td style="padding-top:6pt;">${p.legal_description ? `<u>${p.legal_description}</u>` : '_____________________________________________<br>_____________________________________________;'}<br><br>${checkBox(false)}&nbsp;See Exhibit A attached (if lengthy);&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;To be provided by Escrow Agent.</td></tr>
<tr><td style="font-weight:bold;vertical-align:top;padding-top:6pt;">1.4&nbsp;&nbsp;The Property:</td><td style="padding-top:6pt;">The real property bearing the street address in Section 1.1, the APN in Section 1.2 and the legal description in Section 1.3 together with all improvements, fixtures, and appurtenances thereon or incidental thereto, plus the personal property described in Section 1.12.</td></tr>
<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.5&nbsp;&nbsp;Purchase Price:</td><td style="padding-top:10pt;">
<table>
${priceRow('Earnest Money Deposit (the "Deposit")', p.earnest_money)}
${priceRow(`Approximate Existing 1st Mortgage (Buyer Purchasing Subject To)`, p.existing_1st_mortgage)}
${p.existing_2nd_mortgage ? priceRow('Approximate Existing 2nd Mortgage (Buyer Purchasing Subject To)', p.existing_2nd_mortgage) : '<tr><td style="padding:2pt 8pt;color:#aaa;">$____________</td><td style="padding:2pt 8pt;color:#aaa;">Approximate Existing 2nd Mortgage (Buyer Purchasing Subject To)</td></tr>'}
<tr><td style="padding:2pt 8pt;color:#aaa;">$____________</td><td style="padding:2pt 8pt;color:#aaa;">New Loan to Buyer (From Lender Other Than Seller)</td></tr>
<tr><td style="padding:2pt 8pt;color:#aaa;">$____________</td><td style="padding:2pt 8pt;color:#aaa;">Seller Carryback Financing</td></tr>
${p.cash_to_seller ? `<tr><td style="padding:2pt 8pt;font-family:Courier New;font-size:10pt;">$&nbsp;${fmtDollars(p.cash_to_seller)}</td><td style="padding:2pt 8pt;">Cash to Seller at COE &nbsp;&nbsp; ${checkBox(!p.cash_to_seller_exact)}&nbsp;Approximate or ${checkBox(p.cash_to_seller_exact)}&nbsp;Exact</td></tr>` : '<tr><td style="padding:2pt 8pt;color:#aaa;">$____________</td><td style="padding:2pt 8pt;color:#aaa;">Cash to Seller at COE</td></tr>'}
${p.agent_fee_cash ? `<tr><td style="padding:2pt 8pt;font-family:Courier New;font-size:10pt;">$&nbsp;${fmtDollars(p.agent_fee_cash)}</td><td style="padding:2pt 8pt;">Cash at COE (to include agents fee) &nbsp;&nbsp; ${checkBox(p.agent_fee_approximate)}&nbsp;Approximate or ${checkBox(!p.agent_fee_approximate)}&nbsp;Exact</td></tr>` : ''}
<tr><td style="padding:4pt 8pt;font-family:Courier New;font-size:10pt;font-weight:bold;border-top:1pt solid #000;">$&nbsp;${fmtDollars(total)}</td><td style="padding:4pt 8pt;font-weight:bold;border-top:1pt solid #000;"><strong>Total Purchase Price</strong> &nbsp;&nbsp; ${checkBox(true)}&nbsp;Approximate or ${checkBox(false)}&nbsp;Exact</td></tr>
</table>
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.6&nbsp;&nbsp;Close of Escrow:<br>("COE")</td><td style="padding-top:10pt;">
${checkBox(true)}&nbsp;${coe.month}___${coe.day}___, ${coe.year}; or<br>
${checkBox(false)}&nbsp;____ days after Effective Date; or<br>
${checkBox(false)}&nbsp;____ days after ____________________________
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.7&nbsp;&nbsp;Escrow Agent:</td><td style="padding-top:10pt;">
<u>${p.escrow_company || '____________________________________'}</u><br><br>
Escrow Officer: <u>${p.escrow_officer || '____________________________'}</u><br>
Telephone: <u>${p.escrow_phone || '____________________________'}</u><br>
Email: <u>${p.escrow_email || '____________________________'}</u>
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.8&nbsp;&nbsp;Association(s):</td><td style="padding-top:10pt;">${p.association || '_____________________________________________'}</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.9&nbsp;&nbsp;Parties:</td><td style="padding-top:10pt;">
<strong>Seller:</strong><br>
<strong><u>${p.seller_1_name || '____________________________'}</u></strong><br>
${p.seller_2_name ? `<u>${p.seller_2_name}</u><br>` : ''}
(Collectively the "Seller")<br><br>
Address: <u>${p.seller_address || '____________________________________'}</u><br>
Telephone: <u>${p.seller_1_phone || '____________________________'}</u>${p.seller_2_phone ? `&nbsp;&nbsp;&nbsp;<u>${p.seller_2_phone}</u>` : ''}<br>
Email: <u>${p.seller_1_email || '____________________________'}</u>${p.seller_2_email ? `&nbsp;&nbsp;&nbsp;<u>${p.seller_2_email}</u>` : ''}<br><br>
<strong>Buyer:</strong><br>
${BUYER_FIXED.name}<br><br>
Address: ${BUYER_FIXED.address.replace('\n', '<br>')}<br>
Telephone: <u>${BUYER_FIXED.phone}</u>
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.10&nbsp;&nbsp;Inspection Period:</td><td style="padding-top:10pt;"><u>${p.inspection_days || '15'}</u> Business Days</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.11&nbsp;&nbsp;Specific Closing Costs:</td><td style="padding-top:10pt;">
<strong>Escrow fees and costs:</strong><br>
${checkBox(false)}&nbsp;50% by Buyer and ${checkBox(false)}&nbsp;50% by Seller;&nbsp;&nbsp;OR<br>
${checkBox(true)}&nbsp;100% by Buyer;&nbsp;&nbsp;OR&nbsp;&nbsp;${checkBox(false)}&nbsp;100% by Seller.<br><br>
<strong>Standard Title Policy:</strong>&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Seller&nbsp;&nbsp;&nbsp;${checkBox(true)}&nbsp;Buyer<br><br>
<strong>HOA transfer fee(s):</strong>&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Seller&nbsp;&nbsp;&nbsp;${checkBox(true)}&nbsp;Buyer<br><br>
<strong>HOA capital improvement and reserve fees:</strong>&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Seller&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Buyer<br><br>
<strong>HOA disclosure fee(s):</strong>&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Seller&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Buyer<br><br>
Closing fee of $____________ (if closing at law firm not through Escrow Agent):&nbsp;&nbsp;&nbsp;${checkBox(false)}&nbsp;Seller&nbsp;&nbsp;&nbsp;${checkBox(true)}&nbsp;Buyer
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.12&nbsp;&nbsp;Personal Property:</td><td style="padding-top:10pt;">${p.personal_property || 'N/A'}</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.13&nbsp;&nbsp;Addendums:</td><td style="padding-top:10pt;">
${checkBox(p.addendum_subject_to)}&nbsp;Subject To Addendum (See attached).<br>
${checkBox(p.addendum_post_closing)}&nbsp;Post-Closing Possession Addendum (See attached).<br>
${checkBox(p.addendum_seller_ack)}&nbsp;Seller Acknowledgements (See attached or executed at COE).
</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.14&nbsp;&nbsp;Additional Terms:</td><td style="padding-top:10pt;">${p.additional_terms || '____________________________________________'}</td></tr>

<tr><td style="font-weight:bold;vertical-align:top;padding-top:10pt;">1.15&nbsp;&nbsp;Occupancy:</td><td style="padding-top:10pt;">
${checkBox(p.occupancy_seller)}&nbsp;There are no parties in occupancy of the Property other than Seller and Buyer will be given occupancy of the Property at Closing unless otherwise specified herein: ${p.occupancy_notes ? `<u>${p.occupancy_notes}</u>` : '__________________________________________'}; OR<br><br>
${checkBox(!p.occupancy_seller)}&nbsp;Buyer understands that the Property is leased and the tenant may continue in possession of the Property after Closing unless otherwise agreed in writing.
</td></tr>
</table>

<p style="text-align:center;margin-top:24pt;">Seller Initials: ______/______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Buyer Initials: ______/______</p>
<p style="page-break-after:always;"></p>

<!-- SECTIONS 2-13 BOILERPLATE -->
<h2>2. PURCHASE AND SALE OF PROPERTY.</h2>
<p>For the Purchase Price and in accordance with the terms and conditions set forth in this Contract, Seller agrees to sell and Buyer agrees to buy the Property identified in Section 1.4. The personal property to be conveyed as part of the Property includes, but is not limited to, built in appliances, ceiling fans, remote controls to operate any fixture or equipment on the Property, central vacuum, hose and attachments, draperies and other window coverings, fireplace equipment (affixed), floor coverings (affixed), free standing range/oven, garage door openers, light fixtures, mailbox, media antennas/satellite dishes (affixed), outdoor fountains and lighting, outdoor landscaping, shutters and awnings, smart home devices and access thereto (i.e. video doorbell, automated thermostat), flush-mounted speakers, storage sheds, storm windows and doors, gas-log, pellet and wood-burning stoves, built in BBQ grills, affixed timers, towel, curtain and drapery rods, wall mounted TV brackets and hardware (excluding TVs), water-misting systems, window and door screens, sun shades, solar systems owned by Seller, security system and alarms owned by Seller, water softeners owned by Seller, water purification systems owned by Seller, and pool and spa covers and equipment.</p>

<h2>3. PURCHASE PRICE; METHOD OF PAYMENT.</h2>
<p>The Purchase Price shall be paid by Buyer pursuant to the provisions of Section 1.5.</p>

<h2>4. STATUS OF TITLE.</h2>
<p><strong>4.1 Title Documents.</strong> As soon as practical following the Effective Date of this Contract, Escrow Agent shall cause to be issued and delivered to Buyer: (a) a current commitment for an ALTA Residential Owner's Policy of Title Insurance ("Title Report"); and (b) copies of all documents referenced as exceptions therein (together with the Title Report, the "Title Documents").</p>
<p><strong>4.2 Buyer's Review of Title.</strong> Buyer shall have ten (10) days from receipt of the Title Documents or from any amendments thereto to provide Seller with notice of any items shown in the Title Documents for which Buyer disapproves.</p>
<p><strong>4.3 Seller's Spouse to Execute Contract or Disclaimer Deed.</strong> If Seller is married and the spouse has not executed this Contract, Seller's spouse shall execute this Contract or execute and deliver a disclaimer deed for the Property to the Escrow Agent within three (3) days from the Effective Date.</p>

<h2>5. DISCLOSURE</h2>
<p><strong>5.1 Septic or Alternative Wastewater Treatment Facility.</strong> If the Property is on a septic system or alternative system that uses a septic tank, the system must have a pre-transfer inspection performed within six (6) months prior to COE as required by Texas Department of Environmental Quality. Seller shall deliver the wastewater treatment facility inspection report to Buyer within five (5) days of the Effective Date.</p>
<p><strong>5.2 Lead-Based Paint Disclosure.</strong> If the residence or other structures on the Property were built prior to 1978, Seller, within five (5) days from the Effective Date shall notify Buyer of any known lead-based paint ("LBP") or LBP hazards on the Property.</p>
<p>If the residence or other structures on the Property were constructed prior to 1978: (BUYER'S INITIALS REQUIRED) ____________ ____________</p>
<p>If the residence or other structures on the Property were constructed in 1978 or later: (BUYER'S INITIALS REQUIRED) ____________ ____________</p>
<p><strong>5.3 Changes to Property Prior to COE.</strong> Seller shall provide notice to Buyer within three (3) days of any material change(s) to the Property. Buyer shall have five (5) days from Buyer's receipt of such notice to notify Seller if Buyer elects to cancel this Contract.</p>

<h2>6. INSPECTION OF PROPERTY.</h2>
<p><strong>6.1 Inspection Period.</strong> Within the time set forth in Section 1.10, Buyer, at Buyer's sole cost, shall conduct and complete all inspections, investigations or tests, and review all information and reports deemed necessary by Buyer (collectively, the "Studies"), in order for Buyer to determine the suitability of the Property. Buyer, in Buyer's sole and absolute discretion, may through written notice to Seller, cancel this Contract during the Inspection Period and obtain a return of the Deposit.</p>
<p><strong>6.2 Buyer's Continued Access to Property.</strong> From the Effective Date through COE, Seller grants access to the Property to Buyer and will make the Property reasonably available to Buyer and to Buyer's assignees, prospective assignees, agents, representatives, inspectors and authorized individuals to conduct walkthrough(s) of the Property.</p>
<p><strong>6.3 Seller to Keep and Maintain Utility Service.</strong> Seller shall, at Seller's expense, have all utilities on until COE to allow Buyer to conduct Buyer's inspections and walkthroughs.</p>

<h2>7. ESCROW; COE; CLOSING COSTS AND PRORATIONS.</h2>
<p><strong>7.1 COE.</strong> Seller and Buyer engage Escrow Agent to act as the escrow agent for the closing of the transactions contemplated by this Contract. COE shall be deemed to occur on the date the Deed is recorded with the recorder of the county in which the Property is located.</p>
<p><strong>7.2 Buyer's Closing Deliveries.</strong> The amount due at COE under Section 1.5 shall be paid to Seller by Buyer through escrow at the COE, together with: (7.2.1) Buyer's pro rata portion of all ad valorem real estate taxes; (7.2.2) An Affidavit of Property Value as required by Texas law; (7.2.3) All specific closing costs to be paid by Buyer as set forth in Section 1.11; and (7.2.4) All other documents Escrow Agent reasonably requests Buyer to execute.</p>
<p><strong>7.3 Seller's Closing Deliveries.</strong> (7.3.1) Seller shall convey title to the Property by Special Warranty Deed ("Deed") at COE. (7.3.2) Seller shall execute an Affidavit of Property Value as required by Texas law. (7.3.3) Seller shall execute all documents marked in Sections 1.13 and 1.14 if not previously executed. (7.3.4) Seller shall execute all other documents Escrow Agent reasonably requests.</p>
<p><strong>7.4 Tax Proration.</strong> Seller shall pay all real estate taxes encumbering the Property for the years prior to the year of COE. Taxes for the year of COE shall be prorated and paid by Seller and Buyer as of the COE.</p>
<p><strong>7.5 Specific Closing Costs.</strong> Seller shall pay the specific closing costs applicable to Seller as set forth in Section 1.11.</p>
<p><strong>7.6 Buyer Right to Proceed Without Escrow Agent.</strong> Buyer, at any time prior to COE, may elect to proceed with this transaction without utilizing the services of Escrow Agent. In such an event, Seller will be obligated to fully perform all terms and conditions of this Contract.</p>
<p><strong>SELLER UNDERSTANDS, ACKNOWLEDGES AND AGREES THAT NOTWITHSTANDING THE FACT THAT SELLER MAY HAVE PAID A CLOSING FEE TO A LAW FIRM OF BUYER'S CHOOSING FOR THE PURPOSE OF CLOSING THIS TRANSACTION, THE LAW FIRM REPRESENTS THE BUYER ONLY AND DOES NOT REPRESENT SELLER IN THIS TRANSACTION.</strong></p>
<p>Seller Initials ____________ &nbsp;&nbsp; Seller Initials ____________</p>

<h2>8. REPRESENTATIONS AND WARRANTIES.</h2>
<p><strong>8.1 Seller Representations and Warranties.</strong> Seller hereby represents, warrants and covenants that: (8.1.1) Seller has full right, power and authority to sell the Property to Buyer as provided in this Contract; (8.1.2) To Seller's actual knowledge, there are no leases that will be in effect as of COE, occupancy agreements, easements, licenses, or other agreements that grant third parties any possessory or usage rights to the Property; (8.1.3) Seller will maintain and repair the Property so that as of COE, it will be in substantially the same conditions as of the Effective Date; (8.1.4) Seller has disclosed to Buyer all material latent defects and any information concerning the Property known to Seller which materially and adversely affect the consideration to be paid by Buyer.</p>
<p><strong>8.2 Buyer Representations and Warranties.</strong> Buyer warrants that Buyer has the full right, power and authority to enter into this Contract.</p>

<h2>9. DEFAULT; REMEDIES.</h2>
<p><strong>9.1 Cure Period.</strong> If a party fails to comply or perform under this Contract, the other party shall deliver a notice to the breaching party specifying the non-compliance (the "Cure Notice"). If the non-compliance is not cured within three (3) business days after receipt of the Cure Notice, the failure to comply shall become a breach of this Contract.</p>
<p><strong>9.2 Default by Seller.</strong> If Seller shall breach any of the terms or provisions of this Contract prior to COE, Buyer may proceed against Seller for any claim or remedy the Buyer may have in law or equity, which includes, but is not limited to, specific performance and/or damages.</p>
<p><strong>9.3 Default by Buyer.</strong> If Buyer breaches this Contract, Seller accepts the Deposit as Seller's sole right to damages.</p>
<p><strong>9.4 Attorneys' Fees.</strong> In any lawsuit and arbitration proceeding involving Seller or Buyer arising or in any way relating to this Contract, the prevailing party shall be awarded its reasonable attorneys' fees and costs.</p>

<h2>10. NO ORAL CHANGES OR REPRESENTATIONS.</h2>
<p>EACH PARTY ACKNOWLEDGES THAT THIS CONTRACT SETS FORTH IN FULL THE ENTIRE CONTRACT BETWEEN THE PARTIES. This Contract may be amended or modified only by an agreement in writing signed by Buyer and Seller.</p>

<h2>11. NOTICES.</h2>
<p>Any and all notices, demands or requests required or permitted hereunder shall be in writing and shall be effective upon personal delivery, electronic mail, or upon receipt if deposited in the U.S. Mail, registered or certified, return receipt requested. To Seller: See Section 1.9. To Buyer: See Section 1.9. To Escrow Agent: See Section 1.7.</p>

<h2>12. MISCELLANEOUS.</h2>
<p><strong>12.1</strong> All Addendum, Provisions, Acknowledgements marked in Section 1.13 are deemed part of this Contract and are incorporated herein by this reference.</p>
<p><strong>12.2 Assignment.</strong> Buyer may assign this Contract or any of its rights hereunder to any person, partnership, corporation or other entity and Seller's consent to such assignment is not necessary or required.</p>
<p><strong>12.3 Successors and Assigns.</strong> This Contract shall be binding upon and inure to the benefit of the Parties hereto and their respective successors and assigns.</p>
<p><strong>12.6 Time is of the Essence.</strong> Time is of the essence with respect to the performance of all terms, conditions and provisions of this Contract.</p>
<p><strong>12.7 Choice of Law.</strong> This Contract shall be governed and enforced under the laws of the State of Texas. The sole venue for any action hereunder shall be in Texas.</p>
<p><strong>12.9 Counterparts.</strong> This Contract may be executed in any number of counterparts. The parties may execute this Contract by electronic means and may deliver their signatures by facsimile transmission or .pdf e-mail delivery.</p>
<p><strong>13.18 Voluntary Agreement.</strong> The Parties affirm, acknowledge and agree that they are entering into this Contract voluntarily and have not been threatened, coerced, intimidated, or in any way pressured into signing this Contract.</p>

<p style="text-align:center;margin-top:24pt;">[SIGNATURE PAGE TO FOLLOW]</p>
<p style="page-break-after:always;"></p>

<!-- SIGNATURE PAGE -->
<p>IN WITNESS WHEREOF, Buyer and Seller have executed this Contract as of the dates written below.</p>
<table style="width:100%;border:1pt solid #000;">
<tr>
<td style="width:50%;padding:12pt;border-right:1pt solid #000;vertical-align:top;">
<strong>APPROVED AND ACCEPTED BY SELLER</strong><br>
on ___________________________:<br><br>
<strong>SELLER:</strong><br><br>
Name: <strong><u>${p.seller_1_name || '__________________________'}</u></strong><br><br>
Signature: _________________________________<br><br>
${p.seller_2_name ? `Name: <u>${p.seller_2_name}</u><br><br>Signature: _________________________________<br><br>` : ''}
<strong>SELLER'S SPOUSE (if applicable):</strong><br>
By signing below, Seller's spouse hereby consents to this Purchase Contract and all addendums thereto.<br><br>
Printed Name: ______________________________<br><br>
Date: ______________________________
</td>
<td style="width:50%;padding:12pt;vertical-align:top;">
<strong>APPROVED AND ACCEPTED BY BUYER</strong><br>
on ___________________________:<br><br>
<strong>BUYER:</strong><br><br>
${BUYER_FIXED.shortName}, a Wyoming limited liability company<br><br>
Signature: _________________________________<br><br>
By: <u>${BUYER_FIXED.signer}</u><br>
Its: ${BUYER_FIXED.title}<br><br>
Date: ______________________________
</td>
</tr>
</table>

${p.addendum_subject_to ? `
<p style="page-break-before:always;"></p>
<h1>SUBJECT TO ADDENDUM</h1>
<p>Capitalized terms not expressly defined in this Addendum have the meanings given to them in the Contract.</p>
<p>The Parties acknowledge and agree that Buyer is acquiring the Property subject to the Seller's existing loan(s) secured by one or more deeds of trust/mortgages against the Property (the "Existing Loan(s)"). This means that the Existing Loan(s) will not be paid off through Buyer's purchase of the Property. The Existing Loan(s) will remain outstanding and the deed(s) of trust/mortgages securing the Existing Loan(s) will remain as liens against the Property. Seller shall remain liable on the Existing Loan(s) and the Existing Loan(s) shall remain in Seller's name. The Parties also understand, acknowledge and agree that the deed(s) of trust/mortgages securing the Existing Loan(s) has/have a "Due on Sale" clause, which allows the lender(s) for the Existing Loan(s) to initiate a foreclosure proceeding for the Property due to the sale, transfer or conveyance of the Property from Seller to Buyer.</p>
<p>Prior to COE, Seller shall execute the following documents: Authorization to Release Information, Notice of Change of Address, Escrow Letter, Limited Power of Attorney appointing Buyer as Seller's agent for the purpose of providing for and arranging insurance, making and accounting for mortgage payments, and an Assignment of Insurance Proceeds in favor of Buyer.</p>
<h2>SELLER DISCLOSURES AND ACKNOWLEDGMENTS</h2>
<p>_________ Seller Initials &nbsp;&nbsp; <strong>NO FURTHER OWNERSHIP OR CONTROL.</strong> Seller understands, acknowledges, and agrees that upon close of escrow, Seller will no longer own the Property and will have no further control over the Property.</p>
<p>_________ Seller Initials &nbsp;&nbsp; <strong>EXISTING LOAN(S) NOT PAID IN FULL.</strong> Seller understands, acknowledges, and agrees that the Existing Loan(s) for which Seller is the borrower will not be paid in full as a result of this transaction. The existing loan may continue to remain on the Seller's credit report.</p>
<p>_________ Seller Initials &nbsp;&nbsp; <strong>DUE ON SALE CLAUSE.</strong> Seller understands, acknowledges and agrees that the deed(s) of trust/mortgage(s) securing the Existing Loan(s) contain due on sale clauses, which allows the lender(s) to call the Existing Loan(s) due upon transfer of the Property by Seller to Buyer.</p>
<p>_________ Seller Initials &nbsp;&nbsp; <strong>CONTINUING LIABILITY ON EXISTING LOAN(S).</strong> Seller understands, acknowledges, and agrees that no promises have been made by Buyer to Seller that the Existing Loan(s) will be paid off by Buyer through close of escrow and that upon the close of escrow and thereafter, Seller will remain liable on the Existing Loan(s).</p>
<p>_________ Seller Initials &nbsp;&nbsp; <strong>WRAP-AROUND FINANCING TRANSACTION.</strong> This is a wraparound financing transaction, which means Buyer will pay the Existing Loan(s) according to the terms of the Existing Loan(s) and Seller may pursue foreclosure of the Property if Buyer fails to pay the Existing Loan(s).</p>
<table style="width:100%;border:1pt solid #000;margin-top:24pt;">
<tr>
<td style="width:50%;padding:12pt;border-right:1pt solid #000;vertical-align:top;">
<strong>APPROVED AND ACCEPTED BY SELLER:</strong><br>
SELLER: <strong><u>${p.seller_1_name || '__________________________'}</u></strong><br><br>
Signature: _________________________________<br>
Date: _____________________________________<br><br>
${p.seller_2_name ? `Signature: _________________________________<br>Date: _____________________________________<br><br>` : ''}
</td>
<td style="width:50%;padding:12pt;vertical-align:top;">
<strong>APPROVED AND ACCEPTED BY BUYER:</strong><br>
BUYER: ${BUYER_FIXED.shortName}, a Wyoming limited liability company<br><br>
Authorized Signer: ${BUYER_FIXED.signer}<br>
Signature: _________________________________<br>
Date: _____________________________________
</td>
</tr>
</table>
` : ''}

</body></html>`;
}

function generatePsaPdfContent(doc, p) {
  const W = 612, M = 50, CW = W - 2 * M;
  let y = 50;
  const hexRgb = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [nr,ng,nb] = hexRgb(NAVY);

  const text = (t, x, yy, opts = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size || 9);
    doc.setTextColor(opts.color ? opts.color[0] : 0, opts.color ? opts.color[1] : 0, opts.color ? opts.color[2] : 0);
    const lines = doc.splitTextToSize(t, opts.width || CW);
    doc.text(lines, x, yy, opts.align ? { align: opts.align } : {});
    return lines.length * (opts.size || 9) * 0.8 + 4;
  };

  const nl = (h = 8) => { y += h; };
  const line = () => { doc.setDrawColor(200,200,200); doc.setLineWidth(0.5); doc.line(M, y, W-M, y); nl(6); };

  // Title
  y += text('PURCHASE CONTRACT AND ESCROW INSTRUCTIONS', W/2, y, { bold:true, size:13, color:[nr,ng,nb], align:'center' });
  nl(4); line();

  // Section 1 Header
  y += text('1. BASIC TERMS', M, y, { bold:true, size:10, color:[nr,ng,nb] }); nl(4);

  const row = (label, value) => {
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(nr,ng,nb);
    doc.text(label, M, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    const lines = doc.splitTextToSize(value || '___________________________', CW - 160);
    doc.text(lines, M + 155, y);
    y += Math.max(lines.length * 8, 10) + 4;
    if (y > 720) { doc.addPage(); y = 50; }
  };

  const fullAddr = [p.property_address, p.city, p.state, p.zip].filter(Boolean).join(', ');
  const coe = fmtCoeDate(p.coe_date);
  const total = calcTotal(p);

  row('1.1  Property Address:', fullAddr);
  row('1.2  Property APN:', p.property_apn);
  row('1.3  Legal Description:', p.legal_description);

  nl(4);
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(nr,ng,nb);
  doc.text('1.5  Purchase Price:', M, y); nl(8);

  const prRows = [
    [`$  ${fmtDollars(p.earnest_money) || '_________'}`, 'Earnest Money Deposit'],
    [`$  ${fmtDollars(p.existing_1st_mortgage) || '_________'}`, 'Approx. Existing 1st Mortgage (Sub-To)'],
    [`$  ${fmtDollars(p.cash_to_seller) || '_________'}`, `Cash to Seller at COE (${p.cash_to_seller_exact ? 'Exact' : 'Approximate'})`],
    [`$  ${fmtDollars(p.agent_fee_cash) || '_________'}`, 'Cash at COE including Agent Fee'],
    [`$  ${fmtDollars(total)}`, 'TOTAL PURCHASE PRICE'],
  ];
  prRows.forEach(([amt, label], i) => {
    doc.setFont('helvetica', i === prRows.length-1 ? 'bold' : 'normal');
    doc.setFontSize(9); doc.setTextColor(0,0,0);
    doc.text(amt, M + 20, y);
    doc.text(label, M + 120, y);
    y += 10;
  });

  nl(4); row('1.6  Close of Escrow:', `${coe.month} ${coe.day}, ${coe.year}`);
  row('1.7  Escrow Agent:', `${p.escrow_company || ''}${p.escrow_officer ? ' · ' + p.escrow_officer : ''}${p.escrow_phone ? ' · ' + p.escrow_phone : ''}`);
  row('1.9  Seller:', `${p.seller_1_name || ''}${p.seller_2_name ? ' & ' + p.seller_2_name : ''} · ${p.seller_address || ''}`);
  row('     Seller Phone/Email:', `${p.seller_1_phone || ''} ${p.seller_1_email || ''}`);
  row('1.9  Buyer:', `${BUYER_FIXED.shortName} · ${BUYER_FIXED.signer}, ${BUYER_FIXED.title}`);
  row('1.10 Inspection Period:', `${p.inspection_days || '15'} Business Days`);
  row('1.13 Addendums:', [p.addendum_subject_to?'Subject To':'', p.addendum_post_closing?'Post-Closing Possession':'', p.addendum_seller_ack?'Seller Acknowledgments':''].filter(Boolean).join(', ') || 'None');
  if (p.additional_terms) row('1.14 Additional Terms:', p.additional_terms);
  if (p.occupancy_notes) row('1.15 Occupancy:', p.occupancy_notes);

  nl(16);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,100,100);
  doc.text('Seller Initials: ______/______', M, y);
  doc.text('Buyer Initials: ______/______', W-M, y, { align:'right' });
  nl(16);

  // Signature block
  if (y > 650) { doc.addPage(); y = 50; }
  doc.setFillColor(248,248,248);
  doc.rect(M, y, CW/2 - 5, 80, 'F');
  doc.rect(M + CW/2 + 5, y, CW/2 - 5, 80, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(nr,ng,nb);
  doc.text('SELLER', M + 5, y + 14);
  doc.text('BUYER', M + CW/2 + 10, y + 14);
  doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
  doc.text(p.seller_1_name || '________________________', M + 5, y + 28);
  doc.text(`${BUYER_FIXED.shortName}`, M + CW/2 + 10, y + 28);
  doc.text('Signature: ___________________', M + 5, y + 44);
  doc.text(`By: ${BUYER_FIXED.signer}`, M + CW/2 + 10, y + 44);
  doc.text('Date: _______________________', M + 5, y + 58);
  doc.text(`Its: ${BUYER_FIXED.title}`, M + CW/2 + 10, y + 58);
}

// ============================================================
// PSA FORM COMPONENT
// ============================================================
function PsaForm({ psa, setPsa }) {
  const u = (f, v) => setPsa({ ...psa, [f]: v });
  const cls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none';
  const money = (field, placeholder) => (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
      <input type="number" value={psa[field]||''} onChange={e=>u(field,e.target.value)} className={cls+' pl-7 font-semibold'} placeholder={placeholder}/>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Property */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><MapPin size={14} style={{color:BURNT_ORANGE}}/>Property</h3>
        <div className="space-y-3">
          <FField label="Street Address *"><input type="text" value={psa.property_address} onChange={e=>u('property_address',e.target.value)} className={cls} placeholder="2004 Placerville St"/></FField>
          <div className="grid grid-cols-3 gap-2">
            <FField label="City"><input type="text" value={psa.city} onChange={e=>u('city',e.target.value)} className={cls} placeholder="Forney"/></FField>
            <FField label="State"><input type="text" value={psa.state} onChange={e=>u('state',e.target.value)} className={cls} placeholder="TX" maxLength={2}/></FField>
            <FField label="Zip"><input type="text" value={psa.zip} onChange={e=>u('zip',e.target.value)} className={cls} placeholder="75126"/></FField>
          </div>
          <FField label="Property APN"><input type="text" value={psa.property_apn} onChange={e=>u('property_apn',e.target.value)} className={cls} placeholder="00.3819.0002.0003.00"/></FField>
          <FField label="Legal Description"><textarea value={psa.legal_description} onChange={e=>u('legal_description',e.target.value)} rows={2} className={cls+' resize-none'} placeholder="TRAVIS RANCH MARINA LOTS NO 2, BLOCK B, LOT 3"/></FField>
        </div>
      </div>

      {/* Seller */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><User size={14} style={{color:BURNT_ORANGE}}/>Seller</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FField label="Seller 1 Name *"><input type="text" value={psa.seller_1_name} onChange={e=>u('seller_1_name',e.target.value)} className={cls} placeholder="Kevin Cossey"/></FField>
            <FField label="Seller 2 Name (if applicable)"><input type="text" value={psa.seller_2_name} onChange={e=>u('seller_2_name',e.target.value)} className={cls} placeholder="Victoria Cossey"/></FField>
          </div>
          <FField label="Seller Address"><input type="text" value={psa.seller_address} onChange={e=>u('seller_address',e.target.value)} className={cls} placeholder="2004 Placerville St, Forney TX 75126"/></FField>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Seller 1 Phone"><input type="tel" value={psa.seller_1_phone} onChange={e=>u('seller_1_phone',e.target.value)} className={cls} placeholder="512-993-4467"/></FField>
            <FField label="Seller 2 Phone"><input type="tel" value={psa.seller_2_phone} onChange={e=>u('seller_2_phone',e.target.value)} className={cls} placeholder="903-799-8947"/></FField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Seller 1 Email"><input type="email" value={psa.seller_1_email} onChange={e=>u('seller_1_email',e.target.value)} className={cls} placeholder="seller@email.com"/></FField>
            <FField label="Seller 2 Email"><input type="email" value={psa.seller_2_email} onChange={e=>u('seller_2_email',e.target.value)} className={cls} placeholder="seller2@email.com"/></FField>
          </div>
        </div>
      </div>

      {/* Purchase Price */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><DollarSign size={14} style={{color:BURNT_ORANGE}}/>Purchase Price</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FField label="Earnest Money Deposit">{money('earnest_money','150')}</FField>
            <FField label="Existing 1st Mortgage (Sub-To)">{money('existing_1st_mortgage','383565')}</FField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Existing 2nd Mortgage (if any)">{money('existing_2nd_mortgage','')}</FField>
            <FField label="Seller Carryback (if any)">{money('seller_carryback','')}</FField>
          </div>
          <div>
            <FField label="Cash to Seller at COE">{money('cash_to_seller','13000')}</FField>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input type="radio" checked={psa.cash_to_seller_exact} onChange={()=>u('cash_to_seller_exact',true)}/> Exact
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input type="radio" checked={!psa.cash_to_seller_exact} onChange={()=>u('cash_to_seller_exact',false)}/> Approximate
              </label>
            </div>
          </div>
          <div>
            <FField label="Cash at COE incl. Agent Fee">{money('agent_fee_cash','17000')}</FField>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input type="radio" checked={psa.agent_fee_approximate} onChange={()=>u('agent_fee_approximate',true)}/> Approximate
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                <input type="radio" checked={!psa.agent_fee_approximate} onChange={()=>u('agent_fee_approximate',false)}/> Exact
              </label>
            </div>
          </div>
          <FField label="Total Purchase Price (auto-calculated if blank)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
              <input type="number" value={psa.total_price||''} onChange={e=>u('total_price',e.target.value)} className={cls+' pl-7 font-bold'} placeholder={calcTotal(psa).toLocaleString()}/>
            </div>
          </FField>
        </div>
      </div>

      {/* Closing */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><Calendar size={14} style={{color:BURNT_ORANGE}}/>Closing</h3>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Close of Escrow Date"><input type="date" value={psa.coe_date} onChange={e=>u('coe_date',e.target.value)} className={cls}/></FField>
          <FField label="Inspection Period (business days)"><input type="number" value={psa.inspection_days} onChange={e=>u('inspection_days',e.target.value)} className={cls} placeholder="15"/></FField>
        </div>
      </div>

      {/* Escrow */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5"><Building size={14} style={{color:BURNT_ORANGE}}/>Escrow Agent</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FField label="Escrow Company"><input type="text" value={psa.escrow_company} onChange={e=>u('escrow_company',e.target.value)} className={cls} placeholder="Closed Title"/></FField>
            <FField label="Escrow Officer"><input type="text" value={psa.escrow_officer} onChange={e=>u('escrow_officer',e.target.value)} className={cls} placeholder="Adrienne Prince"/></FField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Escrow Phone"><input type="tel" value={psa.escrow_phone} onChange={e=>u('escrow_phone',e.target.value)} className={cls} placeholder="910-222-3931"/></FField>
            <FField label="Escrow Email"><input type="email" value={psa.escrow_email} onChange={e=>u('escrow_email',e.target.value)} className={cls} placeholder="officer@escrow.com"/></FField>
          </div>
        </div>
      </div>

      {/* Addendums */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Addendums</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={psa.addendum_subject_to} onChange={e=>u('addendum_subject_to',e.target.checked)} className="w-4 h-4"/><span className="text-sm text-gray-700">Subject To Addendum</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={psa.addendum_post_closing} onChange={e=>u('addendum_post_closing',e.target.checked)} className="w-4 h-4"/><span className="text-sm text-gray-700">Post-Closing Possession Addendum</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={psa.addendum_seller_ack} onChange={e=>u('addendum_seller_ack',e.target.checked)} className="w-4 h-4"/><span className="text-sm text-gray-700">Seller Acknowledgements</span></label>
        </div>
      </div>

      {/* Occupancy */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Occupancy</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={psa.occupancy_seller} onChange={()=>u('occupancy_seller',true)} className="w-4 h-4"/><span className="text-sm text-gray-700">Seller occupied — Buyer gets possession at COE</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!psa.occupancy_seller} onChange={()=>u('occupancy_seller',false)} className="w-4 h-4"/><span className="text-sm text-gray-700">Property is leased</span></label>
          <FField label="Occupancy Notes (optional)"><input type="text" value={psa.occupancy_notes} onChange={e=>u('occupancy_notes',e.target.value)} className={cls} placeholder="Buyer agrees to lease property back to Seller until end of June, 2026"/></FField>
        </div>
      </div>

      {/* Additional Terms */}
      <FField label="Additional Terms (Section 1.14)">
        <textarea value={psa.additional_terms} onChange={e=>u('additional_terms',e.target.value)} rows={3} className={cls+' resize-none'} placeholder="Any special conditions or terms..."/>
      </FField>

      {/* Buyer — locked */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Buyer (Pre-filled — always QP Holdings)</p>
        <p className="text-sm text-gray-700 font-semibold">QP Holdings, LLC · Wyoming LLC</p>
        <p className="text-sm text-gray-600">30 N Gould St. Ste: R, Sheridan, WY 82801</p>
        <p className="text-sm text-gray-600">214-702-6883 · Authorized Signer: Michael Harry</p>
      </div>
    </div>
  );
}

// ============================================================
// PSA PREVIEW COMPONENT
// ============================================================
function PsaPreview({ psa }) {
  const coe = fmtCoeDate(psa.coe_date);
  const total = calcTotal(psa);
  const fullAddr = [psa.property_address, psa.city, psa.state, psa.zip].filter(Boolean).join(', ');
  const checkBox = (checked) => checked ? '☒' : '☐';

  const row = (label, val) => (
    <tr>
      <td style={{ width: 140, fontWeight: 'bold', paddingRight: 8, verticalAlign: 'top', color: NAVY, fontSize: '9pt', paddingTop: 6 }}>{label}</td>
      <td style={{ fontSize: '9pt', paddingTop: 6, borderBottom: '0.5pt solid #e5e7eb' }}>{val || <span style={{ color: '#9ca3af' }}>—</span>}</td>
    </tr>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt' }}>
      <h2 style={{ textAlign: 'center', color: NAVY, fontSize: '13pt', marginBottom: 4 }}>PURCHASE CONTRACT AND ESCROW INSTRUCTIONS</h2>
      <p style={{ textAlign: 'center', fontSize: '8pt', color: '#6b7280', marginBottom: 12 }}>QP Holdings, LLC · Wholesale Purchase</p>
      <hr style={{ border: 'none', borderTop: `2pt solid ${GOLD}`, marginBottom: 12 }} />

      <p style={{ fontWeight: 'bold', color: NAVY, marginBottom: 8 }}>1. BASIC TERMS</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {row('1.1 Property:', fullAddr || '—')}
          {row('1.2 APN:', psa.property_apn)}
          {row('1.3 Legal Desc:', psa.legal_description)}
          <tr><td colSpan={2} style={{ paddingTop: 10, paddingBottom: 4, fontWeight: 'bold', color: NAVY, fontSize: '9pt' }}>1.5 Purchase Price:</td></tr>
          <tr><td style={{ paddingLeft: 16, fontSize: '9pt', color: '#374151' }}>Earnest Money:</td><td style={{ fontSize: '9pt' }}>${psa.earnest_money ? parseFloat(psa.earnest_money).toLocaleString() : '—'}</td></tr>
          <tr><td style={{ paddingLeft: 16, fontSize: '9pt', color: '#374151' }}>Existing 1st Mtg (Sub-To):</td><td style={{ fontSize: '9pt' }}>{psa.existing_1st_mortgage ? '$' + parseFloat(psa.existing_1st_mortgage).toLocaleString() : '—'}</td></tr>
          {psa.existing_2nd_mortgage && <tr><td style={{ paddingLeft: 16, fontSize: '9pt', color: '#374151' }}>Existing 2nd Mtg:</td><td style={{ fontSize: '9pt' }}>${parseFloat(psa.existing_2nd_mortgage).toLocaleString()}</td></tr>}
          {psa.cash_to_seller && <tr><td style={{ paddingLeft: 16, fontSize: '9pt', color: '#374151' }}>Cash to Seller at COE:</td><td style={{ fontSize: '9pt' }}>${parseFloat(psa.cash_to_seller).toLocaleString()} ({psa.cash_to_seller_exact ? 'Exact' : 'Approx.'})</td></tr>}
          {psa.agent_fee_cash && <tr><td style={{ paddingLeft: 16, fontSize: '9pt', color: '#374151' }}>Cash incl. Agent Fee:</td><td style={{ fontSize: '9pt' }}>${parseFloat(psa.agent_fee_cash).toLocaleString()} ({psa.agent_fee_approximate ? 'Approx.' : 'Exact'})</td></tr>}
          <tr><td style={{ paddingLeft: 16, fontSize: '9pt', fontWeight: 'bold', color: NAVY }}>TOTAL PURCHASE PRICE:</td><td style={{ fontSize: '9pt', fontWeight: 'bold', color: NAVY }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          {row('1.6 COE Date:', psa.coe_date ? `${coe.month} ${coe.day}, ${coe.year}` : '')}
          {row('1.7 Escrow Agent:', [psa.escrow_company, psa.escrow_officer].filter(Boolean).join(' · '))}
          {psa.escrow_phone && row('    Escrow Phone/Email:', [psa.escrow_phone, psa.escrow_email].filter(Boolean).join(' · '))}
          {row('1.9 Seller:', [psa.seller_1_name, psa.seller_2_name].filter(Boolean).join(' & '))}
          {row('    Seller Address:', psa.seller_address)}
          {row('    Seller Phone:', [psa.seller_1_phone, psa.seller_2_phone].filter(Boolean).join(' · '))}
          {row('    Seller Email:', [psa.seller_1_email, psa.seller_2_email].filter(Boolean).join(' · '))}
          {row('1.9 Buyer:', 'QP Holdings, LLC · Wyoming LLC · Michael Harry')}
          {row('1.10 Inspection:', `${psa.inspection_days || 15} Business Days`)}
          {row('1.13 Addendums:', [psa.addendum_subject_to && 'Subject To', psa.addendum_post_closing && 'Post-Closing Possession', psa.addendum_seller_ack && 'Seller Ack'].filter(Boolean).join(', '))}
          {psa.additional_terms && row('1.14 Add. Terms:', psa.additional_terms)}
          {psa.occupancy_notes && row('1.15 Occupancy:', psa.occupancy_notes)}
        </tbody>
      </table>

      <div style={{ marginTop: 16, background: '#f8f5ee', padding: '10pt', borderRadius: 6, border: `1pt solid ${GOLD}` }}>
        <p style={{ fontSize: '8pt', color: '#6b7280', margin: 0 }}><strong>Buyer (Pre-filled):</strong> QP Holdings, LLC, a Wyoming limited liability company · 30 N Gould St. Ste: R, Sheridan, WY 82801 · 214-702-6883 · Authorized Signer: Michael Harry</p>
      </div>
    </div>
  );
}
