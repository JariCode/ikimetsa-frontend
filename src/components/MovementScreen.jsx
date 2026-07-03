import React, { useState, useEffect } from 'react';
import './MovementStyles.css';

export default function MovementScreen({
  activeSession,
  handleEnterCombat,
  phase,
  setPhase,
  handleRepairWeapon
}) {
  const [currentRoll, setCurrentRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [storyText, setStoryText] = useState('Polku erkanee synkkään pöheikköön. Heitä noppaa kulkeaksesi syvemmälle...');

  // 🕒 Synkronoidun siirtymän kello
  useEffect(() => {
    if (phase === 'intro') {
      const autoTimer = setTimeout(() => {
        setPhase('walking');
      }, 14000); 
      
      return () => clearTimeout(autoTimer);
    }
  }, [phase]);

  const handleD6Roll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setCurrentRoll(null);

    const interval = setInterval(() => {
      setCurrentRoll(Math.floor(Math.random() * 6) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      const roll = Math.floor(Math.random() * 6) + 1;
      setCurrentRoll(roll);
      setIsRolling(false);

      if (roll === 6) {
        setStoryText(`Heitit [${roll}]! Äkillinen kylmyys jähmettää askeleesi. Pimeys tiivistyy suoraan silmiesi edessä...`);
        setTimeout(() => {
          handleEnterCombat();
        }, 1500); 
      } else if (roll <= 2) {
        setStoryText(`Heitit [${roll}]. Oksat raapivat kasvojasi ja raskaat askeleet kaikuvat märkien puiden rungoista.`);
      } else {
        setStoryText(`Heitit [${roll}]. Etenet sakean sumun seassa. Metsä tuntuu tarkkailevan jokaista hengitystäsi.`);
      }
    }, 1000);
  };

  // 📜 VAIHE 1: Alkutarina
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

 // 🚶 VAIHE 2: Liikkumisruutu
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
            <h3 className="movement-title">SIJAINTI: METSÄN POLKU</h3>
            <p className="log-line">{storyText}</p>
          </div>

          {currentRoll !== null && (
            <div className="dice-row">
              <div className={`d6-movement-dice ${isRolling ? 'spinning' : 'stopped'}`}>
                <span>{currentRoll}</span>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="attack-btn" onClick={handleD6Roll} disabled={isRolling}>
              {isRolling ? 'Kävellään...' : 'HEITÄ NOPPAA JA ETENE METSÄSSÄ'}
            </button>
          </div>
        </div>
      </div>

      {/* 🌲 Tausta-animaatio siirretty kortin JÄLKEEN, jolloin se ei työnnä yläreunaa karkuun */}
      <div className="traveling-background" />
    </>
  );
}