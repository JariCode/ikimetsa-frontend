import React, { useState, useEffect } from 'react';
import './App.css';

// Poistettu .jsx päätteet jotta kääntäjä ei kaadu tiedostojen etsintään
import AuthScreen from './components/AuthScreen';
import IntroScreen from './components/IntroScreen';
import CharacterSelection from './components/CharacterSelection';
import GamePlay from './components/GamePlay';

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

      if (authMode === 'register') {
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
        setPasswordInput('');
      } else {
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
      }
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
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatLogs(data.combatLogs || []);
    } catch (err) { setError(err.message); }
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
        const foundRoll = data.combatLogs?.find(l => l.includes('Heitit') || l.includes('heittää'))?.match(/\d+/)?.[0];
        setDiceResult(foundRoll ? parseInt(foundRoll) : 12);
        setCombatLogs(fullCombatLogs);
        setMonsterHp(nextMonsterHp);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        setActiveSession(prev => ({
          ...prev,
          repairPoints: data.repairPoints !== undefined ? data.repairPoints : prev.repairPoints,
          stats: { ...prev.stats, hp: data.playerHp },
          inventory: [{ ...prev.inventory[0], durability: data.weaponDurability }],
          combatLogs: fullCombatLogs,
          currentMonsterHp: nextMonsterHp,
          combatInitiative: data.initiativeWinner,
          currentTurn: data.nextTurn
        }));

        setSavedGameSession(prev => ({
          ...prev,
          combatLogs: fullCombatLogs,
          currentMonsterHp: nextMonsterHp,
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

          {sessionId && (
            <button className="logout-top-btn" onClick={handleLogout}>Kirjaudu ulos</button>
          )}

          {!sessionId ? (
            <AuthScreen 
              authMode={authMode} setAuthMode={setAuthMode}
              usernameInput={usernameInput} setUsernameInput={setUsernameInput}
              passwordInput={passwordInput} setPasswordInput={setPasswordInput}
              handleAuthSubmit={handleAuthSubmit}
            />
          ) : !gameStarted && !activeSession ? (
            <IntroScreen
              hasSavedSession={Boolean(savedGameSession)}
              onStart={startOrContinueTaival}
            />
          ) : gameStarted && !activeSession ? (
            <CharacterSelection characterClasses={characterClasses} selectCharacter={selectCharacter} />
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