import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import StaleLeadsNotification from '../../components/StaleLeadsNotification';
import { Users, TrendingUp, Phone, IndianRupee, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label, LabelList } from 'recharts';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchDashboard();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { overview, leadsByStatus, topPerformers } = dashboardData || {};

  // Status-based colors as requested
  const STATUS_COLORS = {
    'fresh': '#FFFFFF',      // white
    'follow-up': '#F59E0B',  // orange
    'closed': '#10B981',     // green
    'dead': '#EF4444',       // red
    'rnr': '#9CA3AF',        // gray (fallback for RNR)
  };

  const totalStatusCount = Array.isArray(leadsByStatus)
    ? leadsByStatus.reduce((sum, s) => sum + Number(s.count || 0), 0)
    : 0;

  const percent = (value) => {
    if (!totalStatusCount) return '0%';
    const p = (Number(value) / totalStatusCount) * 100;
    return `${Math.round(p)}%`;
  };

  const formatInr = (amount) => {
    const numeric = Number(amount ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeValue);
  };

  return (
    <div className="space-y-6">
      {/* Stale Leads Notification */}
      <StaleLeadsNotification />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your CRM performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={overview?.totalLeads || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="This Month"
          value={overview?.leadsThisMonth || 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Follow-ups"
          value={overview?.followUpsCount || 0}
          icon={Phone}
          color="orange"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatInr(overview?.monthlyRevenue)}
          icon={IndianRupee}
          color="green"
          subtitle={`${overview?.conversionRate || 0}% conversion`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <div className="card overflow-visible">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leads by Status</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={leadsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 55 : 70}
                outerRadius={isMobile ? 90 : 110}
                paddingAngle={2}
                cornerRadius={6}
                labelLine={false}
                label={isMobile ? false : ((props) => {
                  const { cx, cy, midAngle, innerRadius, outerRadius, value, payload } = props;
                  if (!value || totalStatusCount === 0) return null;
                  const share = Number(value) / totalStatusCount;
                  if (share < 0.03) return null; // hide tiny slices
                  const RADIAN = Math.PI / 180;
                  // place label at the midpoint of the ring thickness
                  const r = (innerRadius + outerRadius) / 2;
                  const x = cx + r * Math.cos(-midAngle * RADIAN);
                  const y = cy + r * Math.sin(-midAngle * RADIAN);
                  const text = `${Math.round(share * 100)}%`;
                  const fill = payload?.status === 'fresh' ? '#111827' : '#ffffff';
                  return (
                    <text x={x} y={y} fill={fill} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
                      {text}
                    </text>
                  );
                })}
                dataKey="count"
                nameKey="status"
              >
                {leadsByStatus?.map((entry, index) => {
                  const fill = STATUS_COLORS[entry.status] || '#9CA3AF';
                  return (
                    <Cell key={`cell-${index}`} fill={fill} stroke="#e5e7eb" strokeWidth={2} />
                  );
                })}
                {!isMobile && (
                  <Label
                    position="center"
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={700} fill="#111827">
                            {totalStatusCount.toLocaleString('en-IN')}
                          </text>
                          <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#6B7280">
                            Leads
                          </text>
                        </g>
                      );
                    }}
                  />
                )}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${Number(value).toLocaleString()} (${percent(value)})`,
                  props?.payload?.status || name
                ]}
              />
              <Legend verticalAlign={isMobile ? 'bottom' : 'right'} align={isMobile ? 'center' : 'right'} layout={isMobile ? 'horizontal' : 'vertical'} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="card overflow-visible">
          <h2 className="text-xl font-semibold text-gray-900">Top Closers</h2>
          <p className="text-sm text-gray-500 mb-4">Ranked by closed leads this month</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerformers} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis width={isMobile ? 30 : 40} allowDecimals={false} label={{ value: 'Closings', angle: -90, position: 'insideLeft', offset: 10 }} />
              <Tooltip formatter={(value) => [`${value} closes`, 'Closed Leads']} />
              <Bar dataKey="closedLeads" fill="#10b981" name="Closed Leads" barSize={isMobile ? 28 : 32} radius={[6, 6, 0, 0]}>
                <LabelList dataKey="closedLeads" position="top" fill="#047857" formatter={(val) => `${val}`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
          <Award className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salesperson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPerformers?.map((performer, index) => (
                <tr key={performer.id} className={index === 0 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-2xl ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {index === 0 ? '🏆' : `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{performer.name}</div>
                    <div className="text-sm text-gray-500">{performer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    {performer.closedLeads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    ₹{Number(performer.revenue).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {performer.totalLeads}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
