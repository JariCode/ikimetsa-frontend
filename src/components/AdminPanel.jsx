import React, { useState, useEffect } from 'react';
import './AdminStyles.css';
import adminMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

export default function AdminPanel({ onError }) {
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('ikimetsa_admin_tab') || 'users'); // 'users' | 'logs' | 'monsters' | 'areas'

  const [users, setUsers] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // 🐺 Hirviöiden hallinta
  const [monsters, setMonsters] = useState([]);
  const [monsterForm, setMonsterForm] = useState(null); // null = lomake kiinni, muuten { ...kentät, _id? }
  const [monsterFormError, setMonsterFormError] = useState('');

  // 🗺️ Alueiden hallinta
  const [areas, setAreas] = useState([]);
  const [areaForm, setAreaForm] = useState(null);
  const [areaFormError, setAreaFormError] = useState('');

  // Vahvistusta odottavat toiminnot: { type: 'role'|'delete', userId, username, newRole? }
  const [pendingAction, setPendingAction] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  // 🎵 Taustamusiikki soi koko sen ajan kun Admin-paneeli on auki, ja
  // häivytetään pois kun se poistuu (takaisin peliin / uloskirjautuminen).
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

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/areas`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Alueiden haku epäonnistui.');
      setAreas(data.areas || []);
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
    if (activeTab === 'monsters') fetchMonsters();
    if (activeTab === 'areas') fetchAreas();
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

  // --- HIRVIÖIDEN CRUD-TOIMINNOT ---

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
      cssClass: monster.cssClass || '',
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

    if (!monsterForm.name.trim() || !monsterForm.hp || !monsterForm.defense || !monsterForm.damageMax || !monsterForm.xpReward) {
      setMonsterFormError('Nimi, HP, puolustus, max-vahinko ja XP-palkkio ovat pakollisia.');
      return;
    }

    const url = `${apiUrl}/api/auth/admin/monster/${monsterForm._id}`;

    try {
      const res = await fetch(url, {
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

  // --- ALUEIDEN CRUD-TOIMINNOT ---

  const openEditAreaForm = (area) => {
    setAreaFormError('');
    setAreaForm({
      _id: area._id,
      order: area.order,
      name: area.name || '',
      locationLabel: area.locationLabel || '',
      monsterName: area.monsterName || '',
      encounterText: area.encounterText || '',
      backgroundClass: area.backgroundClass || '',
      mechanic: area.mechanic || 'normal',
      companionEvent: {
        name: area.companionEvent?.name || '',
        discoveryText: area.companionEvent?.discoveryText || '',
        weaponName: area.companionEvent?.weaponName || ''
      },
      weaponEvent: {
        discoveryText: area.weaponEvent?.discoveryText || '',
        hunterWeaponName: area.weaponEvent?.hunterWeaponName || '',
        mechanicWeaponName: area.weaponEvent?.mechanicWeaponName || '',
        thiefWeaponName: area.weaponEvent?.thiefWeaponName || '',
        strongmanWeaponName: area.weaponEvent?.strongmanWeaponName || '',
        damageBonus: area.weaponEvent?.damageBonus ?? 0
      },
      treasureEvent: {
        discoveryText: area.treasureEvent?.discoveryText || '',
        repairPointsBonus: area.treasureEvent?.repairPointsBonus ?? 0,
        maxHpBonus: area.treasureEvent?.maxHpBonus ?? 0
      },
      goodRollTexts: area.goodRollTexts && area.goodRollTexts.length ? [...area.goodRollTexts] : [''],
      badRollTexts: area.badRollTexts && area.badRollTexts.length ? [...area.badRollTexts] : ['']
    });
  };

  const closeAreaForm = () => {
    setAreaForm(null);
    setAreaFormError('');
  };

  const handleAreaFieldChange = (field, value) => {
    setAreaForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAreaNestedChange = (section, field, value) => {
    setAreaForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleAreaListChange = (listName, index, value) => {
    setAreaForm(prev => {
      const updated = [...prev[listName]];
      updated[index] = value;
      return { ...prev, [listName]: updated };
    });
  };

  const addAreaListRow = (listName) => {
    setAreaForm(prev => ({ ...prev, [listName]: [...prev[listName], ''] }));
  };

  const removeAreaListRow = (listName, index) => {
    setAreaForm(prev => {
      const updated = prev[listName].filter((_, i) => i !== index);
      return { ...prev, [listName]: updated.length ? updated : [''] };
    });
  };

  const submitAreaForm = async (e) => {
    e.preventDefault();
    setAreaFormError('');

    if (!areaForm.name.trim() || !areaForm.locationLabel.trim() || !areaForm.monsterName.trim() || !areaForm.encounterText.trim()) {
      setAreaFormError('Nimi, sijaintiteksti, hirviön nimi ja kohtaamisteksti ovat pakollisia.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/admin/area/${areaForm._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Alueen tallennus epäonnistui.');

      closeAreaForm();
      fetchAreas();
    } catch (err) {
      setAreaFormError(err.message);
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
          className={`admin-tab ${activeTab === 'monsters' ? 'active' : ''}`}
          onClick={() => setActiveTab('monsters')}
        >
          Hirviöt
        </button>
        <button
          className={`admin-tab ${activeTab === 'areas' ? 'active' : ''}`}
          onClick={() => setActiveTab('areas')}
        >
          Alueet
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

      {activeTab === 'monsters' && !loading && (
        <div className="admin-monsters">
          {monsterForm && (
            <form className="admin-monster-form" onSubmit={submitMonsterForm}>
              <h2>Muokkaa: {monsterForm.name}</h2>
              <div className="admin-monster-form-grid">
                <label>
                  Nimi
                  <input
                    type="text"
                    value={monsterForm.name}
                    onChange={(e) => handleMonsterFormChange('name', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Taso
                  <input
                    type="number"
                    value={monsterForm.level}
                    onChange={(e) => handleMonsterFormChange('level', e.target.value)}
                  />
                </label>
                <label>
                  HP
                  <input
                    type="number"
                    value={monsterForm.hp}
                    onChange={(e) => handleMonsterFormChange('hp', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Puolustus
                  <input
                    type="number"
                    value={monsterForm.defense}
                    onChange={(e) => handleMonsterFormChange('defense', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Hyökkäysbonus
                  <input
                    type="number"
                    value={monsterForm.attackBonus}
                    onChange={(e) => handleMonsterFormChange('attackBonus', e.target.value)}
                  />
                </label>
                <label>
                  Max-vahinko
                  <input
                    type="number"
                    value={monsterForm.damageMax}
                    onChange={(e) => handleMonsterFormChange('damageMax', e.target.value)}
                    required
                  />
                </label>
                <label>
                  XP-palkkio
                  <input
                    type="number"
                    value={monsterForm.xpReward}
                    onChange={(e) => handleMonsterFormChange('xpReward', e.target.value)}
                    required
                  />
                </label>
              </div>

              {monsterFormError && <p className="profile-field-error">{monsterFormError}</p>}

              <div className="admin-monster-form-buttons">
                <button type="button" className="profile-cancel-btn" onClick={closeMonsterForm}>
                  Peruuta
                </button>
                <button type="submit" className="auth-submit-btn">
                  Tallenna muutokset
                </button>
              </div>
            </form>
          )}

          {!monsterForm && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nimi</th>
                  <th>Taso</th>
                  <th>HP</th>
                  <th>Puolustus</th>
                  <th>Max-vah.</th>
                  <th>XP</th>
                  <th>Toiminnot</th>
                </tr>
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
                      <button className="admin-action-btn" onClick={() => openEditMonsterForm(monster)}>
                        Muokkaa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!monsterForm && monsters.length === 0 && <p className="admin-loading">Ei hirviöitä.</p>}
        </div>
      )}

      {activeTab === 'areas' && !loading && (
        <div className="admin-areas">
          {areaForm && (
            <form className="admin-area-form" onSubmit={submitAreaForm}>
              <h2>Muokkaa aluetta {areaForm.order}: {areaForm.name}</h2>

              <div className="admin-monster-form-grid">
                <label>
                  Nimi
                  <input
                    type="text"
                    value={areaForm.name}
                    onChange={(e) => handleAreaFieldChange('name', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Sijaintiteksti
                  <input
                    type="text"
                    value={areaForm.locationLabel}
                    onChange={(e) => handleAreaFieldChange('locationLabel', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Hirviön nimi
                  <input
                    type="text"
                    value={areaForm.monsterName}
                    onChange={(e) => handleAreaFieldChange('monsterName', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Tausta-CSS-luokka
                  <input
                    type="text"
                    value={areaForm.backgroundClass}
                    onChange={(e) => handleAreaFieldChange('backgroundClass', e.target.value)}
                  />
                </label>
              </div>

              <label className="admin-area-textarea-label">
                Kohtaamisteksti (taistelun alkaessa)
                <textarea
                  value={areaForm.encounterText}
                  onChange={(e) => handleAreaFieldChange('encounterText', e.target.value)}
                  rows={3}
                  required
                />
              </label>

              <h3>Kumppanin löytötapahtuma</h3>
              <div className="admin-monster-form-grid">
                <label>
                  Kumppanin nimi
                  <input
                    type="text"
                    value={areaForm.companionEvent.name}
                    onChange={(e) => handleAreaNestedChange('companionEvent', 'name', e.target.value)}
                  />
                </label>
                <label>
                  Kumppanin aseen nimi
                  <input
                    type="text"
                    value={areaForm.companionEvent.weaponName}
                    onChange={(e) => handleAreaNestedChange('companionEvent', 'weaponName', e.target.value)}
                  />
                </label>
              </div>
              <label className="admin-area-textarea-label">
                Kumppanin löytöteksti
                <textarea
                  value={areaForm.companionEvent.discoveryText}
                  onChange={(e) => handleAreaNestedChange('companionEvent', 'discoveryText', e.target.value)}
                  rows={2}
                />
              </label>

              <h3>Aseen löytötapahtuma</h3>
              <div className="admin-monster-form-grid">
                <label>
                  Metsästäjän aseen nimi
                  <input
                    type="text"
                    value={areaForm.weaponEvent.hunterWeaponName}
                    onChange={(e) => handleAreaNestedChange('weaponEvent', 'hunterWeaponName', e.target.value)}
                  />
                </label>
                <label>
                  Mekaanikon aseen nimi
                  <input
                    type="text"
                    value={areaForm.weaponEvent.mechanicWeaponName}
                    onChange={(e) => handleAreaNestedChange('weaponEvent', 'mechanicWeaponName', e.target.value)}
                  />
                </label>
                <label>
                  Varkaan aseen nimi
                  <input
                    type="text"
                    value={areaForm.weaponEvent.thiefWeaponName}
                    onChange={(e) => handleAreaNestedChange('weaponEvent', 'thiefWeaponName', e.target.value)}
                  />
                </label>
                <label>
                  Bodarin aseen nimi
                  <input
                    type="text"
                    value={areaForm.weaponEvent.strongmanWeaponName}
                    onChange={(e) => handleAreaNestedChange('weaponEvent', 'strongmanWeaponName', e.target.value)}
                  />
                </label>
                <label>
                  Vahinkobonus (kaikille sama)
                  <input
                    type="number"
                    value={areaForm.weaponEvent.damageBonus}
                    onChange={(e) => handleAreaNestedChange('weaponEvent', 'damageBonus', e.target.value)}
                  />
                </label>
              </div>
              <label className="admin-area-textarea-label">
                Aseen löytöteksti
                <textarea
                  value={areaForm.weaponEvent.discoveryText}
                  onChange={(e) => handleAreaNestedChange('weaponEvent', 'discoveryText', e.target.value)}
                  rows={2}
                />
              </label>

              <h3>Aarteen löytötapahtuma</h3>
              <div className="admin-monster-form-grid">
                <label>
                  Korjauspisteiden bonus
                  <input
                    type="number"
                    value={areaForm.treasureEvent.repairPointsBonus}
                    onChange={(e) => handleAreaNestedChange('treasureEvent', 'repairPointsBonus', e.target.value)}
                  />
                </label>
                <label>
                  Max-HP-bonus
                  <input
                    type="number"
                    value={areaForm.treasureEvent.maxHpBonus}
                    onChange={(e) => handleAreaNestedChange('treasureEvent', 'maxHpBonus', e.target.value)}
                  />
                </label>
              </div>
              <label className="admin-area-textarea-label">
                Aarteen löytöteksti
                <textarea
                  value={areaForm.treasureEvent.discoveryText}
                  onChange={(e) => handleAreaNestedChange('treasureEvent', 'discoveryText', e.target.value)}
                  rows={2}
                />
              </label>

              <h3>Hyvän heiton tekstit (3-5)</h3>
              {areaForm.goodRollTexts.map((text, i) => (
                <div className="admin-area-list-row" key={`good-${i}`}>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleAreaListChange('goodRollTexts', i, e.target.value)}
                  />
                  <button type="button" className="admin-action-btn admin-action-danger" onClick={() => removeAreaListRow('goodRollTexts', i)}>
                    Poista rivi
                  </button>
                </div>
              ))}
              <button type="button" className="admin-action-btn" onClick={() => addAreaListRow('goodRollTexts')}>
                + Lisää rivi
              </button>

              <h3>Huonon heiton tekstit (1-2)</h3>
              {areaForm.badRollTexts.map((text, i) => (
                <div className="admin-area-list-row" key={`bad-${i}`}>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleAreaListChange('badRollTexts', i, e.target.value)}
                  />
                  <button type="button" className="admin-action-btn admin-action-danger" onClick={() => removeAreaListRow('badRollTexts', i)}>
                    Poista rivi
                  </button>
                </div>
              ))}
              <button type="button" className="admin-action-btn" onClick={() => addAreaListRow('badRollTexts')}>
                + Lisää rivi
              </button>

              {areaFormError && <p className="profile-field-error">{areaFormError}</p>}

              <div className="admin-monster-form-buttons">
                <button type="button" className="profile-cancel-btn" onClick={closeAreaForm}>
                  Peruuta
                </button>
                <button type="submit" className="auth-submit-btn">
                  Tallenna muutokset
                </button>
              </div>
            </form>
          )}

          {!areaForm && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nimi</th>
                  <th>Hirviö</th>
                  <th>Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {areas.map(area => (
                  <tr key={area._id}>
                    <td>{area.order}</td>
                    <td>{area.name}</td>
                    <td>{area.monsterName}</td>
                    <td className="admin-actions">
                      <button className="admin-action-btn" onClick={() => openEditAreaForm(area)}>
                        Muokkaa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!areaForm && areas.length === 0 && <p className="admin-loading">Ei alueita.</p>}
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
