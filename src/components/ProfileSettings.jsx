import React, { useState } from 'react';
import PasswordInput from './PasswordInput';

// Samat säännöt kuin backendissä, jotta virheet näkyvät heti ilman palvelinkutsua
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const PASSWORD_MIN_LENGTH = 8;
const FORBIDDEN_CHARS_REGEX = /[<>$;`\\|]/;

export default function ProfileSettings({
  currentUsername,
  onChangeUsername,
  onChangePassword,
  onDeleteAccount
}) {
  const [activeTab, setActiveTab] = useState('username'); // 'username' | 'password' | 'delete'

  const [newUsername, setNewUsername] = useState('');
  const [usernameConfirmPassword, setUsernameConfirmPassword] = useState('');
  const [usernameFieldError, setUsernameFieldError] = useState('');
  const [pendingUsername, setPendingUsername] = useState(false); // odottaako vahvistusta

  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [passwordFieldError, setPasswordFieldError] = useState('');
  const [pendingPassword, setPendingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteFieldError, setDeleteFieldError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(false);

  // Nollaa kaikki kesken jääneet vahvistukset välilehteä vaihdettaessa
  const switchTab = (tab) => {
    setPendingUsername(false);
    setPendingPassword(false);
    setPendingDelete(false);
    setActiveTab(tab);
  };

  // --- KÄYTTÄJÄTUNNUKSEN VAIHTO ---
  // Ensimmäinen submit: validoi ja näyttää vahvistuksen lomakkeen sisällä (ei alert-ikkunaa)
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    setUsernameFieldError('');

    if (FORBIDDEN_CHARS_REGEX.test(newUsername) || !USERNAME_REGEX.test(newUsername)) {
      setUsernameFieldError('Käyttäjätunnuksen pitää olla 3-30 merkkiä pitkä ja sisältää vain kirjaimia, numeroita, alaviivan tai väliviivan.');
      return;
    }

    setPendingUsername(true);
  };

  // Vahvistuksen jälkeen: varsinainen palvelinkutsu
  const confirmUsernameChange = async () => {
    const success = await onChangeUsername(newUsername, usernameConfirmPassword);
    setPendingUsername(false);
    if (success) {
      setNewUsername('');
      setUsernameConfirmPassword('');
    }
  };

  // --- SALASANAN VAIHTO ---
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordFieldError('');

    if (newPassword.length < PASSWORD_MIN_LENGTH || FORBIDDEN_CHARS_REGEX.test(newPassword)) {
      setPasswordFieldError('Uuden salasanan pitää olla vähintään 8 merkkiä pitkä eikä se saa sisältää kiellettyjä merkkejä.');
      return;
    }

    if (newPassword !== newPasswordAgain) {
      setPasswordFieldError('Uudet salasanat eivät täsmää.');
      return;
    }

    setPendingPassword(true);
  };

  const confirmPasswordChange = async () => {
    const success = await onChangePassword(currentPasswordForPw, newPassword);
    setPendingPassword(false);
    if (success) {
      setCurrentPasswordForPw('');
      setNewPassword('');
      setNewPasswordAgain('');
    }
  };

  // --- TILIN POISTO ---
  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    setDeleteFieldError('');

    if (!deletePassword) {
      setDeleteFieldError('Salasana vaaditaan tilin poistoon.');
      return;
    }

    setPendingDelete(true);
  };

  const confirmDeleteAccount = async () => {
    await onDeleteAccount(deletePassword);
    setPendingDelete(false);
  };

  return (
    <div className="profile-screen">
      <h1 className="game-title">PROFIILI</h1>
      <p className="profile-current-user">Kirjautuneena: <strong>{currentUsername}</strong></p>

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'username' ? 'active' : ''}`}
          onClick={() => switchTab('username')}
        >
          Käyttäjätunnus
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => switchTab('password')}
        >
          Salasana
        </button>
        <button
          type="button"
          className={`profile-tab-btn danger-tab ${activeTab === 'delete' ? 'active' : ''}`}
          onClick={() => switchTab('delete')}
        >
          Poista tili
        </button>
      </div>

      {activeTab === 'username' && (
        <form className="profile-form" onSubmit={handleUsernameSubmit}>
          <h2>Vaihda käyttäjätunnus</h2>
          <input
            type="text"
            placeholder="Uusi käyttäjätunnus"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            disabled={pendingUsername}
            required
          />
          <PasswordInput
            placeholder="Nykyinen salasana"
            value={usernameConfirmPassword}
            onChange={e => setUsernameConfirmPassword(e.target.value)}
            disabled={pendingUsername}
            required
          />
          {usernameFieldError && <p className="profile-field-error">{usernameFieldError}</p>}

          {pendingUsername ? (
            <div className="profile-confirm-box">
              <p className="profile-confirm-text">
                Vahvista: haluatko varmasti vaihtaa käyttäjätunnuksen muotoon "{newUsername}"?
              </p>
              <div className="profile-confirm-buttons">
                <button type="button" className="profile-cancel-btn" onClick={() => setPendingUsername(false)}>
                  Peruuta
                </button>
                <button type="button" className="auth-submit-btn" onClick={confirmUsernameChange}>
                  Vahvista vaihto
                </button>
              </div>
            </div>
          ) : (
            <button type="submit" className="auth-submit-btn">Vaihda käyttäjätunnus</button>
          )}
        </form>
      )}

      {activeTab === 'password' && (
        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          <h2>Vaihda salasana</h2>
          <PasswordInput
            placeholder="Nykyinen salasana"
            value={currentPasswordForPw}
            onChange={e => setCurrentPasswordForPw(e.target.value)}
            disabled={pendingPassword}
            required
          />
          <PasswordInput
            placeholder="Uusi salasana (vähintään 8 merkkiä)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            disabled={pendingPassword}
            required
          />
          <PasswordInput
            placeholder="Uusi salasana uudelleen"
            value={newPasswordAgain}
            onChange={e => setNewPasswordAgain(e.target.value)}
            disabled={pendingPassword}
            required
          />
          {passwordFieldError && <p className="profile-field-error">{passwordFieldError}</p>}

          {pendingPassword ? (
            <div className="profile-confirm-box">
              <p className="profile-confirm-text">
                Vahvista: haluatko varmasti vaihtaa salasanasi?
              </p>
              <div className="profile-confirm-buttons">
                <button type="button" className="profile-cancel-btn" onClick={() => setPendingPassword(false)}>
                  Peruuta
                </button>
                <button type="button" className="auth-submit-btn" onClick={confirmPasswordChange}>
                  Vahvista vaihto
                </button>
              </div>
            </div>
          ) : (
            <button type="submit" className="auth-submit-btn">Vaihda salasana</button>
          )}
        </form>
      )}

      {activeTab === 'delete' && (
        <form className="profile-form profile-danger-zone" onSubmit={handleDeleteSubmit}>
          <h2>Poista tili</h2>
          <p className="profile-danger-text">
            Tilin poisto poistaa myös kaikki pelitietosi pysyvästi. Toimintoa ei voi perua.
          </p>
          <PasswordInput
            placeholder="Nykyinen salasana"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            disabled={pendingDelete}
            required
          />
          {deleteFieldError && <p className="profile-field-error">{deleteFieldError}</p>}

          {pendingDelete ? (
            <div className="profile-confirm-box profile-confirm-box-danger">
              <p className="profile-confirm-text">
                Vahvista: haluatko VARMASTI poistaa tilisi? Kaikki pelitietosi katoavat pysyvästi eikä toimintoa voi perua.
              </p>
              <div className="profile-confirm-buttons">
                <button type="button" className="profile-cancel-btn" onClick={() => setPendingDelete(false)}>
                  Peruuta
                </button>
                <button type="button" className="danger-btn" onClick={confirmDeleteAccount}>
                  Vahvista poisto
                </button>
              </div>
            </div>
          ) : (
            <button type="submit" className="danger-btn">Poista tili pysyvästi</button>
          )}
        </form>
      )}
    </div>
  );
}