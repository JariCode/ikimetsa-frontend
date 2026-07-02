import React from 'react';

export default function CharacterSelection({ characterClasses, selectCharacter }) {
  return (
    <div className="character-selection-screen">
      <h2 className="section-title">Valitse Selviytyjä</h2>
      <div className="character-cards">
        {characterClasses.map((char) => (
          <div key={char._id} className="char-card" onClick={() => selectCharacter(char.name)}>
            <div className="char-portrait-placeholder">
              {char.name === 'Metsästäjä' ? '🏹' : '🔧'}
            </div>
            <h3>{char.name}</h3>
            <p className="char-desc">{char.description}</p>
            <ul className="char-stats">
              <li><strong>Elämä:</strong> {char.baseHp} HP</li>
              <li><strong>Aloitusase:</strong> {char.startingWeapon?.name}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}