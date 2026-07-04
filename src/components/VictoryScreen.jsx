import React from 'react';
import './VictoryStyles.css';

export default function VictoryScreen({ activeSession, handleLogout }) {
  return (
    <div className="victory-screen-wrapper">
      {/* ☀️ Aurinkoinen, elävä tausta seikkailun päätteeksi */}
      <div className="sunny-forest-bg">
        <div className="bright-sun"></div>
        <div className="sun-ray r1"></div>
        <div className="sun-ray r2"></div>
        <div className="sunny-leaf sl1"></div>
        <div className="sunny-leaf sl2"></div>
        <div className="sunny-leaf sl3"></div>
      </div>

      {/* TÄMÄ KEHYSLOOTA PITÄÄ NYT SISÄLLÄÄN SEKÄ IKKUNAN ETTA NAPIN */}
      <div className="victory-main-container">
        
        <div className="victory-scroll-window">
          <div className="victory-scroll-content">
            <h1 className="victory-title">IKIMETSÄ ON VAPAA</h1>
            <p className="victory-text">Kirottujen Velho on lyöty. Hänen purppurainen loitsutulensa sammuu koristen.</p>
            <p className="victory-text">Ilma, joka oli vuosisatoja täynnä kalmanhajua ja ruttoa, muuttuu hetkessä puhtaaksi.</p>
            <p className="victory-text">Sakea usva vetäytyy puiden ympäriltä, ja mustat kuuset saavat vihdoin valoa.</p>
            <p className="victory-text">Olet selvinnyt läpi mustan veden, ruttohautojen ja synkimmän sydänmetsän.</p>
            <p className="victory-text">Uljas {activeSession?.characterType || 'seikkailija'} muistetaan ikuisesti sankarina, joka toi auringon takaisin.</p>
            <p className="victory-text" style={{ marginTop: '40px', color: '#fbbf24', fontWeight: 'bold' }}>KIITOS PELAAMISESTA!</p>
          </div>
        </div>

        {/* NAPPI ON TÄYSIN ERILLÄÄN IKKUNASTA, EI LIUKU EIKÄ PEITY */}
        <button className="victory-exit-btn" onClick={handleLogout}>
          Palaa alkuun & Kirjaudu ulos 🚪
        </button>

      </div>
    </div>
  );
}