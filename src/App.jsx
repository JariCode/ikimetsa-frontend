import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import AuthScreen from './components/AuthScreen';
import IntroScreen from './components/IntroScreen';
import CharacterSelection from './components/CharacterSelection';
import GamePlay from './components/GamePlay';
import ProfileSettings from './components/ProfileSettings';
import MovementScreen from './components/MovementScreen';
import CampfireScreen from './components/CampfireScreen';
import GraveScreen from './components/GraveScreen';
import VictoryScreen from './components/VictoryScreen';
import CompanionScreen from './components/CompanionScreen';
import WeaponScreen from './components/WeaponScreen';
import TreasureScreen from './components/TreasureScreen';
import AdminPanel from './components/AdminPanel';
import SiteFooter from './components/SiteFooter';

export default function App() {
  const [sessionId, setSessionId] = useState(sessionStorage.getItem('ikimetsa_session_id') || null);
  const [shouldRestoreSession, setShouldRestoreSession] = useState(
    Boolean(sessionStorage.getItem('ikimetsa_session_id'))
  );
  const [isHydratingSession, setIsHydratingSession] = useState(Boolean(sessionStorage.getItem('ikimetsa_session_id') && sessionStorage.getItem('ikimetsa_session_id') !== 'logged_in'));
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 🔐 'admin' näyttää Admin-napin ja -paneelin
  const [showAdmin, setShowAdmin] = useState(sessionStorage.getItem('ikimetsa_show_admin') === 'true');
  const [savedGameSession, setSavedGameSession] = useState(null);
  const [showProfile, setShowProfile] = useState(sessionStorage.getItem('ikimetsa_show_profile') === 'true');
  const [successMessage, setSuccessMessage] = useState('');

  const [gameStarted, setGameStarted] = useState(sessionStorage.getItem('ikimetsa_game_started') === 'true');
  const [characterClasses, setCharacterClasses] = useState([]); 
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!error) return;
    const errorTimer = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(errorTimer);
  }, [error]);
  
  const [gameLogs, setGameLogs] = useState([]);
  const [monsterHp, setMonsterHp] = useState(25);
  const [isShaking, setIsShaking] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isDamageRolling, setIsDamageRolling] = useState(false); // 🎲 Pyörivätkö nimenomaan d8-vahinkonopat (vain osuman jälkeen)
  const [diceResult, setDiceResult] = useState(null);
  const [damageDiceResult, setDamageDiceResult] = useState([null, null]); // 🎲 Kaksi d8-vahinkonoppaa, vierekkäin d20:n kanssa
  const [monsterDamageResult, setMonsterDamageResult] = useState(null); // 🎲 Hirviön yksi vahinkonoppa (kun hirviö osuu pelaajaan tai kumppaniin)
  const [isMonsterDamageRolling, setIsMonsterDamageRolling] = useState(false); // 🎲 Pyöriikö hirviön vahinkonoppa
  
  const [combatInitiative, setCombatInitiative] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);

  const [isNavigating, setIsNavigating] = useState(sessionStorage.getItem('ikimetsa_is_navigating') === 'true');
  const [movementPhase, setMovementPhase] = useState(sessionStorage.getItem('ikimetsa_movement_phase') || 'intro');
  const [showVictorySplash, setShowVictorySplash] = useState(false);
  const [showFinalVictory, setShowFinalVictory] = useState(false); // 👑 Velhon kukistumisen eeppinen siirtymä ennen voittoruutua
  const [showDeathFade, setShowDeathFade] = useState(false);
  const campfireActionInProgressRef = useRef(false);
  const [showCompanionReveal, setShowCompanionReveal] = useState(sessionStorage.getItem('ikimetsa_show_companion_reveal') === 'true');
  const [showWeaponReveal, setShowWeaponReveal] = useState(sessionStorage.getItem('ikimetsa_show_weapon_reveal') === 'true');
  const [showTreasureReveal, setShowTreasureReveal] = useState(sessionStorage.getItem('ikimetsa_show_treasure_reveal') === 'true');
  const [showMovementTransition, setShowMovementTransition] = useState(false); // 🌫️ Usvasiirtymä liikkumisruutuun saavuttaessa
  const [showCompanionTransition, setShowCompanionTransition] = useState(false); // 🕸️ Seitin repeäminen kumppaniruutuun saavuttaessa
  const [showWeaponTransition, setShowWeaponTransition] = useState(false); // ⛏️ Mullan pöllähdys aseruutuun saavuttaessa
  const [showTreasureTransition, setShowTreasureTransition] = useState(false); // 🌊 Vesipärskähdys aarrepussiruutuun saavuttaessa

  // 🌫️ Laukaisee usvasiirtymän joka pyyhkäisee ruudun yli. Kutsutaan VAIN niistä
  // kohdista jotka oikeasti vievät liikkumisruutuun (voitto, respawn, uusi peli,
  // matkan jatko, aseen/kumppanin jälkeen). Sivun päivitys ei kutsu näitä, joten
  // se ei koskaan laukaise siirtymää.
  const triggerMovementTransition = () => {
    setShowMovementTransition(true);
    setTimeout(() => setShowMovementTransition(false), 2000);
  };

  // 🕸️ Seitin repeämissiirtymä kumppaniruutuun saavuttaessa
  const triggerCompanionTransition = () => {
    setShowCompanionTransition(true);
    setTimeout(() => setShowCompanionTransition(false), 2550);
  };

  // ⛏️ Mullan pöllähdyssiirtymä aseruutuun saavuttaessa
  const triggerWeaponTransition = () => {
    setShowWeaponTransition(true);
    setTimeout(() => setShowWeaponTransition(false), 2550);
  };

  // 🌊 Vesipärskähdyssiirtymä aarrepussiruutuun saavuttaessa
  const triggerTreasureTransition = () => {
    setShowTreasureTransition(true);
    setTimeout(() => setShowTreasureTransition(false), 2550);
  };

  const addGameLog = (message, type = 'general') => {
    const newLog = {
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setGameLogs(prevLogs => [...prevLogs, newLog]);
  };

  const persistLogToServer = (message) => {
    const url = `${import.meta.env.VITE_API_URL}/api/game/log-message`;
    const payload = JSON.stringify({ message });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const sent = navigator.sendBeacon(url, blob);
        if (sent) return;
      }
    } catch (e) {
      console.error('sendBeacon epäonnistui, käytetään fetch-varmistusta:', e);
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include'
    }).catch(e => console.error('Lokin tallennus palvelimelle epäonnistui:', e));
  };

  const addPersistentGameLog = (message, type = 'general') => {
    addGameLog(message, type);
    persistLogToServer(message);
  };

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
    sessionStorage.removeItem('ikimetsa_show_admin');
    sessionStorage.removeItem('ikimetsa_admin_tab');
    sessionStorage.removeItem('ikimetsa_profile_tab');
    sessionStorage.removeItem('ikimetsa_death_fade_shown');
    sessionStorage.removeItem('ikimetsa_monster_reveal_shown');
    sessionStorage.removeItem('ikimetsa_show_companion_reveal');
    sessionStorage.removeItem('ikimetsa_show_weapon_reveal');
    sessionStorage.removeItem('ikimetsa_show_treasure_reveal');
    setSessionId(null);
    setShouldRestoreSession(false);
    setLoggedInUser(null);
    setUserRole(null);
    setShowAdmin(false);
    setSavedGameSession(null);
    setActiveSession(null);
    setGameStarted(false);
    setCharacterClasses([]);
    setGameLogs([]);
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
          setUserRole(data.role || null);
          if (data.session) {
            setSavedGameSession(data.session);

            // 🐛 Korjaus: ei automaattisesti hypätä liikkumisruutuun jos
            // pelaaja on vasta katsomassa Intro-ruutua ("Jatka taivalta")
            // eikä ole vielä klikannut jatkaakseen tässä välilehdessä.
            // Sivun päivitys kesken aktiivisen pelin (missä tämä lippu on
            // jo 'true') palauttaa edelleen normaalisti oikeaan kohtaan.
            const alreadyStartedThisTab = sessionStorage.getItem('ikimetsa_game_started') === 'true';

            if (alreadyStartedThisTab) {
              setActiveSession(data.session);
              setGameStarted(true);
              setMonsterHp(data.session.currentMonsterHp ?? 25);
              setCombatInitiative(data.session.combatInitiative ?? null);
              setCurrentTurn(data.session.currentTurn ?? null);
              if (data.session.combatLogs) {
                const restored = data.session.combatLogs.map(msg => ({
                  message: msg,
                  type: 'combat',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }));
                setGameLogs(restored);
              } else {
                setGameLogs([]);
              }
              if (data.session.isGameCompleted) {
                setIsNavigating(true);
              } else {
                setIsNavigating(!data.session.hasEnteredCombat);
              }
            }
          } else {
            setSavedGameSession(null);
            setActiveSession(null);
            setGameStarted(false);
            setCombatInitiative(null);
            setCurrentTurn(null);
            setMonsterHp(25);
            setGameLogs([]);
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
    if (showAdmin) {
      sessionStorage.setItem('ikimetsa_show_admin', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_show_admin');
    }
  }, [showAdmin]);

  useEffect(() => {
    sessionStorage.setItem('ikimetsa_game_started', gameStarted ? 'true' : 'false');
  }, [gameStarted]);

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

  useEffect(() => {
    if (showCompanionReveal) {
      sessionStorage.setItem('ikimetsa_show_companion_reveal', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_show_companion_reveal');
    }
  }, [showCompanionReveal]);

  useEffect(() => {
    if (showWeaponReveal) {
      sessionStorage.setItem('ikimetsa_show_weapon_reveal', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_show_weapon_reveal');
    }
  }, [showWeaponReveal]);

  useEffect(() => {
    if (showTreasureReveal) {
      sessionStorage.setItem('ikimetsa_show_treasure_reveal', 'true');
    } else {
      sessionStorage.removeItem('ikimetsa_show_treasure_reveal');
    }
  }, [showTreasureReveal]);

  const deathFadeHandledRef = React.useRef(false);
  useEffect(() => {
    if (!activeSession || activeSession.stats.hp > 0) return;
    if (deathFadeHandledRef.current) return;

    deathFadeHandledRef.current = true;
    const alreadyShown = sessionStorage.getItem('ikimetsa_death_fade_shown');
    if (alreadyShown === 'true') return;

    sessionStorage.setItem('ikimetsa_death_fade_shown', 'true');
    setShowDeathFade(true);
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
      setUserRole(data.role || null);
      setSavedGameSession(data.session || null);
      setActiveSession(null);
      setGameStarted(false);
      setCharacterClasses([]);
      if (data.session?.combatLogs) {
        const restored = data.session.combatLogs.map(msg => ({
          message: msg,
          type: 'combat',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
        setGameLogs(restored);
      } else {
        setGameLogs([]);
      }
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
      if (savedGameSession.combatLogs) {
        const restored = savedGameSession.combatLogs.map(msg => ({
          message: msg,
          type: 'combat',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
        setGameLogs(restored);
      } else {
        setGameLogs([]);
      }
      if (savedGameSession.isGameCompleted) {
        setIsNavigating(true);
      } else {
        setIsNavigating(!savedGameSession.hasEnteredCombat);
        setMovementPhase('walking');
      }
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
      sessionStorage.removeItem('ikimetsa_death_fade_shown');
      sessionStorage.removeItem('ikimetsa_monster_reveal_shown');
      sessionStorage.removeItem('ikimetsa_show_companion_reveal');
      sessionStorage.removeItem('ikimetsa_show_weapon_reveal');
      sessionStorage.removeItem('ikimetsa_show_treasure_reveal');
      
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setGameLogs([]);
    } catch (err) { setError(err.message); }
  };

  const handleFindCompanion = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/find-companion`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Kumppanin löytäminen epäonnistui.');

      setActiveSession(data);
      setSavedGameSession(data);
      addGameLog(`🧑‍🤝‍🧑 ${data.companionName} liittyy seuraasi.`, 'system');
      triggerCompanionTransition();
      setShowCompanionReveal(true);
    } catch (err) { setError(err.message); }
  };

  const handleContinueAfterCompanion = () => {
    sessionStorage.removeItem('ikimetsa_show_companion_reveal');
    setShowCompanionReveal(false);
    triggerMovementTransition();
  };

  const handleFindWeapon = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/find-weapon`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Aseen löytäminen epäonnistui.');

      setActiveSession(data);
      setSavedGameSession(data);
      addGameLog(`⚔️ Löysit uuden aseen: ${data.inventory?.[0]?.name}!`, 'system');
      triggerWeaponTransition();
      setShowWeaponReveal(true);
    } catch (err) { setError(err.message); }
  };

  const handleContinueAfterWeapon = () => {
    sessionStorage.removeItem('ikimetsa_show_weapon_reveal');
    setShowWeaponReveal(false);
    triggerMovementTransition();
  };

  const handleFindTreasure = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/find-treasure`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Aarrepussin löytäminen epäonnistui.');

      setActiveSession(data);
      setSavedGameSession(data);
      addGameLog(`🎒 Löysit haltijoiden pussin!`, 'system');
      triggerTreasureTransition();
      setShowTreasureReveal(true);
    } catch (err) { setError(err.message); }
  };

  const handleContinueAfterTreasure = () => {
    sessionStorage.removeItem('ikimetsa_show_treasure_reveal');
    setShowTreasureReveal(false);
    triggerMovementTransition();
  };

  const handleEnterCombat = async () => {
    let currentMonster = 'Varjohahmo';
    if (activeSession) {
      setMonsterHp(activeSession.currentMonsterHp ?? 25);
      currentMonster = activeSession.currentMonsterName || 'Varjohahmo';
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
        
        addGameLog(`⚔️ Varjoista astuu esiin raivoisa ${currentMonster}! Valmistaudu taisteluun.`, 'combat');

        if (data.combatLogs && data.combatLogs.length > 0) {
          const latestMsg = data.combatLogs[data.combatLogs.length - 1];
          addGameLog(latestMsg, 'combat');
        }
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

  const handleRepairWeapon = async (target = 'player') => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/combat/repair-weapon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Korjaus epäonnistui.');
      setActiveSession(data.session);
      setSavedGameSession(data.session);
      
      const sourceLogs = data.combatLogs || data.session.combatLogs || [];
      if (sourceLogs.length > 0) {
        addGameLog(sourceLogs[sourceLogs.length - 1], 'system');
      }
    } catch (err) { setError(err.message); }
  };

  const handleRespawn = async () => {
    if (campfireActionInProgressRef.current) return;
    campfireActionInProgressRef.current = true;
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/respawn`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tallennuspisteeseen palaaminen epäonnistui.');

      sessionStorage.removeItem('ikimetsa_death_fade_shown');
      sessionStorage.removeItem('ikimetsa_monster_reveal_shown');
      setActiveSession(data);
      setSavedGameSession(data);
      setMonsterHp(data.currentMonsterHp ?? 25);
      setCombatInitiative(null);
      setCurrentTurn(null);
      
      addGameLog("Heräät uudelleen tallennuspisteeltä. Pimeys korjaa veronsa...", "system");
      
      setIsNavigating(true);
      setMovementPhase('walking');
      triggerMovementTransition();
      campfireActionInProgressRef.current = false;
    } catch (err) { 
      setError(err.message); 
      campfireActionInProgressRef.current = false;
    }
  };

  const handleContinueJourney = async () => {
    if (campfireActionInProgressRef.current) return;
    campfireActionInProgressRef.current = true;
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
      
      if (data.isGameCompleted) {
        setIsNavigating(true);
      } else {
        addGameLog("Jatkat matkaasi syvemmälle Ikimetsän varjoihin.", "movement");
        setIsNavigating(true);
        setMovementPhase('walking');
        triggerMovementTransition();
      }
      campfireActionInProgressRef.current = false;
    } catch (err) { 
      setError(err.message); 
      campfireActionInProgressRef.current = false;
    }
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
      setUserRole(data.role || null);
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
    setIsDamageRolling(false);
    setIsMonsterDamageRolling(false);
    setDiceResult(null);
    setDamageDiceResult([null, null]);
    setMonsterDamageResult(null);

    // 🎲 Vain iso d20 pyörii aluksi - vahinkonopat eivät pyöri ollenkaan
    // ennen kuin tiedetään osuiko isku, koska niitä ei edes heitetä ellei osuttu.
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 20) + 1);
    }, 60);

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

      // 📦 Kaikki taisteluvuoron jälkeiset päivitykset (lokit, sessio, jne.) koottuna
      // yhteen funktioon, jotta niitä voi kutsua joko heti (kun ei osunut) tai
      // vasta vahinkonopkien lyhyen pyörähdyksen jälkeen (kun osui).
      const applyTurnResult = () => {
        const fullCombatLogs = data.combatLogs || [];

        if (data.newLogs && data.newLogs.length > 0) {
          data.newLogs.forEach(msg => {
            addGameLog(msg, 'combat');
          });
        }

        setMonsterHp(nextMonsterHp);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        // 👑 LOPPUVOITTO (Velho kaatui): näytetään näyttävä monivaiheinen siirtymä
        // ennen kuin voittoruutu paljastuu, jottei loppu pompsahda yhtäkkiä esiin.
        const isFinalVictory = nextMonsterHp <= 0 && data.isGameCompleted;

        if (nextMonsterHp <= 0 && !isFinalVictory) {
          setShowVictorySplash(true);
          setTimeout(() => setShowVictorySplash(false), 1700);
        }

        if (isFinalVictory) {
          setShowFinalVictory(true);
        }

        setActiveSession(prev => ({
          ...prev,
          // 👑 Loppuvoitossa EI aseteta isGameCompletedia vielä - se tehdään vasta
          // siirtymäanimaation jälkeen, jotta VictoryScreen ei paljastu liian aikaisin.
          isGameCompleted: isFinalVictory ? prev.isGameCompleted : (data.isGameCompleted !== undefined ? data.isGameCompleted : prev.isGameCompleted),
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
          currentTurn: data.nextTurn,
          companionActive: data.companionActive !== undefined ? data.companionActive : prev.companionActive,
          companionHp: data.companionHp !== undefined ? data.companionHp : prev.companionHp,
          companionMaxHp: data.companionMaxHp !== undefined ? data.companionMaxHp : prev.companionMaxHp,
          companionName: data.companionName !== undefined ? data.companionName : prev.companionName,
          companionWeaponName: data.companionWeaponName !== undefined ? data.companionWeaponName : prev.companionWeaponName,
          companionWeaponDurability: data.companionWeaponDurability !== undefined ? data.companionWeaponDurability : prev.companionWeaponDurability,
          companionWeaponMaxDurability: data.companionWeaponMaxDurability !== undefined ? data.companionWeaponMaxDurability : prev.companionWeaponMaxDurability
        }));

        setSavedGameSession(prev => ({
          ...prev,
          isGameCompleted: isFinalVictory ? (prev ? prev.isGameCompleted : false) : (data.isGameCompleted !== undefined ? data.isGameCompleted : (prev ? prev.isGameCompleted : false)),
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
          currentTurn: data.nextTurn,
          companionActive: data.companionActive !== undefined ? data.companionActive : (prev ? prev.companionActive : false),
          companionHp: data.companionHp !== undefined ? data.companionHp : (prev ? prev.companionHp : 0),
          companionMaxHp: data.companionMaxHp !== undefined ? data.companionMaxHp : (prev ? prev.companionMaxHp : 0),
          companionName: data.companionName !== undefined ? data.companionName : (prev ? prev.companionName : null),
          companionWeaponName: data.companionWeaponName !== undefined ? data.companionWeaponName : (prev ? prev.companionWeaponName : null),
          companionWeaponDurability: data.companionWeaponDurability !== undefined ? data.companionWeaponDurability : (prev ? prev.companionWeaponDurability : 0),
          companionWeaponMaxDurability: data.companionWeaponMaxDurability !== undefined ? data.companionWeaponMaxDurability : (prev ? prev.companionWeaponMaxDurability : 0)
        }));

        if (isFinalVictory) {
          // 👑 Näyttävä siirtymä soi ~4.5s, minkä jälkeen paljastetaan voittoruutu
          setTimeout(() => {
            setShowFinalVictory(false);
            setActiveSession(prev => prev ? { ...prev, isGameCompleted: true } : prev);
            setSavedGameSession(prev => prev ? { ...prev, isGameCompleted: true } : prev);
            setIsNavigating(true);
            setCombatInitiative(null);
            setCurrentTurn(null);
          }, 4500);
        } else if (data.isGameCompleted) {
          setIsNavigating(true);
        }

        if (nextMonsterHp <= 0 && !isFinalVictory) {
          setCombatInitiative(null);
          setCurrentTurn(null);
        }
      };

      setTimeout(() => {
        clearInterval(interval);
        setDiceResult(typeof data.diceRoll === 'number' ? data.diceRoll : 12);

        const isHit = typeof data.damageDie1 === 'number';
        const isMonsterHit = typeof data.monsterDamageDie === 'number';

        if (isHit) {
          // 🎲 Pelaaja osui! Pyöräytetään siniset d8-vahinkonopat lyhyesti ennen kuin ne
          // pysähtyvät oikeisiin lukuihin - d20 on jo pysähtynyt tässä vaiheessa.
          setIsDamageRolling(true);
          const damageInterval = setInterval(() => {
            setDamageDiceResult([Math.floor(Math.random() * 8) + 1, Math.floor(Math.random() * 8) + 1]);
          }, 60);

          setTimeout(() => {
            clearInterval(damageInterval);
            setIsRolling(false);
            setIsDamageRolling(false);
            setDamageDiceResult([data.damageDie1, data.damageDie2]);
            applyTurnResult();
          }, 500);
        } else if (isMonsterHit) {
          // 🎲 Hirviö osui pelaajaan tai kumppaniin! Pyöräytetään hirviön oma punainen
          // vahinkonoppa samaan tapaan kuin pelaajalla, d20:n pysähdyttyä.
          setIsMonsterDamageRolling(true);
          const monsterDamageInterval = setInterval(() => {
            setMonsterDamageResult(Math.floor(Math.random() * 8) + 1);
          }, 60);

          setTimeout(() => {
            clearInterval(monsterDamageInterval);
            setIsRolling(false);
            setIsMonsterDamageRolling(false);
            setMonsterDamageResult(data.monsterDamageDie);
            applyTurnResult();
          }, 500);
        } else {
          setIsRolling(false);
          setIsDamageRolling(false);
          setIsMonsterDamageRolling(false);
          setDamageDiceResult([null, null]);
          applyTurnResult();
        }
      }, 1000);
    } catch (err) { 
      clearInterval(interval); 
      setIsRolling(false); 
      setIsDamageRolling(false);
      setIsMonsterDamageRolling(false);
      setError('Yhteys palvelimeen katkesi.'); 
    }
  };

  return (
    <div className={`game-container ${isShaking ? 'screen-hit-shake' : ''}`}>
      <div className="dark-forest-bg">
        {!activeSession?.isGameCompleted && (
          <>
            <div className="blood-moon"></div>
            <div className="fog-layer layer-1"></div>
            <div className="fog-layer layer-2"></div>
          </>
        )}
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
          {showFinalVictory && (
            <div className="final-victory-overlay">
              <div className="final-victory-flash" />
              <div className="final-victory-shards">
                <span className="shard s1"></span>
                <span className="shard s2"></span>
                <span className="shard s3"></span>
                <span className="shard s4"></span>
                <span className="shard s5"></span>
                <span className="shard s6"></span>
                <span className="shard s7"></span>
                <span className="shard s8"></span>
              </div>
              <div className="final-victory-text">Kirous murtuu...</div>
            </div>
          )}
          {showDeathFade && <div className="death-fade-overlay" />}
          {showMovementTransition && (
            <div className="movement-transition-overlay">
              <div className="movement-fog fog-a"></div>
              <div className="movement-fog fog-b"></div>
            </div>
          )}
          {showCompanionTransition && (
            <div className="companion-transition-overlay">
              <div className="web-tear web-left"></div>
              <div className="web-tear web-right"></div>
              <div className="web-strand ws1"></div>
              <div className="web-strand ws2"></div>
              <div className="web-strand ws3"></div>
              <div className="web-strand ws4"></div>
              <div className="web-strand ws5"></div>
            </div>
          )}
          {showWeaponTransition && (
            <div className="weapon-transition-overlay">
              <div className="dirt-burst"></div>
              <div className="dirt-clod dc1"></div>
              <div className="dirt-clod dc2"></div>
              <div className="dirt-clod dc3"></div>
              <div className="dirt-clod dc4"></div>
              <div className="dirt-clod dc5"></div>
              <div className="dirt-clod dc6"></div>
            </div>
          )}
          {showTreasureTransition && (
            <div className="treasure-transition-overlay">
              <div className="water-splash"></div>
              <div className="water-droplet wd1"></div>
              <div className="water-droplet wd2"></div>
              <div className="water-droplet wd3"></div>
              <div className="water-droplet wd4"></div>
              <div className="water-droplet wd5"></div>
              <div className="water-droplet wd6"></div>
              <div className="water-wave"></div>
            </div>
          )}

          {sessionId && (
            <div className="top-right-buttons">
              {showProfile ? (
                <>
                  <button className="profile-top-btn" onClick={() => { setShowProfile(false); }}>Ikimetsä</button>
                  {userRole === 'admin' && (
                    <button className="profile-top-btn" onClick={() => { setShowProfile(false); setShowAdmin(true); }}>Ylläpito</button>
                  )}
                </>
              ) : showAdmin ? (
                <>
                  <button className="profile-top-btn" onClick={() => { setShowAdmin(false); }}>Ikimetsä</button>
                  <button className="profile-top-btn" onClick={() => { setShowAdmin(false); setShowProfile(true); }}>Profiili</button>
                </>
              ) : (
                <>
                  <button className="profile-top-btn" onClick={() => setShowProfile(true)}>Profiili</button>
                  {userRole === 'admin' && (
                    <button className="profile-top-btn" onClick={() => setShowAdmin(true)}>Ylläpito</button>
                  )}
                </>
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
          ) : showAdmin ? (
            <AdminPanel onError={setError} />
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
          ) : activeSession?.isGameCompleted ? (
            <VictoryScreen activeSession={activeSession} handleLogout={handleLogout} />
          ) : activeSession.stats.hp <= 0 ? (
            <GraveScreen activeSession={activeSession} onContinue={handleRespawn} />
          ) : showCompanionReveal ? (
            <CompanionScreen activeSession={activeSession} onContinue={handleContinueAfterCompanion} />
          ) : showWeaponReveal ? (
            <WeaponScreen activeSession={activeSession} onContinue={handleContinueAfterWeapon} />
          ) : showTreasureReveal ? (
            <TreasureScreen activeSession={activeSession} onContinue={handleContinueAfterTreasure} />
          ) : isNavigating ? (
            <MovementScreen
              activeSession={activeSession}
              handleEnterCombat={handleEnterCombat}
              onFindCompanion={handleFindCompanion}
              onFindWeapon={handleFindWeapon}
              onFindTreasure={handleFindTreasure}
              phase={movementPhase}
              setPhase={setMovementPhase}
              handleRepairWeapon={handleRepairWeapon}
              gameLogs={gameLogs}
              onAddLog={addPersistentGameLog}
              triggerTransition={triggerMovementTransition}
            />
          ) : (monsterHp <= 0 && !showFinalVictory) ? (
            <CampfireScreen onContinue={handleContinueJourney} />
          ) : (
            <GamePlay 
              activeSession={activeSession} monsterHp={monsterHp} diceResult={diceResult} damageDiceResult={damageDiceResult}
              monsterDamageResult={monsterDamageResult} isMonsterDamageRolling={isMonsterDamageRolling}
              isRolling={isRolling} isDamageRolling={isDamageRolling} gameLogs={gameLogs} onAddLog={addGameLog} combatInitiative={combatInitiative}
              currentTurn={currentTurn} handleRepairWeapon={handleRepairWeapon} handleCombatTurn={handleCombatTurn}
            />
          )}
        </>
      )}
      <SiteFooter />
    </div>
  );
}