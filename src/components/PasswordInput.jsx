import React, { useState } from 'react';

// Uudelleenkäytettävä salasanakenttä, jossa silmäkuvake näyttää/piilottaa syötetyn tekstin.
// Käytetään kaikissa sovelluksen salasanakentissä (kirjautuminen, rekisteröinti, profiili).
export default function PasswordInput({ value, onChange, placeholder, required, disabled }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Piilota salasana' : 'Näytä salasana'}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}