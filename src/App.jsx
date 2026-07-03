import React, { useState, useEffect } from 'react';
import './App.css';

import AuthScreen from './components/AuthScreen';
import IntroScreen from './components/IntroScreen';
import CharacterSelection from './components/CharacterSelection';
import GamePlay from './components/GamePlay';
import ProfileSettings from './components/ProfileSettings';
import MovementScreen from './components/MovementScreen';
import CampfireScreen from './components/CampfireScreen';
import GraveScreen from './components/GraveScreen';

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

  const [isNavigating, setIsNavigating] = useState(sessionStorage.getItem('ikimetsa_is_navigating') === 'true');
  const [movementPhase, setMovementPhase] = useState(sessionStorage.getItem('ikimetsa_movement_phase') || 'intro');
  const [showVictorySplash, setShowVictorySplash] = useState(false);
  const [showDeathFade, setShowDeathFade] = useState(false);

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
    sessionStorage.removeItem('ikimetsa_victory_splash_shown');
    sessionStorage.removeItem('ikimetsa_death_fade_shown');
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
            setIsNavigating(!data.session.hasEnteredCombat);
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
    if (isNavigating) {
      sessionStorage.setItem('ikimetsa_is_navigating', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_is_navigating');
    }
  }, [isNavigating]);

  useEffect(() => {
    if (isNavigating) {
      sessionStorage.setItem('ikimetsa_movement_phase', movementPhase);
    } else {
      sessionStorage.removeItem('ikimetsa_movement_phase');
    }
  }, [movementPhase, isNavigating]);

  // 🩸 Veriroiske pamahtaa kun hirviö kaatuu - pidetään App-tasolla jotta se säilyy
  // näkyvissä myös silloin kun näkymä vaihtuu taistelusta nuotiolle kesken animaation.
  useEffect(() => {
    if (monsterHp > 0 || !activeSession) return;

    const monsterKey = activeSession?.currentMonsterName || 'Varjohahmo';
    const splashShownFor = sessionStorage.getItem('ikimetsa_victory_splash_shown');
    if (splashShownFor === monsterKey) return; // jo näytetty - kyseessä on F5-päivitys

    setShowVictorySplash(true);
    sessionStorage.setItem('ikimetsa_victory_splash_shown', monsterKey);
    const splashTimer = setTimeout(() => setShowVictorySplash(false), 1700);

    return () => clearTimeout(splashTimer);
  }, [monsterHp, activeSession?.currentMonsterName]);

  // 💀 Multaa roiskuu kun hahmo kuolee - sama App-tason periaate ja tekniikka kuin veriroiskeessa,
  // vain ruskealla/multaisella värityksellä. Ei tarvitse viivästää ruudunvaihtoa, koska tämä on
  // burst-tyylinen efekti (ei "sulkeutuva ympyrä"), joten se toimii kummankin ruudun päällä sellaisenaan.
  useEffect(() => {
    if (!activeSession || activeSession.stats.hp > 0) return;

    const alreadyShown = sessionStorage.getItem('ikimetsa_death_fade_shown');
    if (alreadyShown === 'true') return; // jo näytetty - kyseessä on F5-päivitys

    setShowDeathFade(true);
    sessionStorage.setItem('ikimetsa_death_fade_shown', 'true');
    const fadeTimer = setTimeout(() => setShowDeathFade(false), 1700);

    return () => clearTimeout(fadeTimer);
  }, [activeSession?.stats?.hp]);

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
      setIsNavigating(data.session ? !data.session.hasEnteredCombat : false);
    } catch (err) { setError(err.message); }
  };

  const startOrContinueTaival = () => {
    if (savedGameSession) {
      setActiveSession(savedGameSession);
      setMonsterHp(savedGameSession.currentMonsterHp ?? 25);
      setCombatInitiative(savedGameSession.combatInitiative || null);
      setCurrentTurn(savedGameSession.currentTurn || null);
      setCombatLogs(savedGameSession.combatLogs || []);
      setIsNavigating(!savedGameSession.hasEnteredCombat);
      setMovementPhase('walking'); // jatkava pelaaja ei tarvitse enää alkutarinaa uudelleen
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
      sessionStorage.removeItem('ikimetsa_victory_splash_shown'); // uusi peli - roiske saa näkyä taas
      sessionStorage.removeItem('ikimetsa_death_fade_shown'); // uusi peli - kuolemaefekti saa näkyä taas
      
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatLogs([]);
    } catch (err) { setError(err.message); }
  };

  const handleEnterCombat = async () => {
    if (activeSession) {
      setMonsterHp(activeSession.currentMonsterHp ?? 25);
    } else {
      setMonsterHp(25);
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/enter-combat`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        const updatedStats = {
          hp: data.playerHp,
          maxHp: data.playerMaxHp,
          level: data.playerLevel,
          xp: data.playerXp
        };
        setActiveSession(prev => prev ? { ...prev, hasEnteredCombat: true, stats: { ...prev.stats, ...updatedStats } } : prev);
        setSavedGameSession(prev => prev ? { ...prev, hasEnteredCombat: true, stats: { ...prev.stats, ...updatedStats } } : prev);
        setCombatLogs(data.combatLogs || []);
      } else {
        setActiveSession(prev => prev ? { ...prev, hasEnteredCombat: true } : prev);
        setSavedGameSession(prev => prev ? { ...prev, hasEnteredCombat: true } : prev);
      }
    } catch (e) {
      console.error("Taisteluun siirtymisen tallennus epäonnistui:", e);
      setActiveSession(prev => prev ? { ...prev, hasEnteredCombat: true } : prev);
      setSavedGameSession(prev => prev ? { ...prev, hasEnteredCombat: true } : prev);
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

  // 🔥 Kuolema: palataan viimeisimpään tallennuspisteeseen ja jatketaan liikkumisesta
  const handleRespawn = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/respawn`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tallennuspisteeseen palaaminen epäonnistui.');

      sessionStorage.removeItem('ikimetsa_death_fade_shown'); // seuraava kuolema saa näkyä taas
      setActiveSession(data);
      setSavedGameSession(data);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatInitiative(null);
      setCurrentTurn(null);
      setCombatLogs(data.combatLogs || []);
      setIsNavigating(true);
      setMovementPhase('walking'); // ei tarvitse alkutarinaa uudelleen, hahmo on jo tuttu
    } catch (err) { setError(err.message); }
  };

  // 🔥 Voitto: nuotiolta jatketaan seuraavaan liikkumisruutuun
  const handleContinueJourney = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/continue-journey`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Matkan jatkaminen epäonnistui.');

      setActiveSession(data);
      setSavedGameSession(data);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatInitiative(null);
      setCurrentTurn(null);
      setCombatLogs([]);
      setIsNavigating(true);
      setMovementPhase('walking');
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
          {showVictorySplash && <div className="victory-blood-splash" />}
          {showDeathFade && <div className="death-fade-overlay" />}

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
              handleRepairWeapon={handleRepairWeapon}
            />
          ) : activeSession.stats.hp <= 0 ? (
            <GraveScreen activeSession={activeSession} onContinue={handleRespawn} />
          ) : monsterHp <= 0 ? (
            <CampfireScreen onContinue={handleContinueJourney} />
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