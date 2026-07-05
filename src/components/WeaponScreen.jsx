import React from 'react';
import './WeaponStyles.css';

export default function WeaponScreen({ activeSession, onContinue }) {
  const weaponName = activeSession?.inventory?.[0]?.name || 'Tuntematon ase';
  const isMachete = weaponName === 'Machete';
  const discoveryText = activeSession?.currentArea?.weaponEvent?.discoveryText
    || 'Löydät jotain terävää mullan alta.';

  const discoverySentences = discoveryText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="weapon-screen">
      <h1 className="game-title weapon-title">IKIMETSÄ</h1>

      <div className="weapon-visual" aria-hidden="true">
        <div className="weapon-mound"></div>
        {isMachete ? (
          <div className="weapon-machete">
            <div className="machete-handle"></div>
            <div className="machete-blade"></div>
            <div className="machete-glint"></div>
          </div>
        ) : (
          <div className="weapon-crowbar">
            <div className="crowbar-shaft"></div>
            <div className="crowbar-claw"></div>
          </div>
        )}
      </div>

      <h3 className="weapon-heading">Löysit uuden aseen: {weaponName}</h3>

      <div className="intro-scroll-window weapon-scroll-window">
        <div className="intro-scroll-content weapon-scroll-content">
          {discoverySentences.map((sentence, i) => (
            <p className="intro-text" key={i}>{sentence}</p>
          ))}
          <p className="intro-text">Punnitset {weaponName}:n painoa käsissäsi.</p>
          <p className="intro-text">Tämä tekee huomattavasti enemmän vahinkoa kuin vanha aseesi.</p>
        </div>
      </div>

      <button className="start-btn start-btn-continue" onClick={onContinue}>
        Jatka matkaa uudella aseella
      </button>
    </div>
  );
}