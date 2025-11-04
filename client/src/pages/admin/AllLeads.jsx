import { useState, useEffect } from 'react';
import { leadAPI } from '../../services/api';
import LeadCard from '../../components/LeadCard';
import { Search, Trash2, Globe2, Package, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AllLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [countries, setCountries] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [statusSummary, setStatusSummary] = useState({
    all: 0,
    fresh: 0,
    'follow-up': 0,
    rnr: 0,
    closed: 0,
    dead: 0,
    cancelled: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    country: '',
    product: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    lastCalled: '',
    value: '',
    country: '',
    product: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchLeads();
    fetchCountries();
    fetchProducts();
  }, [filters, page]);

  const fetchCountries = async () => {
    try {
      const response = await leadAPI.getCountries();
      setCountries(response.data.data);
    } catch (error) {
      // Silently fail if no countries
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await leadAPI.getProducts();
      setProducts(response.data.data);
    } catch (error) {
      // Silently fail if no products
    }
  };

  const getStatusPillClass = (status) => {
    switch (status) {
      case 'fresh':
        return 'bg-white text-gray-700 border border-gray-300';
      case 'follow-up':
        return 'bg-orange-100 text-orange-800';
      case 'rnr':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'dead':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const STATUS_ROW_STYLES = {
    fresh: {
      row: 'bg-white',
      hover: 'hover:bg-gray-50',
      avatar: 'border border-gray-300 bg-gray-100 text-gray-700'
    },
    'follow-up': {
      row: 'bg-orange-100',
      hover: 'hover:bg-orange-200',
      avatar: 'border border-orange-300 bg-orange-200 text-orange-900'
    },
    rnr: {
      row: 'bg-purple-100',
      hover: 'hover:bg-purple-200',
      avatar: 'border border-purple-300 bg-purple-200 text-purple-900'
    },
    closed: {
      row: 'bg-green-100',
      hover: 'hover:bg-green-200',
      avatar: 'border border-green-300 bg-green-200 text-green-900'
    },
    dead: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      avatar: 'border border-red-300 bg-red-200 text-red-900'
    },
    cancelled: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      avatar: 'border border-red-300 bg-red-200 text-red-900'
    },
    rejected: {
      row: 'bg-red-100',
      hover: 'hover:bg-red-200',
      avatar: 'border border-red-300 bg-red-200 text-red-900'
    },
    default: {
      row: 'bg-white',
      hover: 'hover:bg-gray-50',
      avatar: 'border border-gray-300 bg-gray-100 text-gray-700'
    }
  };

  const getStatusRowStyles = (status) => STATUS_ROW_STYLES[status] || STATUS_ROW_STYLES.default;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await leadAPI.getAllLeads({ ...filters, page, limit: pageSize });
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      setLeads(rows.map((l) => ({ ...l, value: l.value !== undefined && l.value !== null ? Number(l.value) : l.value })));
      setTotal(response.data.total || 0);
      setStatusSummary(response.data.statusSummary || {});
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

    // Handle nested salesperson name
    if (sortConfig.key === 'salesperson') {
      aValue = a.salesperson?.name || '';
      bValue = b.salesperson?.name || '';
    }

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

  const handleLeadClick = async (lead) => {
    try {
      const response = await leadAPI.getLead(lead.id);
      const data = response.data.data || {};
      // Coerce value for the edit form
      setSelectedLead({ ...data, value: data.value !== undefined && data.value !== null ? Number(data.value) : data.value });
      setUpdateData({
        status: response.data.data.status,
        notes: response.data.data.notes || '',
        lastCalled: response.data.data.lastCalled || '',
        value: (response.data.data.value !== undefined && response.data.data.value !== null)
          ? String(Number(response.data.data.value))
          : '',
        country: response.data.data.country || '',
        product: response.data.data.product || ''
      });
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load lead details');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating lead with data:', updateData);
      const response = await leadAPI.updateLead(selectedLead.id, {
        ...updateData,
        // ensure numeric payload for value when present
        value: updateData.value === '' || updateData.value === null || updateData.value === undefined
          ? ''
          : Number(updateData.value),
        country: updateData.country,
        product: updateData.product
      });
      console.log('Update response:', response.data);
      toast.success('Lead updated successfully');
      // Optimistically update local list so UI reflects new advance immediately
      if (response?.data?.data) {
        const updated = response.data.data;
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated, value: Number(updated.value) } : l)));
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadAPI.deleteLead(leadId);
        toast.success('Lead deleted successfully');
        setShowModal(false);
        fetchLeads();
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)?`)) {
      try {
        await Promise.all(selectedLeads.map(id => leadAPI.deleteLead(id)));
        toast.success(`${selectedLeads.length} lead(s) deleted successfully`);
        setSelectedLeads([]);
        fetchLeads();
      } catch (error) {
        toast.error('Failed to delete some leads');
      }
    }
  };

  const statusCounts = statusSummary;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSelectedLeads([]);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Leads</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all leads in the system</p>
        </div>
        
        {/* Bulk Actions - Desktop & Mobile */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedLeads.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete Selected</span>
              <span className="sm:hidden">Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card sticky top-16 z-20 md:static">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="input-field pl-10 text-sm md:text-base"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
            <select
              className="input-field text-sm md:text-base"
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
              className="input-field text-sm md:text-base"
              value={filters.product || ''}
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
              className="input-field text-sm md:text-base"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="fresh">Fresh</option>
              <option value="follow-up">Follow-up</option>
              <option value="rnr">RNR</option>
              <option value="closed">Closed</option>
              <option value="dead">Dead</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {[
            { key: '', label: 'All', color: 'bg-gray-100 text-gray-800' },
            { key: 'fresh', label: 'Fresh', color: 'bg-white border-2 border-gray-300' },
            { key: 'follow-up', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
            { key: 'rnr', label: 'RNR', color: 'bg-purple-100 text-purple-800' },
            { key: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
            { key: 'dead', label: 'Dead', color: 'bg-red-100 text-red-800' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
            { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilters({ ...filters, status: tab.key })}
              className={`px-3 md:px-4 py-2 rounded-full font-medium transition-all text-sm md:text-base whitespace-nowrap snap-start shadow-sm border ${
                filters.status === tab.key ? 'border-primary-500 bg-white' : 'border-transparent'
              } ${tab.color}`}
            >
              {tab.label} ({statusCounts[tab.key || 'all']})
            </button>
          ))}
        </div>

        {/* Select All Checkbox */}
        {leads.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={selectedLeads.length === leads.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Select All ({leads.length})
            </label>
          </div>
        )}
      </div>

      {/* Leads - Mobile Compact List and Desktop Grid */}
      {leads.length > 0 ? (
        <>
          {/* Mobile Compact List - Enhanced with colored backgrounds */}
          <div className="md:hidden space-y-2">
            {sortedLeads.map((lead) => (
              <div
                key={`${lead.id}-${Number(lead.value ?? 0)}`}
                className={`px-3 py-2 flex items-center rounded-lg border shadow-sm ${
                  lead.status === 'fresh'
                    ? 'bg-gray-100 border-gray-300'
                    : lead.status === 'follow-up'
                    ? 'bg-orange-100 border-orange-300'
                    : lead.status === 'rnr'
                    ? 'bg-purple-100 border-purple-300'
                    : lead.status === 'closed'
                    ? 'bg-green-100 border-green-300'
                    : lead.status === 'dead' || lead.status === 'cancelled' || lead.status === 'rejected'
                    ? 'bg-red-100 border-red-300'
                    : 'bg-gray-100 border-gray-300'
                }`}
                onClick={() => handleLeadClick(lead)}
              >
                {/* Select checkbox */}
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => handleSelectLead(lead.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-2 w-4 h-4 text-primary-600 rounded"
                />
                {/* Avatar */}
                <div className={`mr-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-800 border ${
                  lead.status === 'follow-up' ? 'bg-orange-100 border-orange-300' :
                  lead.status === 'rnr' ? 'bg-purple-100 border-purple-300' :
                  lead.status === 'closed' ? 'bg-green-100 border-green-300' :
                  lead.status === 'dead' || lead.status === 'cancelled' || lead.status === 'rejected' ? 'bg-red-100 border-red-300' :
                  'bg-gray-100 border-gray-300'
                }`}>
                  {lead.name?.charAt(0)?.toUpperCase()}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                    {lead.value !== null && lead.value !== undefined && !isNaN(Number(lead.value)) && (
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${lead.status === 'dead' || lead.status === 'cancelled' || lead.status === 'rejected' ? 'text-red-700' : 'text-green-700'}`}>
                        {lead.status === 'cancelled' ? 'Refund: ' : ''}
                        {Number(lead.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                    <Globe2 className="w-3.5 h-3.5 text-gray-700" />
                    <span className="truncate">{lead.phone} • {lead.country}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {lead.product && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-1">
                        <Package className="w-3 h-3" /> {lead.product}
                      </span>
                    )}
                    {lead.lastCalled && (
                      <span className="text-[10px] text-gray-500">
                        • last call {formatDistanceToNow(new Date(lead.lastCalled), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="ml-2 w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Lead Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('country')}
                    >
                      <div className="flex items-center gap-2">
                        Lead Source
                        {getSortIcon('country')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Lead Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('lastCalled')}
                    >
                      <div className="flex items-center gap-2">
                        Last Called
                        {getSortIcon('lastCalled')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('salesperson')}
                    >
                      <div className="flex items-center gap-2">
                        Lead Owner
                        {getSortIcon('salesperson')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center gap-2">
                        Advance / Refund
                        {getSortIcon('value')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {sortedLeads.map((lead) => {
                    const styles = getStatusRowStyles(lead.status);
                    return (
                      <tr
                        key={`${lead.id}-${Number(lead.value ?? 0)}`}
                        className={`${styles.row} ${styles.hover} transition-colors`}
                        onClick={() => handleLeadClick(lead)}
                      >
                        <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${styles.avatar}`}>
                              {lead.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-xs text-gray-500">
                                {lead.lastCalled
                                  ? `Last called ${formatDistanceToNow(new Date(lead.lastCalled), { addSuffix: true })}`
                                  : `Created ${formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          <div className="flex flex-col gap-0.5">
                            {lead.email && <span className="text-gray-900">{lead.email}</span>}
                            <span className="text-gray-600">{lead.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          {lead.product || lead.country || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(lead.status)}`}>
                            {lead.status === 'follow-up'
                              ? 'Follow-up'
                              : lead.status === 'rnr'
                              ? 'RNR'
                              : lead.status === 'cancelled'
                              ? 'Cancelled'
                              : lead.status === 'rejected'
                              ? 'Rejected'
                              : lead.status?.charAt(0)?.toUpperCase() + lead.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          {lead.lastCalled
                            ? formatDistanceToNow(new Date(lead.lastCalled), { addSuffix: true })
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          {lead.salesperson?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                          {lead.value !== null && lead.value !== undefined && !isNaN(Number(lead.value)) ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-[11px] uppercase tracking-wide text-gray-500">
                                {lead.status === 'cancelled' ? 'Refund' : 'Advance'}
                              </span>
                              <span>{Number(lead.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No leads found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} leads
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={!canGoPrev}
            >
              Previous
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span>Page</span>
              <span className="font-semibold">{page}</span>
              <span>of {totalPages}</span>
            </div>
            <button
              className="btn-secondary text-sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal - Compact */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[430px] p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete Lead"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Lead Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-semibold">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <a href={`tel:${selectedLead.phone}`} className="font-semibold text-primary-600 hover:underline">
                  {selectedLead.phone}
                </a>
              </div>
              {selectedLead.email && (
                <div className="col-span-2">
                  <p className="text-gray-500">Email</p>
                  <a href={`mailto:${selectedLead.email}`} className="font-semibold text-primary-600 hover:underline">
                    {selectedLead.email}
                  </a>
                </div>
              )}
              <div>
                <p className="text-gray-500">Country</p>
                <p className="font-semibold">{selectedLead.country || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Product</p>
                <p className="font-semibold">{selectedLead.product || '-'}</p>
              </div>
              {selectedLead.salesperson && (
                <div className="col-span-2">
                  <p className="text-gray-500">Assigned To</p>
                  <p className="font-semibold">{selectedLead.salesperson.name}</p>
                </div>
              )}
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="input-field text-sm"
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="fresh">Fresh</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="rnr">RNR</option>
                    <option value="closed">Closed</option>
                    <option value="dead">Dead</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {updateData.status === 'cancelled' ? 'Refund' : 'Advance'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="input-field text-sm"
                    value={updateData.value}
                    onChange={(e) => setUpdateData({ ...updateData, value: e.target.value })}
                    placeholder={updateData.status === 'cancelled' ? 'Enter refund amount' : '0.00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    className="input-field text-sm"
                    value={updateData.country}
                    onChange={(e) => setUpdateData({ ...updateData, country: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    className="input-field text-sm"
                    value={updateData.product}
                    onChange={(e) => setUpdateData({ ...updateData, product: e.target.value })}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLead.lastCalled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Called</label>
                  <input
                    type="text"
                    className="input-field text-sm bg-gray-50 cursor-not-allowed"
                    value={new Date(selectedLead.lastCalled).toLocaleString()}
                    readOnly
                    disabled
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input-field text-sm"
                  rows="2"
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  placeholder="Add notes..."
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="submit" className="btn-primary flex-1 text-sm py-2">Update Lead</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm py-2">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLeads;
