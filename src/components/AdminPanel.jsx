import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

export default function AdminPanel({ onError }) {
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('ikimetsa_admin_tab') || 'users'); // 'users' | 'logs'

  const [users, setUsers] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Vahvistusta odottavat toiminnot: { type: 'role'|'delete', userId, username, newRole? }
  const [pendingAction, setPendingAction] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/users`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Käyttäjien haku epäonnistui.');
      setUsers(data.users || []);
      setCurrentAdminId(data.currentAdminId || null);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/logs`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lokien haku epäonnistui.');
      setLogs(data.logs || []);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('ikimetsa_admin_tab', activeTab);
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const confirmRoleChange = async () => {
    const { userId, newRole } = pendingAction;
    setPendingAction(null);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/user/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Roolin vaihto epäonnistui.');
      fetchUsers();
    } catch (err) {
      if (onError) onError(err.message);
    }
  };

  const confirmDelete = async () => {
    const { userId } = pendingAction;
    setPendingAction(null);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Käyttäjän poisto epäonnistui.');
      fetchUsers();
    } catch (err) {
      if (onError) onError(err.message);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('fi-FI', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Lokien suodatus käyttäjänimihaulla (performedBy tai details sisältää haun)
  const filteredLogs = logs.filter(log => {
    if (!logSearch.trim()) return true;
    const q = logSearch.trim().toLowerCase();
    return (log.performedBy || '').toLowerCase() === q || (log.details || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-panel">
      <h1 className="admin-title">Ylläpito</h1>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Käyttäjät
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Loki
        </button>
      </div>

      {loading && <p className="admin-loading">Ladataan...</p>}

      {activeTab === 'users' && !loading && (
        <div className="admin-users">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Käyttäjä</th>
                <th>Rooli</th>
                <th>Luotu</th>
                <th>Toiminnot</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isSelf = user._id === currentAdminId;
                return (
                  <tr key={user._id} className={isSelf ? 'admin-row-self' : ''}>
                    <td>{user.username}{isSelf && <span className="admin-self-tag"> (sinä)</span>}</td>
                    <td>
                      <span className={`admin-role-badge role-${user.role}`}>
                        {user.role === 'user' ? 'Käyttäjä' : 'Admin'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="admin-actions">
                      {user.role === 'admin' ? (
                        <button
                          className="admin-action-btn"
                          disabled={isSelf}
                          title={isSelf ? 'Et voi alentaa itseäsi' : 'Alenna tavalliseksi käyttäjäksi'}
                          onClick={() => setPendingAction({ type: 'role', userId: user._id, username: user.username, newRole: 'user' })}
                        >
                          Vaihda rooli
                        </button>
                      ) : (
                        <button
                          className="admin-action-btn"
                          onClick={() => setPendingAction({ type: 'role', userId: user._id, username: user.username, newRole: 'admin' })}
                        >
                          Vaihda rooli
                        </button>
                      )}
                      <button
                        className="admin-action-btn admin-action-danger"
                        disabled={isSelf}
                        title={isSelf ? 'Et voi poistaa itseäsi' : 'Poista käyttäjä'}
                        onClick={() => setPendingAction({ type: 'delete', userId: user._id, username: user.username })}
                      >
                        Poista
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && !loading && (
        <div className="admin-logs">
          <input
            type="text"
            className="admin-log-search"
            placeholder="Suodata käyttäjänimellä tai tekstillä..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
          />
          <div className="admin-log-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Aika</th>
                  <th>Käyttäjä</th>
                  <th>Tapahtuma</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log._id}>
                    <td className="admin-log-time">{formatDate(log.createdAt)}</td>
                    <td>{log.performedBy}</td>
                    <td className="admin-log-details">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && <p className="admin-loading">Ei lokimerkintöjä.</p>}
        </div>
      )}

      {/* Vahvistuslaatikko - sama kaava kuin profiilin muokkauksessa */}
      {pendingAction && (
        <div className="admin-confirm-overlay">
          <div className={`profile-confirm-box ${pendingAction.type === 'delete' ? 'profile-confirm-box-danger' : ''}`}>
            <p className="profile-confirm-text">
              {pendingAction.type === 'delete'
                ? `Vahvista: haluatko VARMASTI poistaa käyttäjän "${pendingAction.username}"? Kaikki hänen pelitietonsa katoavat pysyvästi eikä toimintoa voi perua.`
                : pendingAction.newRole === 'admin'
                  ? `Vahvista: haluatko ylentää käyttäjän "${pendingAction.username}" adminiksi?`
                  : `Vahvista: haluatko alentaa käyttäjän "${pendingAction.username}" tavalliseksi käyttäjäksi?`}
            </p>
            <div className="profile-confirm-buttons">
              <button type="button" className="profile-cancel-btn" onClick={() => setPendingAction(null)}>
                Peruuta
              </button>
              {pendingAction.type === 'delete' ? (
                <button type="button" className="danger-btn" onClick={confirmDelete}>
                  Vahvista poisto
                </button>
              ) : (
                <button type="button" className="auth-submit-btn" onClick={confirmRoleChange}>
                  Vahvista
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
