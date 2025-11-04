import { Phone, Mail, Globe2, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const LeadCard = ({ lead, onClick }) => {
  const statusColors = {
    fresh: 'status-fresh',
    'follow-up': 'status-follow-up',
    rnr: 'bg-purple-50 border-purple-200',
    dead: 'status-dead',
    closed: 'status-closed',
    cancelled: 'status-dead',
    rejected: 'status-dead'
  };

  const statusLabels = {
    fresh: 'Fresh',
    'follow-up': 'Follow-up',
    rnr: 'RNR',
    dead: 'Dead',
    closed: 'Closed',
    cancelled: 'Cancelled',
    rejected: 'Rejected'
  };

  const handleCall = (e, phone) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const adv = lead?.value !== undefined && lead?.value !== null ? parseFloat(lead.value) : NaN;
  if (typeof window !== 'undefined') {
    // Temporary debug to verify card receives the right value
    try { console.debug('[LeadCard]', lead?.id, 'value:', lead?.value, 'parsed:', adv); } catch {}
  }

  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-lg cursor-pointer transition-all hover:shadow md:hover:shadow-lg ${statusColors[lead.status]}`}
    >
      <div className="flex justify-between items-start mb-2 md:mb-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">{lead.name}</h3>
          {lead.country && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Globe2 className="h-4 w-4 mr-1" />
              {lead.country}
            </div>
          )}
          {lead.product && (
            <div className="flex items-center text-xs md:text-sm text-gray-600 mt-1">
              <Package className="h-4 w-4 mr-1" />
              {lead.product}
            </div>
          )}
        </div>
        <span className={`px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${
          lead.status === 'fresh' ? 'bg-gray-200 text-gray-800' :
          lead.status === 'follow-up' ? 'bg-orange-200 text-orange-800' :
          lead.status === 'rnr' ? 'bg-purple-200 text-purple-800' :
          (lead.status === 'dead' || lead.status === 'cancelled' || lead.status === 'rejected') ? 'bg-red-200 text-red-800' :
          'bg-green-200 text-green-800'
        }`}>
          {statusLabels[lead.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-700">
          <Phone className="h-4 w-4 mr-2 text-primary-600" />
          <button
            onClick={(e) => handleCall(e, lead.phone)}
            className="hover:text-primary-600 font-medium truncate"
          >
            {lead.phone}
          </button>
        </div>

        {lead.email && (
          <div className="hidden md:flex items-center text-sm text-gray-700">
            <Mail className="h-4 w-4 mr-2 text-primary-600" />
            <a href={`mailto:${lead.email}`} className="hover:text-primary-600">
              {lead.email}
            </a>
          </div>
        )}

        {lead.lastCalled && (
          <div className="flex items-center text-xs md:text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
            <span>Last called: {format(new Date(lead.lastCalled), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>

      {!isNaN(adv) && (
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-900">
            Advance: {adv.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </span>
        </div>
      )}
    </div>
  );
};

export default LeadCard;
