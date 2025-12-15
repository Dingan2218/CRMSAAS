import { useEffect, useMemo, useRef, useState } from 'react';
import { popupAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Markdown = ({ children }) => {
  // react-markdown escapes HTML by default (no rehype-raw), which satisfies the no-HTML rule
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {String(children || '')}
    </ReactMarkdown>
  );
};

const CTAButton = ({ popup, onClick }) => {
  if (!popup?.ctaText) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
    >
      {popup.ctaText}
    </button>
  );
};

const useAutoDismiss = (enabled, delayMs, cb) => {
  const timer = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    timer.current = setTimeout(() => {
      cb?.();
    }, delayMs);
    return () => timer.current && clearTimeout(timer.current);
  }, [enabled, delayMs, cb]);
};

const AdminPopups = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPopups = async () => {
    try {
      const res = await popupAPI.getForAdmin();
      setItems(res?.data?.data || []);
    } catch (e) {
      // 403 for non-admin roles (e.g. accountant) or 404: silently ignore
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
    // Optionally refresh every few minutes in case super admin activates something
    const id = setInterval(fetchPopups, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const modal = useMemo(() => items.find((p) => p.type === 'modal') || null, [items]);
  const bannersTop = useMemo(() => items.filter((p) => p.type === 'banner' && p.bannerPosition === 'top'), [items]);
  const bannersBottom = useMemo(() => items.filter((p) => p.type === 'banner' && p.bannerPosition === 'bottom'), [items]);
  const toasts = useMemo(() => items.filter((p) => p.type === 'toast'), [items]);

  const removeItem = (id) => setItems((prev) => prev.filter((p) => p.id !== id));

  const handleCTA = async (popup) => {
    try {
      if (popup.ctaAction === 'billing') {
        await popupAPI.complete(popup.id);
        window.location.href = '/admin/profile';
        return;
      }
      if (popup.ctaAction === 'internal') {
        await popupAPI.complete(popup.id);
        window.location.href = popup.ctaUrl || '/admin';
        return;
      }
      if (popup.ctaAction === 'external') {
        await popupAPI.complete(popup.id);
        window.open(popup.ctaUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (popup.ctaAction === 'close') {
        if (popup.dismissible) {
          await popupAPI.dismiss(popup.id);
          removeItem(popup.id);
        }
      }
    } catch (e) {
      // swallow
    }
  };

  if (loading) return null;

  return (
    <>
      {/* Top banners */}
      {bannersTop.map((p) => (
        <div key={p.id} className="w-full bg-blue-50 text-blue-900 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="prose prose-sm max-w-none">
                <Markdown>{p.message}</Markdown>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CTAButton popup={p} onClick={() => handleCTA(p)} />
              {p.dismissible && (
                <button
                  onClick={async () => { await popupAPI.dismiss(p.id); removeItem(p.id); }}
                  className="text-blue-700 hover:text-blue-900"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{modal.title}</h3>
            <div className="prose max-w-none mb-4">
              <Markdown>{modal.message}</Markdown>
            </div>
            <div className="flex items-center justify-end gap-3">
              {modal.dismissible && (
                <button
                  onClick={async () => { await popupAPI.dismiss(modal.id); removeItem(modal.id); }}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              )}
              <CTAButton popup={modal} onClick={() => handleCTA(modal)} />
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-40 space-y-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} popup={t} onCTA={() => handleCTA(t)} onDismissed={() => removeItem(t.id)} />
        ))}
      </div>

      {/* Bottom banners */}
      {bannersBottom.map((p) => (
        <div key={p.id} className="fixed bottom-0 left-0 right-0 z-30 bg-blue-50 text-blue-900 border-t border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="prose prose-sm max-w-none">
                <Markdown>{p.message}</Markdown>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CTAButton popup={p} onClick={() => handleCTA(p)} />
              {p.dismissible && (
                <button
                  onClick={async () => { await popupAPI.dismiss(p.id); removeItem(p.id); }}
                  className="text-blue-700 hover:text-blue-900"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const ToastItem = ({ popup, onCTA, onDismissed }) => {
  const [visible, setVisible] = useState(true);

  useAutoDismiss(popup.dismissible, 8000, async () => {
    try {
      await popupAPI.dismiss(popup.id);
    } catch {}
    setVisible(false);
    onDismissed?.();
  });

  if (!visible) return null;

  return (
    <div className="w-80 bg-white shadow-lg rounded-md border border-gray-200 p-3">
      <div className="text-sm font-semibold text-gray-900">{popup.title}</div>
      <div className="text-sm text-gray-700 mt-1">
        <Markdown>{popup.message}</Markdown>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3">
        {popup.dismissible && (
          <button
            onClick={async () => { try { await popupAPI.dismiss(popup.id); } catch {}; setVisible(false); onDismissed?.(); }}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Dismiss
          </button>
        )}
        <CTAButton popup={popup} onClick={onCTA} />
      </div>
    </div>
  );
};

export default AdminPopups;
