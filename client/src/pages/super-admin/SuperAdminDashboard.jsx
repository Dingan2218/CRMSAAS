import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Building2, User, MessageSquare, Trash2, CheckCircle, XCircle, Megaphone, LayoutList, Pencil } from 'lucide-react';

const SuperAdminDashboard = () => {
    // ... (existing state)
    const [activeTab, setActiveTab] = useState('companies');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: null, name: '', logoUrl: '', primaryColor: '' });

    // ... (existing message state and other)
    const [messages, setMessages] = useState([]);
    const [msgForm, setMsgForm] = useState({ title: '', content: '', type: 'all', targetCompanyId: '' });

    // Form State (create)
    const [formData, setFormData] = useState({
        companyName: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: ''
    });

    // ... (fetch functions)
    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getCompanies();
            setCompanies(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await superAdminAPI.getMessages();
            setMessages(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCompanies();
        fetchMessages();
    }, []);

    // ... (handle create submit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await superAdminAPI.createCompany(formData);
            toast.success('Company created successfully');
            setShowModal(false);
            setFormData({
                companyName: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
                adminPhone: '',
                logoUrl: '',
                primaryColor: '#DC2626'
            });
            fetchCompanies();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create company');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit Logic
    const handleEditClick = (company) => {
        setEditForm({
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl || '',
            primaryColor: company.primaryColor || '#DC2626'
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await superAdminAPI.updateCompany(editForm.id, editForm);
            toast.success('Company updated');
            setShowEditModal(false);
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to update company');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await superAdminAPI.updateSubscription(id, status);
            toast.success('Subscription status updated');
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleLimitChange = async (id, maxUsers) => {
        try {
            await superAdminAPI.updateLimit(id, maxUsers);
            toast.success('Limit updated');
        } catch (error) {
            toast.error('Failed to update limit');
        }
    };

    const handleDeleteCompany = async (company) => {
        const confirmMessage = `Are you sure you want to delete "${company.name}"?\n\nThis will permanently delete:\n- The company\n- All associated users\n- All associated leads\n\nThis action CANNOT be undone!`;

        if (!window.confirm(confirmMessage)) return;

        try {
            const res = await superAdminAPI.deleteCompany(company.id);
            toast.success(res.data.message || 'Company deleted successfully');
            fetchCompanies();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete company');
        }
    };

    const handleMsgSubmit = async (e) => {
        e.preventDefault();
        try {
            await superAdminAPI.createMessage(msgForm);
            toast.success('Message created');
            setMsgForm({ title: '', content: '', type: 'all', targetCompanyId: '' });
            fetchMessages();
        } catch (error) {
            toast.error('Failed to create message');
        }
    };

    const toggleMsg = async (id) => {
        try {
            await superAdminAPI.toggleMessage(id);
            fetchMessages();
            toast.success('Status updated');
        } catch (e) { toast.error('Failed'); }
    };

    const deleteMsg = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await superAdminAPI.deleteMessage(id);
            toast.success('Deleted');
            fetchMessages();
        } catch (e) { toast.error('Failed'); }
    };

    const getCompanyName = (id) => {
        const company = companies.find(c => c.id === id);
        return company ? company.name : 'Unknown Company';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                    <p className="text-gray-500">Manage all customer companies and system messages</p>
                </div>
                {activeTab === 'companies' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Company
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'companies'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Building2 className="h-5 w-5" />
                        Companies
                    </button>
                    <button
                        onClick={() => setActiveTab('popups')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'popups'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Megaphone className="h-5 w-5" />
                        Popups & Messages
                    </button>
                </nav>
            </div>

            {/* Companies Content */}
            {activeTab === 'companies' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <LayoutList className="h-5 w-5 text-indigo-600" />
                            Registered Companies
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            Total: {companies.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-sm">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Company Name</th>
                                    <th className="px-6 py-3 font-medium">Subscription</th>
                                    <th className="px-6 py-3 font-medium">User Limit</th>
                                    <th className="px-6 py-3 font-medium">Created At</th>
                                    <th className="px-6 py-3 font-medium">Admin User</th>
                                    <th className="px-6 py-3 font-medium">Contact</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            Loading companies...
                                        </td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No companies found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map((company) => {
                                        const admin = company.users?.[0];
                                        return (
                                            <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {company.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={company.subscriptionStatus}
                                                        onChange={(e) => handleStatusChange(company.id, e.target.value)}
                                                        className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6
                                                            ${company.subscriptionStatus === 'active' ? 'bg-green-50 text-green-700' :
                                                                company.subscriptionStatus === 'expired' ? 'bg-red-50 text-red-700' :
                                                                    'bg-blue-50 text-blue-700'}`}
                                                    >
                                                        <option value="trial">Trial</option>
                                                        <option value="active">Active (Pro)</option>
                                                        <option value="expired">Expired</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        defaultValue={company.maxUsers || 5}
                                                        onBlur={(e) => handleLimitChange(company.id, e.target.value)}
                                                        className="w-20 rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(company.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {admin ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                                {admin.name.charAt(0)}
                                                            </div>
                                                            <span className="text-gray-900">{admin.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No admin assigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {admin?.email}
                                                    {admin?.phone && <div className="text-xs text-gray-400">{admin.phone}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(company)}
                                                            className="text-indigo-600 hover:text-indigo-900 text-xs font-medium flex items-center gap-1"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCompany(company)}
                                                            className="text-red-600 hover:text-red-900 text-xs font-medium flex items-center gap-1"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Company Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Company</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Logo URL</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    value={editForm.logoUrl}
                                    onChange={e => setEditForm({ ...editForm, logoUrl: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-10 w-12 p-0 border-0 rounded"
                                        value={editForm.primaryColor}
                                        onChange={e => setEditForm({ ...editForm, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editForm.primaryColor}
                                        onChange={e => setEditForm({ ...editForm, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Popups Content (Same as before but ensures proper order after this edit) */}
            {activeTab === 'popups' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Create Popup Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-600" />
                                Create New Popup
                            </h3>
                            <form onSubmit={handleMsgSubmit} className="space-y-4">
                                <div>
                                    <label className="label">Popup Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. System Maintenance"
                                        required
                                        className="input-field"
                                        value={msgForm.title}
                                        onChange={e => setMsgForm({ ...msgForm, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Target Audience</label>
                                    <select
                                        className="input-field"
                                        value={msgForm.type}
                                        onChange={e => setMsgForm({ ...msgForm, type: e.target.value })}
                                    >
                                        <option value="all">All Companies</option>
                                        <option value="specific">Specific Company</option>
                                    </select>
                                </div>
                                {msgForm.type === 'specific' && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="label">Select Company</label>
                                        <select
                                            className="input-field"
                                            required
                                            value={msgForm.targetCompanyId}
                                            onChange={e => setMsgForm({ ...msgForm, targetCompanyId: e.target.value })}
                                        >
                                            <option value="">-- Select Company --</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="label">Message Content</label>
                                    <textarea
                                        placeholder="Type your message here..."
                                        required
                                        rows="4"
                                        className="input-field resize-none"
                                        value={msgForm.content}
                                        onChange={e => setMsgForm({ ...msgForm, content: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="w-full btn-primary">
                                    Publish Popup
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Active Popups List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Active Popups & History</h3>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                Total: {messages.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">No popups created yet.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">{msg.title}</h4>
                                                {msg.isActive ?
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 rounded-full font-medium">Active</span> :
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 rounded-full font-medium">Inactive</span>
                                                }
                                                <span className={`text-xs px-2 rounded-full font-medium ${msg.type === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {msg.type === 'all' ? 'All Companies' : `To: ${getCompanyName(msg.targetCompanyId)}`}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleMsg(msg.id)}
                                                    className={`p-1.5 rounded-md transition-colors ${msg.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    title={msg.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {msg.isActive ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteMsg(msg.id)}
                                                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
                                            <span>Created: {new Date(msg.createdAt).toLocaleString()}</span>
                                            {/* Could add author if relevant */}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Company Modal (Restored at end) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto w-full">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Create New Company</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            {/* ... (Existing Create Form Content) ... */}
                            {/* I will assume reusing existing Create Form logic since it was unchanged logically */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                required
                                                className="pl-10 input-field"
                                                placeholder="e.g. Acme Corp"
                                                value={formData.companyName}
                                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                min="1"
                                                className="input-field"
                                                placeholder="Max Users (Default 5)"
                                                value={formData.maxUsers || ''}
                                                onChange={e => setFormData({ ...formData, maxUsers: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="label">Logo URL</label>
                                        <input
                                            type="url"
                                            className="input-field"
                                            placeholder="https://example.com/logo.png"
                                            value={formData.logoUrl || ''}
                                            onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Primary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                className="h-10 w-12 p-0 border-0 rounded"
                                                value={formData.primaryColor || '#DC2626'}
                                                onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="#DC2626"
                                                value={formData.primaryColor || ''}
                                                onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Admin Account Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Admin Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-field"
                                                placeholder="John Doe"
                                                value={formData.adminName}
                                                onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Phone</label>
                                            <input
                                                type="tel"
                                                className="input-field"
                                                placeholder="+1234567890"
                                                value={formData.adminPhone}
                                                onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="label">Admin Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="input-field"
                                            placeholder="admin@acme.com"
                                            value={formData.adminEmail}
                                            onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <label className="label">Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="input-field"
                                            placeholder="••••••••"
                                            value={formData.adminPassword}
                                            onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
