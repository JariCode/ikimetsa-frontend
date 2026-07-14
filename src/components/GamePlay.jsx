import React from 'react';
import { useEffect, useState } from 'react'; 
import './MonsterStyles.css';
import GameLogComponent from './GameLogComponent';
import monsterRoarSfx from '../assets/audio/sfx/rescopicsound-elemental-magic-spell-impact-outgoing-228342.mp3';
import combatMusic from '../assets/audio/music/emmraan-rise-of-the-zombies-253760.mp3';

export default function GamePlay({
  activeSession,
  monsterHp,
  diceResult,
  damageDiceResult,
  monsterDamageResult,
  isMonsterDamageRolling,
  isRolling,
  isDamageRolling,
  gameLogs,
  onAddLog,
  combatInitiative,
  currentTurn,
  handleRepairWeapon,
  handleCombatTurn
}) {
  const monsterKeyForReveal = activeSession?.currentMonsterName || 'Varjohahmo';

  // 🛡️ Päätetään VAIN KERRAN komponentin alustuksen yhteydessä pitääkö jumpscare näyttää.
  const [shouldRevealMonster] = useState(() => {
    if (monsterHp <= 0 || combatInitiative) return false;
    const alreadyShown = sessionStorage.getItem('ikimetsa_monster_reveal_shown');
    return alreadyShown !== monsterKeyForReveal;
  });

  const [showMonsterReveal, setShowMonsterReveal] = useState(false);

  useEffect(() => {
    if (!shouldRevealMonster) return;

    sessionStorage.setItem('ikimetsa_monster_reveal_shown', monsterKeyForReveal);
    setShowMonsterReveal(true);
    const revealTimer = setTimeout(() => setShowMonsterReveal(false), 2550);

    // 🔊 Soitetaan hirviön ääni jumpscaren alkaessa
    const roarSound = new Audio(monsterRoarSfx);
    roarSound.volume = 0.6; // 0-1, säädä mieleiseksi
    roarSound.play().catch(() => {
 
    });

    return () => clearTimeout(revealTimer);
  }, [shouldRevealMonster, monsterKeyForReveal]);

  // 🎵 Taistelumusiikki alkaa kun hirviö ilmestyy 
useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.35;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(combatMusic)
      .then((res) => res.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        if (cancelled) return; // Komponentti ehti jo poistua ennen latauksen valmistumista
        source = audioContext.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;

      // 🔉 Häivytys pois töksähtämisen sijaan
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

  const monsterName = activeSession.currentMonsterName || 'Varjohahmo';
  const monsterCssClass = activeSession.currentMonsterCssClass || 'varjohahmo';
  const monsterRevealClass = `${monsterCssClass}-scare`;
  const monsterCardClass = `${monsterCssClass}-card`;

  return (
    <>
      {/* 🩸 Verinen taustakerros koko sivulle taistelun ajaksi - valuvia
        verinauhoja ja tippuvia veripisaroita nykyisen tumman metsätaustan päällä.
        Renderöidään vasta kun jumpscare on ohi, ettei se vilahda paljastuksen aikana. */}
      {!showMonsterReveal && (
        <div className="combat-blood-bg">
          <div className="blood-streak bs1"></div>
          <div className="blood-streak bs2"></div>
          <div className="blood-streak bs3"></div>
          <div className="blood-streak bs4"></div>
          <div className="blood-drop bd1"></div>
          <div className="blood-drop bd2"></div>
          <div className="blood-drop bd3"></div>
          <div className="blood-drop bd4"></div>
          <div className="blood-drop bd5"></div>
        </div>
      )}

      <div className="game-play-screen">
      {showMonsterReveal && (
        <div className={`jumpscare-overlay ${monsterRevealClass}`}>
          <div className={`monster-reveal-card ${monsterCardClass}`}>
            <div className="monster-jumpscare-face" aria-hidden="true">
              <div className="monster-eye eye-left"></div>
              <div className="monster-eye eye-right"></div>
              <div className="monster-mouth"></div>
              <div className="monster-brow brow-left"></div>
              <div className="monster-brow brow-right"></div>
              <div className="monster-drip drip-1"></div>
              <div className="monster-drip drip-2"></div>
              <div className="monster-drip drip-3"></div>
            </div>
          </div>
        </div>
      )}

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
        <div className={`monster-box monster-box-${monsterCssClass}`}>
          <h3 className="monster-title">Vastustaja: {monsterName} (Lvl {activeSession.currentMonsterLevel || 1})</h3>
          <p>Hirviön kunto: <strong>{monsterHp} HP</strong></p>
        </div>

        {diceResult !== null && (
          <div className="dice-row">
            <div className={`d20-visual-dice ${isRolling ? 'spinning' : 'stopped'}`}>
              <svg className="d20-facets" viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="50,8 82,27 82,63 50,82 18,63 18,27" />
                <line x1="18" y1="27" x2="50" y2="45" />
                <line x1="82" y1="27" x2="50" y2="45" />
                <line x1="50" y1="8" x2="50" y2="45" />
                <line x1="18" y1="63" x2="50" y2="45" />
                <line x1="82" y1="63" x2="50" y2="45" />
                <line x1="50" y1="82" x2="50" y2="45" />
                <line x1="18" y1="27" x2="50" y2="8" />
                <line x1="82" y1="27" x2="50" y2="8" />
                <line x1="18" y1="63" x2="18" y2="27" />
                <line x1="82" y1="63" x2="82" y2="27" />
                <line x1="50" y1="82" x2="18" y2="63" />
                <line x1="50" y1="82" x2="82" y2="63" />
              </svg>
              <span>{diceResult}</span>
            </div>
            <div className="damage-dice-pair">
              <div className={`d8-visual-dice ${isDamageRolling ? 'spinning' : 'stopped'}`}>
                <span>{damageDiceResult?.[0] ?? 1}</span>
              </div>
              <div className={`d8-visual-dice ${isDamageRolling ? 'spinning' : 'stopped'}`}>
                <span>{damageDiceResult?.[1] ?? 1}</span>
              </div>
            </div>
            <div className={`monster-damage-dice ${isMonsterDamageRolling ? 'spinning' : 'stopped'}`}>
              <span>{monsterDamageResult ?? 1}</span>
            </div>
          </div>
        )}

        {/* JAETTU TAPAHTUMALOKI LAATIKKO */}
        <GameLogComponent logs={gameLogs} />

        <div className="action-buttons">
          <button className="attack-btn" onClick={handleCombatTurn} disabled={isRolling}>
            {isRolling ? 'Heitetään...' : 
             !combatInitiative ? 'Määritä aloite ja aloita taistelu' : 
             currentTurn === 'pelaaja' ? 'Sinun vuorosi: Hyökkää!' : 'Hirviön vuoro: Odota iskua...'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}