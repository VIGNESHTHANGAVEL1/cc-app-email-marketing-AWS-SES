import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUnsubscribeStatus, unsubscribe } from '../services/api';

export default function Unsubscribe() {
  const { token } = useParams();
  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnsubscribeStatus(token)
      .then((res) => {
        setStatus(res.data.data);
        if (res.data.data.isUnsubscribed) setDone(true);
      })
      .catch(() => setError('Invalid unsubscribe link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    try {
      await unsubscribe(token, reason);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unsubscribe');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-red-600">{error}</h1>
          </>
        ) : done ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold">Unsubscribed Successfully</h1>
            <p className="text-gray-500 mt-2">
              {status?.email} has been removed from our mailing list.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-2">Unsubscribe</h1>
            <p className="text-gray-500 mb-6">
              Are you sure you want to unsubscribe <strong>{status?.email}</strong>?
            </p>
            <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
              <div>
                <label className="label">Reason (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us why you're unsubscribing..."
                />
              </div>
              <button type="submit" className="btn-danger w-full">
                Confirm Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
