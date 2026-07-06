import React from 'react';
import { useEffect, useState } from 'react'; 
import './MonsterStyles.css';
import GameLogComponent from './GameLogComponent';

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

    return () => clearTimeout(revealTimer);
  }, [shouldRevealMonster, monsterKeyForReveal]);

  const monsterName = activeSession.currentMonsterName || 'Varjohahmo';
  const monsterCssClass = activeSession.currentMonsterCssClass || 'varjohahmo';
  const monsterRevealClass = `${monsterCssClass}-scare`;
  const monsterCardClass = `${monsterCssClass}-card`;

  return (
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

      {/* YLÄPALKKI */}
      <div className="player-status-bar">
        <div className="status-item">
          <span>Hahmo:</span> <strong>{activeSession.characterType} (Lvl {activeSession.stats.level || 1})</strong>
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
            <button className="repair-mini-btn" onClick={() => handleRepairWeapon('player')}>
              🔧 Korjaa (2pts)
            </button>
          )}
        </div>
        <div className="status-item"><span>Korjauspisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong></div>
        {activeSession.companionFound && (
          <div className="companion-status-block">
            {activeSession.companionActive ? (
              <>
                {/* Rivi 1: Vasemmalla nimi ja taso, oikealla kunto (HP) */}
                <div className="companion-row-line">
                  <div className="companion-left-column">
                    <span>Kumppani:</span>
                    <strong>{activeSession.companionName} (Lvl {activeSession.stats.level || 1})</strong>
                  </div>
                  <div className="companion-right-column">
                    <span>Kumppanin kunto:</span>
                    <strong className={activeSession.companionHp < 15 ? 'low-hp' : ''}>
                      {activeSession.companionHp} / {activeSession.companionMaxHp} HP
                    </strong>
                  </div>
                </div>

                {/* Rivi 2: Vasemmalla ase ja kestävyys, oikealla korjauspainike jos tarpeen */}
                <div className="companion-row-line">
                  <div className="companion-left-column">
                    <span>Kumppanin ase:</span>
                    <strong>{activeSession.companionWeaponName} ({activeSession.companionWeaponDurability}/{activeSession.companionWeaponMaxDurability})</strong>
                  </div>
                  <div className="companion-right-column" style={{ justifyContent: 'flex-end' }}>
                    {activeSession.companionWeaponDurability < activeSession.companionWeaponMaxDurability && (activeSession.repairPoints >= 2) && (
                      <button className="repair-mini-btn" onClick={() => handleRepairWeapon('companion')}>
                        🔧 Korjaa (2pts)
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Jos kumppani on kaatunut */
              <div className="companion-row-line">
                <div className="companion-left-column">
                  <span>Kumppani:</span>
                  <strong className="low-hp">{activeSession.companionName} (kaatunut - toipuu nuotiolla)</strong>
                </div>
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
  );
}