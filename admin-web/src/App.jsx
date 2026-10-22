import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Calendar, Star, Users, CheckCircle,
  XCircle, Eye, RefreshCw, LogOut, Award, BarChart3, FileText,
  DollarSign, ChevronRight, Search, Filter, ShieldAlert
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('experts');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [email, setEmail] = useState('admin@bengaluruhelp.in');
  const [password, setPassword] = useState('Password@123');
  const [authError, setAuthError] = useState('');

  // Data states
  const [experts, setExperts] = useState([]);
  const [expertFilter, setExpertFilter] = useState('pending'); // all, pending, verified, suspended
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [sensitivityData, setSensitivityData] = useState(null);

  // Modal states
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: '', expert: null, remarks: '' });

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchExperts(expertFilter),
        fetchReports(),
        fetchBookings()
      ]);
    } catch (err) {
      console.error('Error loading initial admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setCurrentUser(null);
  };

  const fetchExperts = async (status) => {
    try {
      const url = status && status !== 'all' 
        ? `${API_BASE}/admin/experts?status=${status}` 
        : `${API_BASE}/admin/experts`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExperts(data.experts || []);
      }
    } catch (err) {
      console.error('Failed to fetch experts:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const runSensitivityTest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/sensitivity-test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSensitivityData(data.analysis);
      }
    } catch (err) {
      console.error('Failed to run sensitivity test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (expertId, status, remarks) => {
    try {
      const res = await fetch(`${API_BASE}/admin/experts/${expertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verification_status: status, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setActionModal({ open: false, type: '', expert: null, remarks: '' });
        fetchExperts(expertFilter);
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleReportUpdate = async (reportId, newStatus, notes) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, admin_notes: notes })
      });
      const data = await res.json();
      if (data.success) {
        fetchReports();
      }
    } catch (err) {
      alert('Error updating report: ' + err.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Console</h1>
              <p className="text-xs text-slate-500">Verified Local Assistance Marketplace</p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-6 text-xs text-indigo-900 leading-relaxed">
            <p className="font-semibold mb-1">Bengaluru College MVP Admin Portal</p>
            Review expert identity proofs, manage safety investigations, view 20% platform commission, and inspect matching algorithm stability.
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">Pre-seeded Credentials: admin@bengaluruhelp.in / Password@123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">LocalAssist Bengaluru</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full">College MVP</span>
              </div>
              <p className="text-xs text-slate-500">Trust-Aware Verification & Safety Console</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadInitialData}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium">Safety Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-slate-100">
          <button
            onClick={() => { setActiveTab('experts'); fetchExperts(expertFilter); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'experts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Expert Verifications</span>
            {experts.filter(e => e.verification_status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                {experts.filter(e => e.verification_status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('reports'); fetchReports(); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Reports</span>
            {reports.filter(r => r.status === 'open').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
                {reports.filter(r => r.status === 'open').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); fetchBookings(); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings & Financials</span>
          </button>

          <button
            onClick={() => { setActiveTab('algorithm'); runSensitivityTest(); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'algorithm'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Viva Algorithm & Sensitivity</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: EXPERT VERIFICATIONS */}
        {activeTab === 'experts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Expert Applications & Verification</h2>
                <p className="text-xs text-slate-500">Module M2: Approve or reject applicant documents; enforce suspensions for misbehavior.</p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                {['pending', 'verified', 'suspended', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setExpertFilter(st); fetchExperts(st); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                      expertFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Experts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experts.map((exp) => (
                <div key={exp.expert_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    {/* Header with Photo & Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={exp.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={exp.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{exp.name}</h3>
                          <p className="text-xs text-slate-500">{exp.occupation || 'Local Helper'}</p>
                          <span className="text-[11px] text-slate-400">{exp.years_in_city} yrs in Bengaluru</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        exp.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        exp.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        exp.verification_status === 'suspended' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {exp.verification_status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{exp.intro || 'No intro provided.'}"
                    </p>

                    {/* Stats & Trust Details */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">Reviews</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{exp.rating_count > 0 ? (exp.rating_sum / exp.rating_count).toFixed(1) : 'New'}</span>
                          <span className="text-slate-400 font-normal">({exp.rating_count})</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">Account</span>
                        <span className={`font-semibold ${exp.user_status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {exp.user_status}
                        </span>
                      </div>
                    </div>

                    {/* ID Document Proof Link */}
                    {exp.id_doc_url && (
                      <div className="mb-4">
                        <button
                          onClick={() => setSelectedDoc(exp.id_doc_url)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Inspect ID Document Proof</span>
                        </button>
                      </div>
                    )}

                    {exp.admin_remarks && (
                      <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-100 p-2 rounded-lg mb-4">
                        <span className="font-semibold text-amber-800">Admin Remarks:</span> {exp.admin_remarks}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    {exp.verification_status !== 'verified' && (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'verified', expert: exp, remarks: 'Identity verified against government document.' })}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Approve & Verify
                      </button>
                    )}

                    {exp.verification_status === 'pending' && (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'rejected', expert: exp, remarks: 'Identity proof is blurry or invalid.' })}
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Reject
                      </button>
                    )}

                    {exp.verification_status !== 'suspended' && (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'suspended', expert: exp, remarks: 'Suspended due to policy violation.' })}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                        title="Suspend Expert"
                      >
                        Suspend
                      </button>
                    )}

                    {exp.verification_status === 'suspended' && (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'verified', expert: exp, remarks: 'Reinstated after investigation.' })}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {experts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">No experts found in this category</h4>
                <p className="text-xs text-slate-400 mt-1">Try switching to "All" or "Verified".</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAFETY & ABUSE REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Safety Reports & Dispute Investigation</h2>
              <p className="text-xs text-slate-500">Module M8: Investigate reported experts, enforce suspensions, and dismiss invalid claims.</p>
            </div>

            <div className="space-y-4">
              {reports.map((rep) => (
                <div key={rep.report_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Report #{rep.report_id}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            rep.status === 'open' ? 'bg-rose-100 text-rose-700' :
                            rep.status === 'investigating' ? 'bg-amber-100 text-amber-700' :
                            rep.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {rep.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Filed by {rep.reporter_name} ({rep.reporter_email})</p>
                      </div>
                    </div>

                    <span className="text-xs text-slate-400">{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs text-slate-800 leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-0.5">Complaint Reason:</span>
                    {rep.reason}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600">
                      Reported Party: <span className="font-bold text-slate-900">{rep.reported_name}</span> ({rep.reported_email})
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.status !== 'investigating' && rep.status !== 'resolved' && (
                        <button
                          onClick={() => handleReportUpdate(rep.report_id, 'investigating', 'Investigation started by admin.')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Mark Investigating
                        </button>
                      )}

                      {rep.status !== 'resolved' && (
                        <button
                          onClick={() => handleReportUpdate(rep.report_id, 'resolved', 'Issue resolved. Warning issued to expert.')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Resolve
                        </button>
                      )}

                      {rep.status !== 'dismissed' && (
                        <button
                          onClick={() => handleReportUpdate(rep.report_id, 'dismissed', 'Claim unverified or invalid.')}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-700">No reports recorded</h4>
                  <p className="text-xs text-slate-400 mt-1">Platform operations are running safely.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS & FINANCIALS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bookings & Financial Commission Ledger</h2>
              <p className="text-xs text-slate-500">Module M6: Mock payment audit trail, 20% platform commission split, and transaction volume.</p>
            </div>

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Bookings</span>
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{metrics.totalBookings}</div>
                  <span className="text-[11px] text-slate-400">{metrics.paidBookings} paid transactions</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Volume</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">₹{metrics.totalTransactionVolume}</div>
                  <span className="text-[11px] text-slate-400">Gross marketplace GMV</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Commission (20%)</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600">₹{metrics.platformCommissionCollected}</div>
                  <span className="text-[11px] text-slate-400">Platform earnings retained</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Disbursed (80%)</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">₹{metrics.expertEarningsDisbursed}</div>
                  <span className="text-[11px] text-slate-400">Net payouts to local experts</span>
                </div>
              </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Booking</th>
                      <th className="py-3 px-4">Newcomer</th>
                      <th className="py-3 px-4">Expert</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Split (20/80)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bookings.map((b) => (
                      <tr key={b.booking_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">#{b.booking_id}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-slate-800">{b.newcomer_name}</span>
                          <span className="text-[10px] text-slate-400">{b.newcomer_email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-slate-800">{b.expert_name}</span>
                          <span className="text-[10px] text-slate-400">{b.expert_email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900">{b.service_name}</span>
                          <span className="text-[10px] text-indigo-600 block capitalize">{b.category.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="block font-medium">{b.booking_date}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{b.time_slot}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{b.amount}</td>
                        <td className="py-3 px-4">
                          <span className="text-amber-700 font-medium block">₹{b.commission} (20%)</span>
                          <span className="text-slate-500 text-[10px]">₹{b.expert_earning} (80%)</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                              b.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {b.status}
                            </span>
                            <span className={`text-[10px] font-semibold ${
                              b.payment_status === 'paid' ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              ● {b.payment_status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VIVA ALGORITHM & SENSITIVITY ANALYSIS */}
        {activeTab === 'algorithm' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Academic Viva: Explainable Algorithm & Sensitivity Test</h2>
                <p className="text-xs text-slate-500">Defend the design weights and Bayesian reputation smoothing with empirical robustness checks.</p>
              </div>

              <button
                onClick={runSensitivityTest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-run Sensitivity Test</span>
              </button>
            </div>

            {/* Formula Explanation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">Formula</span>
                  Matching & Ranking Score
                </h3>
                <div className="bg-slate-900 text-indigo-300 font-mono text-xs p-3 rounded-xl mb-3">
                  Score = 0.40·S + 0.20·L + 0.20·T + 0.10·G + 0.10·A
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li><strong className="text-slate-800">S (0.40):</strong> Service Coverage (needs expert offers ÷ needs user selected). Coverage prevents penalizing versatile experts (unlike Jaccard).</li>
                  <li><strong className="text-slate-800">L (0.20):</strong> Area Coverage (1 if expert knows requested neighborhood, else 0).</li>
                  <li><strong className="text-slate-800">T (0.20):</strong> Smoothed Trust Score (Bayesian average rescaled to 0..1).</li>
                  <li><strong className="text-slate-800">G (0.10):</strong> Language Coverage (matching spoken languages ÷ requested).</li>
                  <li><strong className="text-slate-800">A (0.10):</strong> Availability (1 if free in weekly slot, else 0).</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">Trust</span>
                  Bayesian Reputation Smoothing (Ma et al.)
                </h3>
                <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-xl mb-3">
                  Smoothed = (C·m + ratingSum) / (C + n)
                  <br />
                  Trust T = (Smoothed - 1) / 4
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Prevents a single 5.0 review on a brand-new expert from outranking an established expert with fifty 4.8 reviews.
                  Prior strength <strong className="text-slate-800">C = 5</strong>, platform prior baseline <strong className="text-slate-800">m = 4.0</strong>.
                  New experts start with a neutral baseline of T = 0.75 without being invisible or artificially dominant.
                </p>
              </div>
            </div>

            {/* Live Sensitivity Results */}
            {sensitivityData && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Empirical Robustness Check (±10% Weight Perturbation)</h3>
                    <p className="text-xs text-slate-500">Tests if Top-3 expert recommendations remain stable when design weights change by 10%.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs">
                    {sensitivityData.stabilityPercentage}% Stable Top-3
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Weight Adjusted</th>
                        <th className="py-2.5 px-3">Variation</th>
                        <th className="py-2.5 px-3">Adjusted Weights (S / L / T / G / A)</th>
                        <th className="py-2.5 px-3">Top-3 Ranking Output</th>
                        <th className="py-2.5 px-3">Stability Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                      {sensitivityData.variations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 capitalize">{v.weightAdjusted}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-600">{v.change}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {Number(v.weights.service).toFixed(2)} / {Number(v.weights.area).toFixed(2)} / {Number(v.weights.trust).toFixed(2)} / {Number(v.weights.lang).toFixed(2)} / {Number(v.weights.avail).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 font-semibold">
                            [{v.top3Result.join(' → ')}]
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.stableWithBaseline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {v.stableWithBaseline ? 'Consistent' : 'Permuted'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Action / Remarks Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1 capitalize">
              {actionModal.type === 'verified' ? 'Verify & Approve Expert' : `${actionModal.type} Expert Profile`}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Updating verification status for <strong className="text-slate-800">{actionModal.expert?.name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Administrative Remarks / Reason</label>
              <textarea
                value={actionModal.remarks}
                onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter remarks visible in audit logs..."
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionModal({ open: false, type: '', expert: null, remarks: '' })}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(actionModal.expert.expert_id, actionModal.type, actionModal.remarks)}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition ${
                  actionModal.type === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal.type === 'rejected' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Uploaded Verification Document</span>
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-8 text-center mb-4">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800 mb-1">{selectedDoc}</p>
              <span className="text-[11px] text-slate-500">Government Identity Proof Document</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
