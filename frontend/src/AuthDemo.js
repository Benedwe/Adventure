import React, { useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';

export default function AuthDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await userCredential.user.reload();
      setUser({ ...userCredential.user });
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setVerificationSent(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await result.user.reload();
      setUser({ ...result.user });
      const idToken = await result.user.getIdToken();
      setToken(idToken);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setToken('');
    setUsers([]);
    setProfileMessage('');
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const resendVerification = async () => {
    setError('');
    setVerificationSent(false);
    if (user) {
      try {
        await sendEmailVerification(user);
        setVerificationSent(true);
      } catch (err) {
        setError('Failed to resend verification email');
      }
    }
  };

  const checkVerification = async () => {
    setCheckingVerification(true);
    try {
      await user.reload();
      setUser({ ...auth.currentUser });
    } catch (err) {
      setError('Failed to check verification');
    }
    setCheckingVerification(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    try {
      await updateProfile(user, { displayName: profileName });
      await user.reload();
      setUser({ ...auth.currentUser });
      setProfileMessage('Profile updated!');
    } catch (err) {
      setProfileMessage('Failed to update profile');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Firebase Auth Demo</h2>
      {user ? (
        <>
          {user.photoURL && (
            <img src={user.photoURL} alt="Profile" style={{ width: 40, borderRadius: '50%' }} />
          )}
          <p>Signed in as: {user.displayName || user.email}</p>
          {!user.emailVerified ? (
            <div style={{ color: 'orange', margin: '12px 0' }}>
              <p>Your email is not verified.</p>
              <button onClick={resendVerification} disabled={verificationSent} style={{ marginRight: 8 }}>
                {verificationSent ? 'Verification Sent!' : 'Resend Verification Email'}
              </button>
              <button onClick={checkVerification} disabled={checkingVerification}>
                {checkingVerification ? 'Checking...' : 'I have verified'}
              </button>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Please verify your email and click "I have verified" to refresh.
              </p>
              {verificationSent && (
                <p style={{ color: 'green', marginTop: 8 }}>
                  Verification email sent! Please check your inbox.
                </p>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleProfileUpdate} style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Display Name"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <button type="submit">Update Profile</button>
                {profileMessage && <span style={{ marginLeft: 8, color: 'green' }}>{profileMessage}</span>}
              </form>
              <button onClick={handleLogout}>Logout</button>
              <hr />
              <button onClick={fetchUsers}>Fetch Users (from backend)</button>
              <ul>
                {Array.isArray(users) && users.map(u => (
                  <li key={u.id}>{u.id}: {JSON.stringify(u)}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <>
          {registerMode ? (
            <form onSubmit={handleRegister}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
              <button type="submit">Register</button>
              <button type="button" onClick={() => { setRegisterMode(false); setError(''); setVerificationSent(false); }} style={{ marginLeft: 8 }}>
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', marginBottom: 8 }}
              />
              <button type="submit">Login</button>
              <button type="button" onClick={() => { setRegisterMode(true); setError(''); setVerificationSent(false); }} style={{ marginLeft: 8 }}>
                Register
              </button>
            </form>
          )}
          <div style={{ margin: '16px 0', textAlign: 'center' }}>or</div>
          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              background: '#4285F4',
              color: 'white',
              padding: 10,
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.64 2.36 30.74 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.5z"/>
                <path fill="#FBBC05" d="M10.67 28.64c-1.13-3.36-1.13-6.98 0-10.34l-7.98-6.2C.86 15.36 0 19.56 0 24c0 4.44.86 8.64 2.69 12.44l7.98-6.2z"/>
                <path fill="#EA4335" d="M24 48c6.74 0 12.64-2.22 16.85-6.06l-7.19-5.6c-2.01 1.35-4.59 2.16-7.66 2.16-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.73 42.94 14.82 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </g>
            </svg>
            Continue with Google
          </button>
        </>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
} 