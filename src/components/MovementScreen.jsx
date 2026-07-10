import React, { useState, useEffect, useRef } from 'react';
import characterSelectMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';
import walkingMusic from '../assets/audio/music/everything_is_dead-scary-horror-516341.mp3';
import './MovementStyles.css';
import GameLogComponent from './GameLogComponent';

export default function MovementScreen({
  activeSession,
  handleEnterCombat,
  onFindCompanion,
  onFindWeapon,
  onFindTreasure,
  phase,
  setPhase,
  handleRepairWeapon,
  gameLogs,
  onAddLog,
  triggerTransition
}) {
  const [currentRoll, setCurrentRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef(false);
  const [storyText, setStoryText] = useState('Heitä noppaa kulkeaksesi syvemmälle...');

  // 🎵 Sama musiikki jatkuu hahmonvalinnasta tämän lyhyen intro-tarinan ajan.
  // Riippuvuus [phase]: kun phase vaihtuu 'intro' -> 'walking', paluufunktio
  // ajetaan ja häivyttää musiikin pois, eikä uutta käynnistetä (koska
  // ehtolauseke `if (phase !== 'intro') return;` estää sen).
  useEffect(() => {
    if (phase !== 'intro') return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(characterSelectMusic)
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
  }, [phase]);

  // 🎵 Liikkumisruudun oma tausta 'walking'-vaiheessa. Poistuu automaattisesti
  // (häivyttäen) kun MovementScreen poistuu DOM:sta - eli profiiliin/admin-
  // valikkoon siirtyminen, uloskirjautuminen tai taisteluun astuminen
  // (App.jsx vaihtaa näkyviin ProfileSettings/AdminPanel/AuthScreen/GamePlay
  // ja MovementScreen unmountautuu), tai jos phase vaihtuu pois 'walking':sta.
  useEffect(() => {
    if (phase !== 'walking') return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(walkingMusic)
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
  }, [phase]);

  useEffect(() => {
    if (phase === 'intro') {
      const autoTimer = setTimeout(() => {
        setPhase('walking');
        if (triggerTransition) triggerTransition();
      }, 14000); 
      
      return () => clearTimeout(autoTimer);
    }
  }, [phase, setPhase, triggerTransition]);

  const currentArea = activeSession?.currentArea;
  const locationLabel = currentArea?.locationLabel || 'SIJAINTI: METSÄN POLKU';

  const pickRandom = (list, fallback) => {
    if (!list || list.length === 0) return fallback;
    return list[Math.floor(Math.random() * list.length)];
  };

  const handleD6Roll = () => {
    if (isRollingRef.current) return;
    isRollingRef.current = true;
    setIsRolling(true);
    setCurrentRoll(null);

    const interval = setInterval(() => {
      setCurrentRoll(Math.floor(Math.random() * 6) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      const roll = Math.floor(Math.random() * 6) + 1;
      setCurrentRoll(roll);

      if (roll === 6) {
        const hasUnfoundTreasure = currentArea?.treasureEvent?.discoveryText && !activeSession?.treasureFound;

        if (hasUnfoundTreasure) {
          const discoveryText = currentArea.treasureEvent.discoveryText;
          const msg = `Heitit [${roll}]! ${discoveryText}`;
          setStoryText(msg);
          onAddLog(`🎲 ${msg}`, 'movement');
          setTimeout(() => {
            onFindTreasure();
            isRollingRef.current = false;
            setIsRolling(false);
          }, 1500);
          return;
        }

        const hasUnfoundCompanion = currentArea?.companionEvent?.name && !activeSession?.companionFound;

        if (hasUnfoundCompanion) {
          const discoveryText = currentArea.companionEvent.discoveryText || 'Löydät jonkun eksyneen vaeltajan seitin peitosta.';
          const msg = `Heitit [${roll}]! ${discoveryText}`;
          setStoryText(msg);
          onAddLog(`🎲 ${msg}`, 'movement');
          setTimeout(() => {
            onFindCompanion();
            isRollingRef.current = false;
            setIsRolling(false);
          }, 1500);
          return;
        }

        const hasUnfoundWeapon = currentArea?.weaponEvent?.discoveryText && !activeSession?.weaponFound;

        if (hasUnfoundWeapon) {
          const discoveryText = currentArea.weaponEvent.discoveryText;
          const msg = `Heitit [${roll}]! ${discoveryText}`;
          setStoryText(msg);
          onAddLog(`🎲 ${msg}`, 'movement');
          setTimeout(() => {
            onFindWeapon();
            isRollingRef.current = false;
            setIsRolling(false);
          }, 1500);
          return;
        }

        const encounterText = currentArea?.encounterText || 'Äkillinen kylmyys jähmettää askeleesi. Pimeys tiivistyy suoraan silmiesi edessä...';
        const msg = `Heitit [${roll}]! ${encounterText}`;
        setStoryText(msg);
        onAddLog(`🎲 ${msg}`, 'movement');
        setTimeout(() => {
          handleEnterCombat();
        }, 1500); 
      } else {
        isRollingRef.current = false;
        setIsRolling(false);
        if (roll <= 2) {
          const badText = pickRandom(currentArea?.badRollTexts, 'Oksat raapivat kasvojasi ja raskaat askeleet kaikuvat märkien puiden rungoista.');
          const msg = `Heitit [${roll}]. ${badText}`;
          setStoryText(msg);
          onAddLog(`🥾 ${msg}`, 'movement');
        } else {
          const goodText = pickRandom(currentArea?.goodRollTexts, 'Etenet sakean sumun seassa. Metsä tuntuu tarkkailevan jokaista hengitystäsi.');
          const msg = `Heitit [${roll}]. ${goodText}`;
          setStoryText(msg);
          onAddLog(`🥾 ${msg}`, 'movement');
        }
      }
    }, 1000);
  };

  if (phase === 'intro') {
    return (
      <div className="intro-screen">
        <h1 className="game-title">IKIMETSÄ</h1>
        <div className="intro-scroll-window movement-scroll-window">
          <div className="intro-scroll-content">
            <p className="intro-text">Olet valinnut osasi: {activeSession?.characterType}.</p>
            <p className="intro-text">Puristat asettasi tiukemmin nyrkissäsi.</p>
            <p className="intro-text">Kylmä tuuli puhaltaa läpi mädäntyneiden puiden.</p>
            <p className="intro-text">Jokainen askel vie sinua kauemmas turvasta.</p>
            <p className="intro-text">Matka läpi Ikimetsän pimeyden on alkanut...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="game-play-screen">
        {/* YLÄPALKKI – TÄYDELLINEN JA PUHDAS GRID-RAKENNE */}
        <div className="player-status-bar">
          
          {/* === RIVI 1: PELAAJAN STATUKSEN 3 SARAKETTA === */}
          <div className="status-item">
            <span>Hahmo:</span> <strong>{activeSession.characterType} (Lvl {activeSession.stats.level || 1})</strong>
          </div>
          <div className="status-item">
            <span>Kunto:</span> <strong className={activeSession.stats.hp < 15 ? 'low-hp' : ''}>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong>
          </div>
          <div className="status-item">
            <span>Kokemus:</span> <strong>{activeSession.stats.xp || 0} / {(activeSession.stats.level || 1) * 100} XP</strong>
          </div>
          
          {/* === RIVI 2: PELAAJAN ASEEN 3 SARAKETTA === */}
          <div className="status-item">
            <span>Ase:</span> <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability})</strong>
          </div>
          <div className="status-item">
            {/* 🎯 Keskimmäinen sarake: Korjauspainike siirretty omaksi solukseen aseen sisältä */}
            {activeSession.inventory[0]?.durability < activeSession.inventory[0]?.maxDurability && (activeSession.repairPoints >= 2) && (
              <button className="repair-mini-btn player-repair-btn" onClick={() => handleRepairWeapon('player')}>
                🔧 Korjaa (2pts)
              </button>
            )}
          </div>
          <div className="status-item">
            {/* 🎯 Oikea sarake: Korjauspisteet siirretty viimeiseksi, joten ne asettuvat suoraan Kokemuksen alle */}
            <span>Korjauspisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong>
          </div>

          {/* === RIVI 3 & 4: MATKAKUMPPANIN STATUKSET === */}
          {activeSession.companionFound && (
            <div className="companion-status-block">
              {activeSession.companionActive ? (
                <>
                  {/* Kumppanin rivi 1 (Vastaa hahmon riviä 1) */}
                  <div className="status-item">
                    <span>Kumppani:</span> <strong>{activeSession.companionName} (Lvl {Math.max(1, (activeSession.stats.level || 1) - 2)})</strong>
                  </div>
                  <div className="status-item">
                    <span>Kunto:</span> <strong className={activeSession.companionHp < 15 ? 'low-hp' : ''}>{activeSession.companionHp} / {activeSession.companionMaxHp} HP</strong>
                  </div>
                  <div className="status-item"></div> {/* 🎯 Jätetään tyhjäksi (Kokemuksen alunen) */}

                  {/* Kumppanin rivi 2 (Vastaa hahmon riviä 2) */}
                  <div className="status-item">
                    <span>Ase:</span> <strong>{activeSession.companionWeaponName} ({activeSession.companionWeaponDurability}/{activeSession.companionWeaponMaxDurability})</strong>
                  </div>
                  <div className="status-item">
                    {/* 🎯 Keskimmäinen sarake: Kumppanin korjausnappi omassa solussaan */}
                    {activeSession.companionWeaponDurability < activeSession.companionWeaponMaxDurability && (activeSession.repairPoints >= 2) && (
                      <button className="repair-mini-btn" onClick={() => handleRepairWeapon('companion')}>
                        🔧 Korjaa (2pts)
                      </button>
                    )}
                  </div>
                  <div className="status-item"></div> {/* 🎯 Jätetään tyhjäksi (Korjauspisteiden alunen) */}
                </>
              ) : (
                /* Jos kumppani on kaatunut, se nappaa koko alarivin tilan haltuunsa */
                <div className="status-item dead-companion-wide">
                  <span>Kumppani:</span> <strong className="low-hp">{activeSession.companionName} (kaatunut - toipuu nuotiolla)</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="combat-arena">
          <div className="movement-box">
            <h3 className="movement-title">{locationLabel}</h3>
            <p className="log-line">{storyText}</p>
          </div>

          {currentRoll !== null && (
            <div className="dice-row">
              <div className={`d6-movement-dice ${isRolling ? 'spinning' : 'stopped'}`}>
                <span>{currentRoll}</span>
              </div>
            </div>
          )}

          <GameLogComponent logs={gameLogs} />

          <div className="action-buttons">
            <button className="attack-btn" onClick={handleD6Roll} disabled={isRolling}>
              {isRolling ? 'Edetään...' : 'HEITÄ NOPPAA JA ETENE'}
            </button>
          </div>
        </div>
      </div>

      <div className={currentArea?.backgroundClass || 'traveling-background'}>
        {currentArea?.backgroundClass === 'traveling-background-suo' && (
          <>
            <div className="swamp-bubble b1"></div>
            <div className="swamp-bubble b2"></div>
            <div className="swamp-bubble b3"></div>
            <div className="swamp-bubble b4"></div>
          </>
        )}
        {currentArea?.backgroundClass === 'traveling-background-jarvi' && (
          <div className="lake-raft">
            <div className="raft-log"></div>
            <div className="raft-log"></div>
            <div className="raft-log"></div>
            <div className="raft-log"></div>
            <div className="raft-log"></div>
          </div>
        )}
        {currentArea?.backgroundClass === 'traveling-background-luolasto' && (
          <>
            <div className="torch-glow"></div>
            <div className="torch-glow t2"></div>
            <div className="torch-glow t3"></div>
            <div className="cave-drip d1"></div>
            <div className="cave-drip d2"></div>
            <div className="cave-drip d3"></div>
          </>
        )}
        {currentArea?.backgroundClass === 'traveling-background-metsa' && (
          <>
            <div className="forest-leaf l1"></div>
            <div className="forest-leaf l2"></div>
            <div className="forest-leaf l3"></div>
            <div className="forest-leaf l4"></div>
            <div className="forest-leaf l5"></div>
            <div className="forest-leaf l6"></div>
          </>
        )}
        {currentArea?.backgroundClass === 'traveling-background-hautausmaa' && (
          <>
            <div className="will-o-wisp w1"></div>
            <div className="will-o-wisp w2"></div>
          </>
        )}
        {currentArea?.backgroundClass === 'traveling-background-sydänmetsä' && (
          <>
            <div className="shadow-spark s1"></div>
            <div className="shadow-spark s2"></div>
            <div className="shadow-spark s3"></div>
            <div className="shadow-spark s4"></div>
          </>
        )}
        {currentArea?.backgroundClass === 'traveling-background-mökki' && (
          <>
            <div className="cursed-glow cg1"></div>
            <div className="cursed-glow cg2"></div>
            <div className="spell-spark sp1"></div>
            <div className="spell-spark sp2"></div>
            <div className="spell-spark sp3"></div>
            <div className="spell-spark sp4"></div>
          </>
        )}
      </div>
    </>
  );
}