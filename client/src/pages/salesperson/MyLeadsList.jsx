import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { leadAPI } from '../../services/api';
import { Phone, MessageCircle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

// Helpers to format phone numbers with country codes (default India +91)
const getDialCode = (country) => {
  const map = {
    India: '+91',
    Russia: '+7',
    'United States': '+1',
    USA: '+1',
    Canada: '+1',
    'United Kingdom': '+44',
    UK: '+44',
    Australia: '+61',
    Germany: '+49',
    France: '+33',
    Italy: '+39',
    Spain: '+34',
    Turkey: '+90',
    Ukraine: '+380',
    China: '+86',
    Japan: '+81',
    'South Korea': '+82',
    'United Arab Emirates': '+971',
    UAE: '+971',
    Qatar: '+974',
    'Saudi Arabia': '+966',
    Bangladesh: '+880',
    Nepal: '+977',
    'Sri Lanka': '+94'
  };
  if (!country) return '+91';
  return map[country] || map[(country || '').trim()] || '+91';
};

const ensureE164 = (phone, country) => {
  if (!phone) return '';
  const raw = String(phone).trim();
  if (raw.startsWith('+')) {
    return `+${raw.replace(/[^0-9]/g, '')}`;
  }
  if (raw.startsWith('00')) {
    return `+${raw.replace(/[^0-9]/g, '').replace(/^00/, '')}`;
  }
  const digits = raw.replace(/[^0-9]/g, '');
  const code = getDialCode(country);
  return `${code}${digits}`;
};

const buildWhatsAppNumber = (phone, country) => ensureE164(phone, country).replace(/\D/g, '');

const MyLeadsList = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ country: 'India', product: '' });
  const [countries, setCountries] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    country: '',
    product: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [callData, setCallData] = useState({
    note: '',
    status: '',
    advance: '',
    country: 'India',
    product: ''
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    country: 'India',
    email: '',
    product: '',
    source: '',
    notes: ''
  });
  const pendingCallRestored = useRef(false);

  useEffect(() => {
    fetchLeads();
    fetchCountries();
    fetchProducts();
  }, [filters]);

  const fetchCountries = async () => {
    try {
      const response = await leadAPI.getCountries();
      setCountries(response.data.data);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await leadAPI.getProducts();
      setProducts(response.data.data);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await leadAPI.getMyLeads(filters);
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      setLeads(rows.map((l) => ({ ...l, value: l.value !== undefined && l.value !== null ? Number(l.value) : l.value })));
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary-600" />
      : <ArrowDown className="h-4 w-4 text-primary-600" />;
  };

  const handleCall = (lead) => {
    setSelectedLead(lead);
    setCallData({
      note: '',
      status: lead.status,
      advance: (lead.value !== undefined && lead.value !== null) ? String(Number(lead.value)) : '',
      country: lead.country || 'India',
      product: lead.product || ''
    });
    localStorage.setItem('pendingCallLog', JSON.stringify({
      leadId: lead.id,
      timestamp: Date.now()
    }));
    pendingCallRestored.current = true;
    setShowCallModal(true);
    // Initiate actual call with country code (default +91)
    window.location.href = `tel:${ensureE164(lead.phone, lead.country)}`;
  };

  const handleWhatsApp = (lead) => {
    const message = encodeURIComponent(`Hello ${lead.name}, this is regarding your inquiry.`);
    const number = buildWhatsAppNumber(lead.phone, lead.country);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  const handleCallComplete = async (e) => {
    e.preventDefault();

    try {
      // Update lead with new status, advance, country, product, and lastCalled
      const payload = {
        status: callData.status,
        value: (callData.advance === '' || callData.advance === null || callData.advance === undefined) ? '' : Number(callData.advance),
        notes: callData.note,
        country: callData.country,
        product: callData.product,
        lastCalled: new Date().toISOString()
      };
      const resp = await leadAPI.updateLead(selectedLead.id, payload);
      if (resp?.data?.data) {
        const updated = resp.data.data;
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated, value: Number(updated.value) } : l)));
      }

      // Add activity only if note provided
      if (callData.note && callData.note.trim()) {
        await leadAPI.addActivity(selectedLead.id, {
          type: 'call',
          description: `Call made: ${callData.note}`
        });
      }

      toast.success('Call logged successfully');
      setShowCallModal(false);
      setSelectedLead(null);
      localStorage.removeItem('pendingCallLog');
      pendingCallRestored.current = false;
      await fetchLeads();
    } catch (error) {
      toast.error('Failed to log call');
    }
  };

  const handleCancelCallLog = () => {
    setShowCallModal(false);
    setSelectedLead(null);
    localStorage.removeItem('pendingCallLog');
    pendingCallRestored.current = false;
  };

  const handleViewLead = async (lead) => {
    try {
      const response = await leadAPI.getLead(lead.id);
      const leadData = response.data.data;
      setSelectedLead(leadData);
      setEditData({ country: leadData.country || 'India', product: leadData.product || '' });
      setIsEditing(false);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load lead details');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        country: editData.country,
        product: editData.product
      };
      const response = await leadAPI.updateLead(selectedLead.id, payload);
      if (response?.data?.data) {
        const updated = response.data.data;
        setSelectedLead(updated);
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
        setIsEditing(false);
        toast.success('Lead updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleCancelEdit = () => {
    setEditData({ country: selectedLead.country || '', product: selectedLead.product || '' });
    setIsEditing(false);
  };

  const statusCounts = {
    all: leads.length,
    fresh: leads.filter(l => l.status === 'fresh').length,
    'follow-up': leads.filter(l => l.status === 'follow-up').length,
    rnr: leads.filter(l => l.status === 'rnr').length,
    closed: leads.filter(l => l.status === 'closed').length,
    dead: leads.filter(l => l.status === 'dead').length,
    cancelled: leads.filter(l => l.status === 'cancelled').length,
    rejected: leads.filter(l => l.status === 'rejected').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fresh': return 'bg-gray-100 text-gray-800';
      case 'follow-up': return 'bg-orange-100 text-orange-800';
      case 'rnr': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'dead':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const STATUS_ROW_STYLES = {
    fresh: {
      row: 'bg-white',
      hover: 'hover:bg-gray-50',
      card: 'bg-white border border-gray-200'
    },
    'follow-up': {
      row: 'bg-orange-100',
      hover: 'hover:bg-orange-200',
      card: 'bg-orange-100 border border-orange-300'
    },
    rnr: {
      row: 'bg-purple-100',
      hover: 'hover:bg-purple-200',
      card: 'bg-purple-100 border border-purple-300'
    },
    closed: {
      row: 'bg-green-100',
      hover: 'hover:bg-green-200',
      card: 'bg-green-100 border border-green-300'
    },
    dead: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      card: 'bg-red-100 border border-red-300'
    },
    cancelled: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      card: 'bg-red-100 border border-red-300'
    },
    rejected: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      card: 'bg-red-100 border border-red-300'
    },
    default: {
      row: 'bg-white',
      hover: 'hover:bg-gray-50',
      card: 'bg-white border border-gray-200'
    }
  };

  const getRowStyles = (status) => STATUS_ROW_STYLES[status] || STATUS_ROW_STYLES.default;

  useEffect(() => {
    const restorePendingCall = async () => {
      const stored = localStorage.getItem('pendingCallLog');
      if (!stored || pendingCallRestored.current) return;

      try {
        const pending = JSON.parse(stored);
        if (!pending?.leadId) {
          localStorage.removeItem('pendingCallLog');
          return;
        }

        let lead = leads.find((l) => l.id === pending.leadId);
        if (!lead) {
          const response = await leadAPI.getLead(pending.leadId);
          lead = response?.data?.data;
        }

        if (lead) {
          setSelectedLead(lead);
          setCallData({
            note: '',
            status: lead.status,
            advance: (lead.value !== undefined && lead.value !== null) ? String(Number(lead.value)) : '',
            country: lead.country || 'India',
            product: lead.product || ''
          });
          setShowCallModal(true);
          pendingCallRestored.current = true;
        } else {
          localStorage.removeItem('pendingCallLog');
        }
      } catch (err) {
        localStorage.removeItem('pendingCallLog');
      }
    };

    restorePendingCall();
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Leads</h1>
        {/* Mobile ADD LEAD pill */}
        <div className="sm:hidden mt-2 flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-full shadow"
          >
            ADD LEAD
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <select
              className="input-field w-full"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full col-span-2 md:col-span-1"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="fresh">Fresh</option>
              <option value="follow-up">Follow-up</option>
              <option value="rnr">RNR</option>
              <option value="closed">Registered</option>
              <option value="dead">Dead</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Status Tabs - two layers (grid) */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { key: '', label: 'All', color: 'bg-gray-100 text-gray-800' },
            { key: 'fresh', label: 'Fresh', color: 'bg-white border-2 border-gray-300' },
            { key: 'follow-up', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
            { key: 'rnr', label: 'RNR', color: 'bg-purple-100 text-purple-800' },
            { key: 'closed', label: 'Registered', color: 'bg-green-100 text-green-800' },
            { key: 'dead', label: 'Dead', color: 'bg-red-100 text-red-800' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
            { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilters({ ...filters, status: tab.key })}
              className={`inline-flex items-center justify-center w-full h-7 px-2 py-0 rounded-full font-medium transition-all text-[10px] whitespace-nowrap border ${
                filters.status === tab.key ? 'border-primary-500 bg-white' : 'border-transparent'
              } ${tab.color}`}
            >
              {tab.label} ({statusCounts[tab.key || 'all']})
            </button>
          ))}
        </div>
      </div>

      {/* Leads List - Desktop Table */}
      {leads.length > 0 ? (
        <>
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Date Added
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('country')}
                    >
                      <div className="flex items-center gap-2">
                        Country
                        {getSortIcon('country')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('product')}
                    >
                      <div className="flex items-center gap-2">
                        Product
                        {getSortIcon('product')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center gap-2">
                        Advance
                        {getSortIcon('value')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {sortedLeads.map((lead) => {
                    const styles = getRowStyles(lead.status);
                    return (
                      <tr
                        key={lead.id}
                        className={`${styles.row} ${styles.hover} cursor-pointer transition-colors`}
                        onClick={() => handleViewLead(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM yyyy') : '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          {lead.email && <div className="text-sm text-gray-500">{lead.email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ensureE164(lead.phone, lead.country)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.product || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status === 'follow-up'
                              ? 'FOLLOW-UP'
                              : lead.status === 'cancelled'
                              ? 'CANCELLED'
                              : lead.status === 'rejected'
                              ? 'REJECTED'
                              : lead.status === 'closed'
                              ? 'REGISTERED'
                              : lead.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.value !== null && lead.value !== undefined && !isNaN(Number(lead.value))
                            ? Number(lead.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleCall(lead)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleWhatsApp(lead)}
                              className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {sortedLeads.map((lead) => {
              const styles = getRowStyles(lead.status);
              return (
                <div
                  key={lead.id}
                  className={`px-3 py-2 flex items-center rounded-lg shadow-sm ${styles.card}`}
                  onClick={() => handleViewLead(lead)}
                >
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full mr-3 ${
                      lead.status === 'fresh' ? 'bg-gray-400' :
                      lead.status === 'follow-up' ? 'bg-orange-500' :
                      lead.status === 'rnr' ? 'bg-purple-500' :
                      lead.status === 'closed' ? 'bg-green-600' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {lead.name}
                        {user?.name && (
                          <span className="text-xs font-normal text-gray-600"> • {user.name}</span>
                        )}
                      </p>
                      <div className="text-right">
                        {lead.value !== null && lead.value !== undefined && !isNaN(Number(lead.value)) && (
                          <span className="text-[11px] font-medium text-green-700 whitespace-nowrap block">
                            {Number(lead.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{lead.country}{lead.product ? ` • ${lead.product}` : ''}</p>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      Uploaded {lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM yyyy') : '—'} • Last follow up: {lead.lastCalled ? format(new Date(lead.lastCalled), 'dd MMM yyyy') : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCall(lead)}
                      className="p-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(lead)}
                      className="p-2 rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No leads found</p>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Create Lead</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={async (e)=>{
              e.preventDefault();
              try {
                if (!createForm.name || !createForm.phone || !createForm.country) {
                  toast.error('Name, phone and country are required');
                  return;
                }
                const payload = { ...createForm };
                await leadAPI.createLead(payload);
                toast.success('Lead created');
                setShowCreate(false);
                setCreateForm({ name: '', phone: '', country: '', email: '', product: '', source: '', notes: '' });
                fetchLeads();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to create lead');
              }
            }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input-field" value={createForm.name} onChange={(e)=>setCreateForm({...createForm,name:e.target.value})} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={createForm.phone} onChange={(e)=>setCreateForm({...createForm,phone:e.target.value})} required />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  className="input-field"
                  value={createForm.country}
                  onChange={(e)=>setCreateForm({...createForm,country:e.target.value})}
                  list="country-list-ml-list"
                  placeholder="Start typing..."
                  required
                />
                <datalist id="country-list-ml-list">
                  {countries.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" value={createForm.email} onChange={(e)=>setCreateForm({...createForm,email:e.target.value})} />
              </div>
              <div>
                <label className="label">Product</label>
                <input className="input-field" value={createForm.product} onChange={(e)=>setCreateForm({...createForm,product:e.target.value})} />
              </div>
              <div>
                <label className="label">Source</label>
                <input className="input-field" value={createForm.source} onChange={(e)=>setCreateForm({...createForm,source:e.target.value})} />
              </div>
              
              <div className="md:col-span-2">
                <label className="label">Notes</label>
                <textarea className="input-field" rows={3} value={createForm.notes} onChange={(e)=>setCreateForm({...createForm,notes:e.target.value})} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[430px] p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Log Call - {selectedLead.name}</h2>
            
            <form onSubmit={handleCallComplete} className="space-y-4">
              <div>
                <label className="label">Call Notes (optional)</label>
                <textarea
                  className="input-field"
                  rows="4"
                  value={callData.note}
                  onChange={(e) => setCallData({ ...callData, note: e.target.value })}
                  placeholder="What was discussed in the call?"
                ></textarea>
              </div>

              <div>
                <label className="label">Status *</label>
                <select
                  className="input-field"
                  value={callData.status}
                  onChange={(e) => setCallData({ ...callData, status: e.target.value })}
                  required
                >
                  <option value="fresh">Fresh</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="rnr">RNR</option>
                  <option value="closed">Registered</option>
                  <option value="dead">Dead</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="label">Advance (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={callData.advance}
                  onChange={(e) => setCallData({ ...callData, advance: e.target.value })}
                  placeholder="Enter advance amount"
                />
              </div>

              <div>
                <label className="label">Country</label>
                <select
                  className="input-field"
                  value={callData.country}
                  onChange={(e) => setCallData({ ...callData, country: e.target.value })}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Product</label>
                <select
                  className="input-field"
                  value={callData.product}
                  onChange={(e) => setCallData({ ...callData, product: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save Call Log</button>
                <button type="button" onClick={handleCancelCallLog} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Lead Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lead Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{selectedLead.name}</p>
                </div>
                {selectedLead.salesperson && (
                  <div>
                    <p className="text-sm text-gray-600">Assigned To</p>
                    <p className="font-semibold text-gray-900">{selectedLead.salesperson.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="font-semibold text-gray-900 hover:underline">
                      {selectedLead.email}
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-900">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  {isEditing ? (
                    <select
                      className="input-field mt-1"
                      value={editData.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-gray-900">{selectedLead.country || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href={`tel:${selectedLead.phone}`} className="font-semibold text-primary-600 hover:underline">
                    {selectedLead.phone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  {isEditing ? (
                    <select
                      className="input-field mt-1"
                      value={editData.product}
                      onChange={(e) => setEditData({ ...editData, product: e.target.value })}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-gray-900">{selectedLead.product || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status === 'closed' ? 'REGISTERED' : selectedLead.status.toUpperCase()}
                  </span>
                </div>
                {selectedLead.value > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Advance</p>
                    <p className="font-semibold text-green-600">
                      {Number(selectedLead.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  </div>
                )}
                {selectedLead.lastCalled && (
                  <div>
                    <p className="text-sm text-gray-600">Last Called</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedLead.lastCalled).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedLead.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
                </div>
              )}

              {/* Activities */}
              {selectedLead.activities && selectedLead.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Activity History</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {[...selectedLead.activities]
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((activity) => (
                        <div key={activity.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium text-gray-900 capitalize">{activity.type}</p>
                          <p className="text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 btn-primary"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 btn-secondary"
                    >
                      Edit Country/Product
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 btn-primary"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeadsList;
