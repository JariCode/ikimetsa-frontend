import React from 'react';
import PasswordInput from './PasswordInput';

export default function AuthScreen({ 
  authMode, 
  setAuthMode, 
  usernameInput, 
  setUsernameInput, 
  passwordInput, 
  setPasswordInput, 
  handleAuthSubmit 
}) {
  return (
    <div className="auth-screen">
      <h1 className="game-title">IKIMETSÄ</h1>
      <form className="auth-form" onSubmit={handleAuthSubmit}>
        <h2>{authMode === 'login' ? 'Kirjaudu Sisään' : 'Luo Selviytyjä'}</h2>
        <input 
          type="text" 
          placeholder="Käyttäjätunnus" 
          value={usernameInput} 
          onChange={e => setUsernameInput(e.target.value)} 
          required 
        />
        <PasswordInput
          placeholder="Salasana"
          value={passwordInput}
          onChange={e => setPasswordInput(e.target.value)}
          required
        />
        <button type="submit" className="auth-submit-btn">
          {authMode === 'login' ? 'Astu sisään' : 'Luo tunnus'}
        </button>
      </form>
      
      <p className="auth-toggle-text">
        {authMode === 'login' ? 'Uusi kasvo korvessa? ' : 'Onko sinulla jo tunnus? '}
        <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
          {authMode === 'login' ? 'Luo uusi käyttäjä' : 'Kirjaudu tästä'}
        </span>
      </p>
    </div>
  );
}