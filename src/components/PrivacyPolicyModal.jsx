import React from 'react';

export default function PrivacyPolicyModal({ onClose }) {
  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="legal-modal-title">Tietosuojaseloste</h2>
        <p className="legal-modal-updated">Päivitetty: 13.7.2026</p>

        <div className="legal-modal-content">
          <p>
            Tämä seloste kertoo, miten henkilötietojasi käsitellään EU:n
            yleisen tietosuoja-asetuksen (GDPR) ja Suomen tietosuojalain
            mukaisesti.
          </p>

          <p>
            <strong>Rekisterinpitäjä:</strong> Ikimetsä on opiskelijaprojekti.
            Yhteyttä palveluun liittyvissä tietosuoja-asioissa voi ottaa
            osoitteeseen jaricode@elisanet.fi.
          </p>

          <p>
            <strong>Mitä tietoja kerätään:</strong> käyttäjätunnus, salasana
            salattuna (ei koskaan selväkielisenä), sekä pelin eteneminen ja
            tilastot (hahmo, sijainti, kokemus, varusteet).
          </p>

          <p>
            <strong>Käsittelyn peruste:</strong> tietoja käsitellään
            käyttäjätilin luomiseksi ja palvelun tarjoamiseksi (sopimuksen
            täytäntöönpano) - tietoja käytetään ainoastaan kirjautumiseen ja
            pelin toimintaan, ei mainontaan, eikä niitä luovuteta kolmansille
            osapuolille.
          </p>

          <p>
            <strong>Evästeet:</strong> palvelu käyttää yhtä teknistä
            kirjautumisevästettä joka pitää sinut kirjautuneena.
            Sivustolla ei ole seuranta- eikä mainosevästeitä.
          </p>

         <p>
            <strong>Säilytys:</strong> käyttäjä- ja pelitietosi säilytetään
            tietokannassa siihen asti kunnes poistat tilisi. Palvelun tapahtumalokit
            (esim. kirjautumiset, rekisteröinnit, uloskirjautumiset yms.) poistetaan automaattisesti 12
            kuukauden kuluttua niiden syntymisestä.
          </p>

          <p>
            <strong>Oikeutesi:</strong> voit poistaa tilisi ja kaikki
            pelitietosi pysyvästi milloin tahansa Profiili-sivulta. Jos koet
            tietojasi käsiteltävän virheellisesti, voit myös tehdä valituksen
            tietosuojavaltuutetun toimistolle.
          </p>
        </div>

        <button type="button" className="legal-modal-close-btn" onClick={onClose}>
          Sulje
        </button>
      </div>
    </div>
  );
}