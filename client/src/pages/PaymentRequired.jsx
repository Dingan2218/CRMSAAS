import { useAuth } from '../context/AuthContext';
import { LogOut, CreditCard, Phone, Mail } from 'lucide-react';

const PaymentRequired = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-red-600" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Suspended</h1>
                    <p className="text-gray-500">
                        The subscription for <strong>{user?.company?.name}</strong> has expired or your trial has ended.
                    </p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-orange-800 text-left">
                    <p className="font-semibold mb-1">What now?</p>
                    <p>Please contact your administrator or support to restore access immediately.</p>
                </div>

                <div className="pt-4 space-y-3">
                    <button
                        onClick={() => window.location.href = 'tel:+917510991147'}
                        className="btn-primary w-full justify-center flex items-center gap-2"
                    >
                        <Phone className="w-4 h-4" />
                        Call +91 7510991147
                    </button>

                    <button
                        onClick={() => window.location.href = 'mailto:info@sysdevcode.com'}
                        className="btn-secondary w-full justify-center flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        Email Billing Support
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400">
                User ID: {user?.id} • Company ID: {user?.companyId}
            </p>
        </div>
    );
};

export default PaymentRequired;
