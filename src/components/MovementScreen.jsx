import React, { useState, useEffect, useRef } from 'react';
import './MovementStyles.css';
import GameLogComponent from './GameLogComponent';

export default function MovementScreen({
  activeSession,
  handleEnterCombat,
  phase,
  setPhase,
  handleRepairWeapon,
  gameLogs,
  onAddLog
}) {
  const [currentRoll, setCurrentRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef(false); // 🛡️ Sama arvo kuin isRolling, mutta päivittyy VÄLITTÖMÄSTI ilman renderöintiviivettä
  const [storyText, setStoryText] = useState('Heitä noppaa kulkeaksesi syvemmälle...');

  useEffect(() => {
    if (phase === 'intro') {
      const autoTimer = setTimeout(() => {
        setPhase('walking');
      }, 14000); 
      
      return () => clearTimeout(autoTimer);
    }
  }, [phase]);

  const currentArea = activeSession?.currentArea;
  const locationLabel = currentArea?.locationLabel || 'SIJAINTI: METSÄN POLKU';

  // 🎲 Arpoo satunnaisen rivin annetusta listasta - varalla geneerinen teksti jos aluetta ei löydy
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
        // 🛡️ EI vapauteta isRolling-tilaa tässä - nappi pysyy lukittuna kunnes
        // taisteluun siirtyminen (handleEnterCombat) oikeasti tapahtuu 1500ms päästä.
        // Ilman tätä nappia ehti painaa uudelleen kesken siirtymän, mikä käynnisti
        // toisen kierroksen päällekkäin ja tuplasi taisteluun-astumisviestin.
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
          <div className="intro-scroll-content" style={{ animationDuration: '29s' }}>
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
        {/* YLÄPALKKI */}
        <div className="player-status-bar">
          <div className="status-item">
            <span>Hahmo:</span> <strong>{activeSession.characterType} (Taso {activeSession.stats.level || 1})</strong>
          </div>
          <div className="status-item">
            <span>Kunto:</span> <strong className={activeSession.stats.hp < 15 ? 'low-hp' : ''}>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong>
          </div>
          <div className="status-item">
            <span>Kokemus:</span> <strong>{activeSession.stats.xp || 0} / {(activeSession.stats.level || 1) * 100} XP</strong>
          </div>
          <div className="status-item">
            <span>Ase:</span> <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability})</strong>
            {activeSession.inventory[0]?.durability < activeSession.inventory[0]?.maxDurability && (activeSession.repairPoints >= 2) && (
              <button className="repair-mini-btn" onClick={handleRepairWeapon}>
                🔧 Korjaa (2pts)
              </button>
            )}
          </div>
          <div className="status-item"><span>Korjauspisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong></div>
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

          {/* LOKILAATIKKO NOSTETTU PAINIKKEEN YLÄPUOLELLE */}
          <GameLogComponent logs={gameLogs} />

          {/* PAINIKE SIIRRETTY ALIMMAISEKSI */}
          <div className="action-buttons">
            <button className="attack-btn" onClick={handleD6Roll} disabled={isRolling}>
              {isRolling ? 'Kävellään...' : 'HEITÄ NOPPAA JA ETENE METSÄSSÄ'}
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
      </div>
    </>
  );
}