import { useState, useEffect } from 'react';
import { leadAPI } from '../../services/api';
import LeadCard from '../../components/LeadCard';
import { Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const MyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [countries, setCountries] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    country: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
    lastCalled: '',
    value: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchCountries();
  }, [filters]);

  const fetchCountries = async () => {
    try {
      const response = await leadAPI.getCountries();
      setCountries(response.data.data);
    } catch (error) {
      // Silently fail if no countries
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await leadAPI.getMyLeads(filters);
      setLeads(response.data.data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = async (lead) => {
    try {
      const response = await leadAPI.getLead(lead.id);
      setSelectedLead(response.data.data);
      setUpdateData({
        status: response.data.data.status,
        notes: response.data.data.notes || '',
        lastCalled: response.data.data.lastCalled || '',
        value: response.data.data.value || ''
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
        value: updateData.value === '' || updateData.value === null || updateData.value === undefined
          ? ''
          : Number(updateData.value)
      });
      console.log('Update response:', response.data);
      toast.success('Lead updated successfully');
      if (response?.data?.data) {
        const updated = response.data.data;
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleAddNote = async () => {
    const note = prompt('Enter your note:');
    if (note) {
      try {
        await leadAPI.addActivity(selectedLead.id, {
          type: 'note',
          description: note
        });
        toast.success('Note added successfully');
        handleLeadClick(selectedLead);
      } catch (error) {
        toast.error('Failed to add note');
      }
    }
  };

  const statusCounts = {
    all: leads.length,
    fresh: leads.filter(l => l.status === 'fresh').length,
    'follow-up': leads.filter(l => l.status === 'follow-up').length,
    closed: leads.filter(l => l.status === 'closed').length,
    dead: leads.filter(l => l.status === 'dead').length,
    cancelled: leads.filter(l => l.status === 'cancelled').length,
    rejected: leads.filter(l => l.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
        <p className="text-gray-600 mt-1">Manage and track your assigned leads</p>
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
          
          <div className="flex gap-2">
            <select
              className="input-field"
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
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="fresh">Fresh</option>
              <option value="follow-up">Follow-up</option>
              <option value="closed">Closed</option>
              <option value="dead">Dead</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {[
            { key: '', label: 'All', color: 'bg-gray-100 text-gray-800' },
            { key: 'fresh', label: 'Fresh', color: 'bg-white border-2 border-gray-300' },
            { key: 'follow-up', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
            { key: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800' },
            { key: 'dead', label: 'Dead', color: 'bg-red-100 text-red-800' },
            { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
            { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilters({ ...filters, status: tab.key })}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${tab.color} ${
                filters.status === tab.key ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {tab.label} ({statusCounts[tab.key || 'all']})
            </button>
          ))}
        </div>
      </div>

      {/* Leads Grid */}
      {leads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => handleLeadClick(lead)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No leads found</p>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lead Details</h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href={`tel:${selectedLead.phone}`} className="font-semibold text-primary-600 hover:underline">
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${selectedLead.email}`} className="font-semibold text-primary-600 hover:underline">
                      {selectedLead.email}
                    </a>
                  </div>
                )}
                {selectedLead.country && (
                  <div>
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="font-semibold text-gray-900">{selectedLead.country}</p>
                  </div>
                )}
                {selectedLead.product && (
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-semibold text-gray-900">{selectedLead.product}</p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select
                  className="input-field"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <option value="fresh">Fresh</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="closed">Closed</option>
                  <option value="dead">Dead</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              

              <div>
                <label className="label">Advance</label>
                <input
                  type="number"
                  className="input-field"
                  value={updateData.value}
                  onChange={(e) => setUpdateData({ ...updateData, value: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Last Called</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={updateData.lastCalled}
                  onChange={(e) => setUpdateData({ ...updateData, lastCalled: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input-field"
                  rows="4"
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                ></textarea>
              </div>

              {/* Activities */}
              {selectedLead.activities && selectedLead.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Activity History</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedLead.activities.map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-medium text-gray-900">{activity.type}</p>
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
                <button type="submit" className="flex-1 btn-primary">
                  Update Lead
                </button>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="flex-1 btn-secondary"
                >
                  Add Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
