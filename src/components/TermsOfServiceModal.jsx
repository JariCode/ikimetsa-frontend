import React from 'react';

export default function TermsOfServiceModal({ onClose }) {
  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="legal-modal-title">Käyttöehdot</h2>
        <p className="legal-modal-updated">Päivitetty: 13.7.2026</p>

        <div className="legal-modal-content">
          <p>
            Ikimetsä on opiskelijaprojektina toteutettu selainpeli. Se ei ole
            kaupallinen palvelu, eikä sen saatavuutta taata jatkuvasti.
          </p>

          <p>
            Käyttäjätunnus on henkilökohtainen. Vastaat itse tunnuksesi ja
            salasanasi säilyttämisestä äläkä jaa niitä muille.
          </p>

        <p>
          Palvelua ei saa käyttää muiden häiritsemiseen, haitallisen koodin
          levittämiseen tai muiden käyttäjien tietojen urkkimiseen. Ylläpito
          voi tarvittaessa poistaa tunnuksia, joita käytetään väärin, tai
          jotka ovat olleet pitkään käyttämättöminä.
        </p>

          <p>
            Voit poistaa oman tilisi ja kaikki pelitietosi milloin tahansa
            Profiili-sivulta. Poisto on pysyvä eikä sitä voi perua.
          </p>

          <p>
            Palvelu tarjotaan sellaisena kuin se on, ilman takuita
            virheettömyydestä tai keskeytyksettömästä toiminnasta. Ylläpito ei
            vastaa palvelun käytöstä mahdollisesti aiheutuvista vahingoista.
          </p>

          <p>
            Näihin käyttöehtoihin sovelletaan Suomen lainsäädäntöä.
          </p>
        </div>

        <button type="button" className="legal-modal-close-btn" onClick={onClose}>
          Sulje
        </button>
      </div>
    </div>
  );
}