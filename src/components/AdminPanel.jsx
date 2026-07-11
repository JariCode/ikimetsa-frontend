import React, { useState, useEffect } from 'react';
import './AdminStyles.css';
import adminMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

export default function AdminPanel({ onError }) {
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('ikimetsa_admin_tab') || 'users');

  const [users, setUsers] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [characters, setCharacters] = useState([]);
  const [characterForm, setCharacterForm] = useState(null);
  const [characterFormError, setCharacterFormError] = useState('');

  const [monsters, setMonsters] = useState([]);
  const [monsterForm, setMonsterForm] = useState(null);
  const [monsterFormError, setMonsterFormError] = useState('');

  const [pendingAction, setPendingAction] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(adminMusic)
      .then((res) => res.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        if (cancelled) return;
        source = audioContext.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const fadeStep = gainNode.gain.value / 24;
      const fadeInterval = setInterval(() => {
        if (gainNode.gain.value - fadeStep <= 0) {
          gainNode.gain.value = 0;
          if (source) source.stop();
          audioContext.close();
          clearInterval(fadeInterval);
        } else {
          gainNode.gain.value -= fadeStep;
        }
      }, 50);
    };
  }, []);

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

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/characters`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Pelihahmojen haku epäonnistui.');
      setCharacters(data.characters || []);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonsters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/monsters`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Hirviöiden haku epäonnistui.');
      setMonsters(data.monsters || []);
    } catch (err) {
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('ikimetsa_admin_tab', activeTab);
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'characters') fetchCharacters();
    if (activeTab === 'monsters') fetchMonsters();
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

  const openEditCharacterForm = (character) => {
    setCharacterFormError('');
    setCharacterForm({
      _id: character._id,
      name: character.name,
      description: character.description || '',
      baseHp: character.baseHp || '',
      startingWeaponName: character.startingWeapon?.name || '',
      startingWeaponMaxDurability: character.startingWeapon?.maxDurability || '',
      initiativeBonus: character.initiativeBonus ?? '0',
      baseDefense: character.baseDefense ?? '10'
    });
  };

  const closeCharacterForm = () => {
    setCharacterForm(null);
    setCharacterFormError('');
  };

  const handleCharacterFormChange = (field, value) => {
    setCharacterForm(prev => ({ ...prev, [field]: value }));
  };

  const submitCharacterForm = async (e) => {
    e.preventDefault();
    setCharacterFormError('');

    if (!characterForm.baseHp || !characterForm.startingWeaponMaxDurability) {
      setCharacterFormError('HP ja aseen kestävyys ovat pakollisia.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/character/${characterForm._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Pelihahmon tallennus epäonnistui.');

      closeCharacterForm();
      fetchCharacters();
    } catch (err) {
      setCharacterFormError(err.message);
    }
  };

  const openEditMonsterForm = (monster) => {
    setMonsterFormError('');
    setMonsterForm({
      _id: monster._id,
      name: monster.name || '',
      hp: monster.hp || '',
      defense: monster.defense || '',
      attackBonus: monster.attackBonus ?? '0',
      damageMax: monster.damageMax || '',
      xpReward: monster.xpReward || '',
      level: monster.level ?? '1'
    });
  };

  const closeMonsterForm = () => {
    setMonsterForm(null);
    setMonsterFormError('');
  };

  const handleMonsterFormChange = (field, value) => {
    setMonsterForm(prev => ({ ...prev, [field]: value }));
  };

  const submitMonsterForm = async (e) => {
    e.preventDefault();
    setMonsterFormError('');

    if (!monsterForm.hp || !monsterForm.defense || !monsterForm.damageMax || !monsterForm.xpReward) {
      setMonsterFormError('HP, puolustus, max-vahinko ja XP-palkkio ovat pakollisia.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/monster/${monsterForm._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monsterForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Hirviön tallennus epäonnistui.');

      closeMonsterForm();
      fetchMonsters();
    } catch (err) {
      setMonsterFormError(err.message);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('fi-FI', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredLogs = logs.filter(log => {
    if (!logSearch.trim()) return true;
    const q = logSearch.trim().toLowerCase();
    return (log.performedBy || '').toLowerCase() === q || (log.details || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-panel">
      <h1 className="admin-title">Ylläpito</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Käyttäjät</button>
        <button className={`admin-tab ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')}>Pelihahmot</button>
        <button className={`admin-tab ${activeTab === 'monsters' ? 'active' : ''}`} onClick={() => setActiveTab('monsters')}>Hirviöt</button>
        <button className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Loki</button>
      </div>

      {loading && <p className="admin-loading">Ladataan...</p>}

      {activeTab === 'users' && !loading && (
        <div className="admin-users">
          <table className="admin-table">
            <thead>
              <tr><th>Käyttäjä</th><th>Rooli</th><th>Luotu</th><th>Toiminnot</th></tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isSelf = user._id === currentAdminId;
                return (
                  <tr key={user._id} className={isSelf ? 'admin-row-self' : ''}>
                    <td>{user.username}{isSelf && <span className="admin-self-tag"> (sinä)</span>}</td>
                    <td><span className={`admin-role-badge role-${user.role}`}>{user.role === 'user' ? 'Käyttäjä' : 'Admin'}</span></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="admin-actions">
                      {user.role === 'admin' ? (
                        <button className="admin-action-btn" disabled={isSelf} title={isSelf ? 'Et voi alentaa itseäsi' : 'Alenna tavalliseksi käyttäjäksi'} onClick={() => setPendingAction({ type: 'role', userId: user._id, username: user.username, newRole: 'user' })}>Vaihda rooli</button>
                      ) : (
                        <button className="admin-action-btn" onClick={() => setPendingAction({ type: 'role', userId: user._id, username: user.username, newRole: 'admin' })}>Vaihda rooli</button>
                      )}
                      <button className="admin-action-btn admin-action-danger" disabled={isSelf} title={isSelf ? 'Et voi poistaa itseäsi' : 'Poista käyttäjä'} onClick={() => setPendingAction({ type: 'delete', userId: user._id, username: user.username })}>Poista</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'characters' && !loading && (
        <div className="admin-characters">
          {characterForm && (
            <form className="admin-monster-form" onSubmit={submitCharacterForm}>
              <h2>Muokkaa: {characterForm.name}</h2>
              <p className="admin-monster-form-subtitle">Hahmon aloitusarvot, joilla peli alkaa</p>

              <div className="admin-monster-form-grid">
                <label>HP
                  <input type="number" value={characterForm.baseHp} onChange={(e) => handleCharacterFormChange('baseHp', e.target.value)} required />
                </label>
                <label>Aloitebonus
                  <input type="number" value={characterForm.initiativeBonus} onChange={(e) => handleCharacterFormChange('initiativeBonus', e.target.value)} />
                </label>
                <label>Puolustus
                  <input type="number" value={characterForm.baseDefense} onChange={(e) => handleCharacterFormChange('baseDefense', e.target.value)} />
                </label>
                <label>Aseen kestävyys
                  <input type="number" value={characterForm.startingWeaponMaxDurability} onChange={(e) => handleCharacterFormChange('startingWeaponMaxDurability', e.target.value)} required />
                </label>
              </div>

              {characterFormError && <p className="profile-field-error">{characterFormError}</p>}

              <div className="admin-monster-form-buttons">
                <button type="button" className="profile-cancel-btn" onClick={closeCharacterForm}>Peruuta</button>
                <button type="submit" className="auth-submit-btn">Tallenna muutokset</button>
              </div>
            </form>
          )}

          {!characterForm && (
            <table className="admin-table">
              <thead>
                <tr><th>Nimi</th><th>HP</th><th>Aloite</th><th>Puolustus</th><th>Ase</th><th>Toiminnot</th></tr>
              </thead>
              <tbody>
                {characters.map(character => (
                  <tr key={character._id}>
                    <td>{character.name}</td>
                    <td>{character.baseHp}</td>
                    <td>{character.initiativeBonus}</td>
                    <td>{character.baseDefense}</td>
                    <td>{character.startingWeapon?.name}</td>
                    <td className="admin-actions">
                      <button className="admin-action-btn" onClick={() => openEditCharacterForm(character)}>Muokkaa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!characterForm && characters.length === 0 && <p className="admin-loading">Ei pelihahmoja.</p>}
        </div>
      )}

      {activeTab === 'monsters' && !loading && (
        <div className="admin-monsters">
          {monsterForm && (
            <form className="admin-monster-form" onSubmit={submitMonsterForm}>
              <h2>Muokkaa: {monsterForm.name}</h2>
              <div className="admin-monster-form-grid">
                <label>Taso
                  <input type="number" value={monsterForm.level} onChange={(e) => handleMonsterFormChange('level', e.target.value)} />
                </label>
                <label>HP
                  <input type="number" value={monsterForm.hp} onChange={(e) => handleMonsterFormChange('hp', e.target.value)} required />
                </label>
                <label>Puolustus
                  <input type="number" value={monsterForm.defense} onChange={(e) => handleMonsterFormChange('defense', e.target.value)} required />
                </label>
                <label>Hyökkäysbonus
                  <input type="number" value={monsterForm.attackBonus} onChange={(e) => handleMonsterFormChange('attackBonus', e.target.value)} />
                </label>
                <label>Max-vahinko
                  <input type="number" value={monsterForm.damageMax} onChange={(e) => handleMonsterFormChange('damageMax', e.target.value)} required />
                </label>
                <label>XP-palkkio
                  <input type="number" value={monsterForm.xpReward} onChange={(e) => handleMonsterFormChange('xpReward', e.target.value)} required />
                </label>
              </div>

              {monsterFormError && <p className="profile-field-error">{monsterFormError}</p>}

              <div className="admin-monster-form-buttons">
                <button type="button" className="profile-cancel-btn" onClick={closeMonsterForm}>Peruuta</button>
                <button type="submit" className="auth-submit-btn">Tallenna muutokset</button>
              </div>
            </form>
          )}

          {!monsterForm && (
            <table className="admin-table">
              <thead>
                <tr><th>Nimi</th><th>Taso</th><th>HP</th><th>Puolustus</th><th>Max-vah.</th><th>XP</th><th>Toiminnot</th></tr>
              </thead>
              <tbody>
                {monsters.map(monster => (
                  <tr key={monster._id}>
                    <td>{monster.name}</td>
                    <td>{monster.level}</td>
                    <td>{monster.hp}</td>
                    <td>{monster.defense}</td>
                    <td>{monster.damageMax}</td>
                    <td>{monster.xpReward}</td>
                    <td className="admin-actions">
                      <button className="admin-action-btn" onClick={() => openEditMonsterForm(monster)}>Muokkaa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!monsterForm && monsters.length === 0 && <p className="admin-loading">Ei hirviöitä.</p>}
        </div>
      )}

      {activeTab === 'logs' && !loading && (
        <div className="admin-logs">
          <input type="text" className="admin-log-search" placeholder="Suodata käyttäjänimellä tai tekstillä..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
          <div className="admin-log-scroll">
            <table className="admin-table">
              <thead>
                <tr><th>Aika</th><th>Käyttäjä</th><th>Tapahtuma</th></tr>
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
              <button type="button" className="profile-cancel-btn" onClick={() => setPendingAction(null)}>Peruuta</button>
              {pendingAction.type === 'delete' ? (
                <button type="button" className="danger-btn" onClick={confirmDelete}>Vahvista poisto</button>
              ) : (
                <button type="button" className="auth-submit-btn" onClick={confirmRoleChange}>Vahvista</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}