import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Edit2, UserX, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageSalespeople = () => {
  const { user } = useAuth();
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    monthlyTarget: '',
    weeklyTarget: ''
  });

  useEffect(() => {
    fetchSalespeople();
  }, []);

  const fetchSalespeople = async () => {
    try {
      const response = await userAPI.getSalespeople();
      setSalespeople(response.data.data);
    } catch (error) {
      toast.error('Failed to load salespeople');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id, name) => {
    try {
      await userAPI.updateSalesperson(id, { isActive: true });
      toast.success('Salesperson activated');
      fetchSalespeople();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate salesperson');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await userAPI.updateSalesperson(editingUser.id, formData);
        toast.success('Salesperson updated successfully');
      } else {
        await userAPI.createSalesperson(formData);
        toast.success('Salesperson created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchSalespeople();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      monthlyTarget: user.monthlyTarget || '',
      weeklyTarget: user.weeklyTarget || ''
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}? They will no longer be able to log in.`)) {
      try {
        await userAPI.deactivateSalesperson(id);
        toast.success('Salesperson deactivated');
        fetchSalespeople();
      } catch (error) {
        toast.error('Failed to deactivate salesperson');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Permanently delete ${name}? This action cannot be undone.`)) {
      try {
        await userAPI.deleteSalesperson(id);
        toast.success('Salesperson deleted permanently');
        fetchSalespeople();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete salesperson');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      monthlyTarget: '',
      weeklyTarget: ''
    });
    setEditingUser(null);
  };

  const getLeadStats = (user) => {
    const leads = user.leads || [];
    return {
      total: leads.length,
      closed: leads.filter(l => l.status === 'closed').length,
      fresh: leads.filter(l => l.status === 'fresh').length,
      followUp: leads.filter(l => l.status === 'follow-up').length
    };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  // Calculate Limit Stats
  const maxUsers = user?.company?.maxUsers || 5;
  const currentUsage = salespeople.length;
  const limitReached = currentUsage >= maxUsers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Salespeople</h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage your sales team</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Limit Indicator */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              Users: <span className={limitReached ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{currentUsage}</span> / {maxUsers}
            </div>
            {limitReached && <div className="text-xs text-red-500 font-medium">Limit Reached</div>}
          </div>

          <button
            disabled={limitReached}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className={limitReached
              ? "flex items-center space-x-2 bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-lg"
              : "btn-primary flex items-center space-x-2"
            }
            title={limitReached ? "User limit reached. Upgrade plan to add more." : "Add new salesperson"}
          >
            <UserPlus className="h-5 w-5" />
            <span>Add Salesperson</span>
          </button>
        </div>
      </div>

      {/* Salespeople Grid: phones & iPad (<= lg) single column; desktop >= lg shows 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {salespeople.map((person) => {
          const stats = getLeadStats(person);
          return (
            <div key={person.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                  <p className="text-sm text-gray-600">{person.email}</p>
                  {person.phone && (
                    <p className="text-sm text-gray-600">{person.phone}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${person.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {person.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Leads:</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Closed:</span>
                  <span className="font-semibold text-green-600">{stats.closed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Follow-up:</span>
                  <span className="font-semibold text-orange-600">{stats.followUp}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex space-x-2">
                <button
                  onClick={() => handleEdit(person)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-1"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                {person.isActive ? (
                  <button
                    onClick={() => handleDeactivate(person.id, person.name)}
                    className="flex-1 btn-danger text-sm flex items-center justify-center space-x-1"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Deactivate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(person.id, person.name)}
                    className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Activate</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(person.id, person.name)}
                  className="flex-1 btn-danger text-sm flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit Salesperson' : 'Add New Salesperson'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Password {editingUser && '(leave blank to keep current)'}</label>
                <input
                  type="password"
                  className="input-field"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Monthly Conversions Target</label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    step={1}
                    value={formData.monthlyTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Weekly Conversions Target</label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    step={1}
                    value={formData.weeklyTarget}
                    onChange={(e) => setFormData({ ...formData, weeklyTarget: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSalespeople;
