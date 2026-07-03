import React, { useState, useEffect } from 'react';
import './App.css';

import AuthScreen from './components/AuthScreen';
import IntroScreen from './components/IntroScreen';
import CharacterSelection from './components/CharacterSelection';
import GamePlay from './components/GamePlay';
import ProfileSettings from './components/ProfileSettings';
import MovementScreen from './components/MovementScreen';

export default function App() {
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ikimetsa_session_id') || null);
  const [shouldRestoreSession, setShouldRestoreSession] = useState(
    Boolean(sessionStorage.getItem('ikimetsa_session_id') && sessionStorage.getItem('ikimetsa_session_id') !== 'logged_in')
  );
  const [isHydratingSession, setIsHydratingSession] = useState(Boolean(sessionStorage.getItem('ikimetsa_session_id') && sessionStorage.getItem('ikimetsa_session_id') !== 'logged_in'));
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [savedGameSession, setSavedGameSession] = useState(null);
  const [showProfile, setShowProfile] = useState(sessionStorage.getItem('ikimetsa_show_profile') === 'true');
  const [successMessage, setSuccessMessage] = useState('');

  const [gameStarted, setGameStarted] = useState(false);
  const [characterClasses, setCharacterClasses] = useState([]); 
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');
  
  const [combatLogs, setCombatLogs] = useState([]);
  const [monsterHp, setMonsterHp] = useState(25);
  const [isShaking, setIsShaking] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  
  const [combatInitiative, setCombatInitiative] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);

  const [isNavigating, setIsNavigating] = useState(false);
  const [movementPhase, setMovementPhase] = useState('intro');

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error("Uloskirjautumisvirhe:", e);
    }

    sessionStorage.removeItem('ikimetsa_session_id');
    sessionStorage.removeItem('ikimetsa_show_profile');
    sessionStorage.removeItem('ikimetsa_revealed_monster');
    setSessionId(null);
    setShouldRestoreSession(false);
    setLoggedInUser(null);
    setSavedGameSession(null);
    setActiveSession(null);
    setGameStarted(false);
    setCharacterClasses([]);
    setCombatLogs([]);
    setCombatInitiative(null);
    setCurrentTurn(null);
    setMonsterHp(25);
    setUsernameInput('');
    setPasswordInput('');
    setShowProfile(false);
    setIsNavigating(false);
    setMovementPhase('intro');
  };

  useEffect(() => {
    if (shouldRestoreSession && sessionId) {
      setIsHydratingSession(true);
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Istunto vanhentunut');
          return res.json();
        })
        .then(data => {
          setLoggedInUser(data.username || null);
          if (data.session) {
            setSavedGameSession(data.session);
            setActiveSession(data.session);
            setGameStarted(true);
            setMonsterHp(data.session.currentMonsterHp ?? 25);
            setCombatInitiative(data.session.combatInitiative ?? null);
            setCurrentTurn(data.session.currentTurn ?? null);
            setCombatLogs(data.session.combatLogs || []);
          } else {
            setSavedGameSession(null);
            setActiveSession(null);
            setGameStarted(false);
            setCombatInitiative(null);
            setCurrentTurn(null);
            setMonsterHp(25);
            setCombatLogs([]);
          }
          setShouldRestoreSession(false);
          setIsHydratingSession(false);
        })
        .catch(() => {
          setIsHydratingSession(false);
          handleLogout();
        });
    }
  }, [sessionId, shouldRestoreSession]);

  useEffect(() => {
    if (showProfile) {
      sessionStorage.setItem('ikimetsa_show_profile', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_show_profile');
    }
  }, [showProfile]);

  useEffect(() => {
    if (gameStarted && characterClasses.length === 0 && sessionId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/game/classes`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Hahmoluokkien haku epäonnistui.');
          return res.json();
        })
        .then(data => setCharacterClasses(data))
        .catch(err => setError(err.message));
    }
  }, [gameStarted, sessionId]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = authMode === 'login' ? 'login' : 'register';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Kirjautumisvirhe.');

      sessionStorage.setItem('ikimetsa_session_id', data.gameSessionId || 'logged_in');
      setSessionId(data.gameSessionId || 'logged_in');
      setShouldRestoreSession(false);
      setIsHydratingSession(false);
      setLoggedInUser(data.username);
      setSavedGameSession(data.session || null);
      setActiveSession(null);
      setGameStarted(false);
      setCharacterClasses([]);
      setCombatLogs(data.session?.combatLogs || []);
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(data.session?.currentMonsterHp ?? 25);
    } catch (err) { setError(err.message); }
  };

  const startOrContinueTaival = () => {
    if (savedGameSession) {
      setActiveSession(savedGameSession);
      setMonsterHp(savedGameSession.currentMonsterHp ?? 25);
      setCombatInitiative(savedGameSession.combatInitiative || null);
      setCurrentTurn(savedGameSession.currentTurn || null);
      setCombatLogs(savedGameSession.combatLogs || []);
    }
    setGameStarted(true);
  };

  const selectCharacter = async (className) => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterClassName: className }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Hahmon valinta epäonnistui.');
      
      sessionStorage.setItem('ikimetsa_session_id', data._id);
      setSessionId(data._id);
      setSavedGameSession(data);
      setActiveSession(data);
      
      setIsNavigating(true);
      setMovementPhase('intro');
      
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatLogs([]);
    } catch (err) { setError(err.message); }
  };

  const handleEnterCombat = () => {
    if (activeSession) {
      setMonsterHp(activeSession.currentMonsterHp ?? 25);
    } else {
      setMonsterHp(25);
    }
    setIsNavigating(false);
  };

  const handleRepairWeapon = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/combat/repair-weapon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Korjaus epäonnistui.');
      setActiveSession(data.session);
      setSavedGameSession(data.session);
      setCombatLogs(data.combatLogs || data.session.combatLogs || []);
    } catch (err) { setError(err.message); }
  };

  const handleChangeUsername = async (newUsername, currentPassword) => {
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/username`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername, currentPassword }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Käyttäjätunnuksen vaihto epäonnistui.');
      setLoggedInUser(data.username);
      setSuccessMessage('Käyttäjätunnus vaihdettu onnistuneesti.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;
    } catch (err) { setError(err.message); return false; }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Salasanan vaihto epäonnistui.');
      setSuccessMessage('Salasana vaihdettu onnistuneesti.');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;
    } catch (err) { setError(err.message); return false; }
  };

  const handleDeleteAccount = async (currentPassword) => {
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tilin poisto epäonnistui.');

      setShowProfile(false);
      await handleLogout();
      return true;
    } catch (err) { setError(err.message); return false; }
  };

  const handleCombatTurn = async () => {
    if (isRolling || monsterHp <= 0) return;
    setIsRolling(true);
    setDiceResult(null);
    const interval = setInterval(() => { setDiceResult(Math.floor(Math.random() * 20) + 1); }, 60);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/combat/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hyokkaa' }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Taisteluvuoro epäonnistui.');

      setCombatInitiative(data.initiativeWinner);
      setCurrentTurn(data.nextTurn);
      const nextMonsterHp = data.monsterHp;

      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        const fullCombatLogs = data.combatLogs || [];
        setDiceResult(typeof data.diceRoll === 'number' ? data.diceRoll : 12);
        setCombatLogs(fullCombatLogs);
        setMonsterHp(nextMonsterHp);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        setActiveSession(prev => ({
          ...prev,
          repairPoints: data.repairPoints !== undefined ? data.repairPoints : prev.repairPoints,
          stats: { 
            ...prev.stats, 
            hp: data.playerHp,
            maxHp: data.playerMaxHp !== undefined ? data.playerMaxHp : prev.stats.maxHp,
            level: data.playerLevel !== undefined ? data.playerLevel : prev.stats.level,
            xp: data.playerXp !== undefined ? data.playerXp : prev.stats.xp
          },
          inventory: [{ ...prev.inventory[0], durability: data.weaponDurability }],
          combatLogs: fullCombatLogs,
          currentMonsterHp: nextMonsterHp,
          currentMonsterLevel: prev ? prev.currentMonsterLevel : 1, 
          combatInitiative: data.initiativeWinner,
          currentTurn: data.nextTurn
        }));

        setSavedGameSession(prev => ({
          ...prev,
          stats: prev ? {
            ...prev.stats,
            hp: data.playerHp,
            maxHp: data.playerMaxHp !== undefined ? data.playerMaxHp : prev.stats.maxHp,
            level: data.playerLevel !== undefined ? data.playerLevel : prev.stats.level,
            xp: data.playerXp !== undefined ? data.playerXp : prev.stats.xp
          } : null,
          combatLogs: fullCombatLogs,
          currentMonsterHp: nextMonsterHp,
          currentMonsterLevel: prev ? prev.currentMonsterLevel : 1, 
          combatInitiative: data.initiativeWinner,
          currentTurn: data.nextTurn
        }));

        if (nextMonsterHp <= 0) {
          setCombatInitiative(null);
          setCurrentTurn(null);
        }
      }, 1000);
    } catch (err) { 
      clearInterval(interval); 
      setIsRolling(false); 
      setError('Yhteys palvelimeen katkesi.'); 
    }
  };

  return (
    <div className={`game-container ${isShaking ? 'screen-hit-shake' : ''}`}>
      <div className="dark-forest-bg">
        <div className="blood-moon"></div>
        <div className="fog-layer layer-1"></div>
        <div className="fog-layer layer-2"></div>
      </div>

      {isHydratingSession ? (
        <div className="session-loading-screen">
          <div className="session-loading-card">
            <div className="session-loading-text">Palautetaan taivalta...</div>
          </div>
        </div>
      ) : (
        <>
          {error && <div className="global-error-popup">⚠️ {error}</div>}
          {successMessage && <div className="global-success-popup">✅ {successMessage}</div>}

          {sessionId && (showProfile || (gameStarted && activeSession)) && (
            <div className="top-right-buttons">
              {showProfile ? (
                <button className="profile-top-btn" onClick={() => setShowProfile(false)}>Takaisin peliin</button>
              ) : (
                <button className="profile-top-btn" onClick={() => setShowProfile(true)}>Profiili</button>
              )}
              <button className="logout-top-btn" onClick={handleLogout}>Kirjaudu ulos</button>
            </div>
          )}

          {!sessionId ? (
            <AuthScreen 
              authMode={authMode} setAuthMode={setAuthMode}
              usernameInput={usernameInput} setUsernameInput={setUsernameInput}
              passwordInput={passwordInput} setPasswordInput={setPasswordInput}
              handleAuthSubmit={handleAuthSubmit}
            />
          ) : showProfile ? (
            /* 🌟 KORJAUS: Profiili tarkistetaan nyt IHAN ENSIMMÄISENÄ, jotta se aukeaa aina! */
            <ProfileSettings
              currentUsername={loggedInUser}
              onChangeUsername={handleChangeUsername}
              onChangePassword={handleChangePassword}
              onDeleteAccount={handleDeleteAccount}
            />
          ) : !gameStarted && !activeSession ? (
            <IntroScreen
              hasSavedSession={Boolean(savedGameSession)}
              onStart={startOrContinueTaival}
            />
          ) : gameStarted && !activeSession ? (
            <CharacterSelection characterClasses={characterClasses} selectCharacter={selectCharacter} />
          ) : isNavigating ? (
            <MovementScreen
              activeSession={activeSession}
              handleEnterCombat={handleEnterCombat}
              phase={movementPhase}
              setPhase={setMovementPhase}
            />
          ) : (
            <GamePlay 
              activeSession={activeSession} monsterHp={monsterHp} diceResult={diceResult}
              isRolling={isRolling} combatLogs={combatLogs} combatInitiative={combatInitiative}
              currentTurn={currentTurn} handleRepairWeapon={handleRepairWeapon} handleCombatTurn={handleCombatTurn}
            />
          )}
        </>
      )}
    </div>
  );
}