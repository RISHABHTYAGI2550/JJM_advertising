import React, { useState, useRef } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, Activity, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (trimmedEmail === 'JJMads@Vibesoft.in' && trimmedPassword === 'JJM@#ads') {
        setStep('pin');
        setTimeout(() => {
          pinRefs[0].current?.focus();
        }, 100);
      } else {
        setError('Invalid Administrator ID or Password. Access denied.');
      }
    }, 400);
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 5) {
      pinRefs[index + 1].current?.focus();
    }

    const fullPin = newPin.join('');
    if (fullPin.length === 6) {
      verifyPin(fullPin);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = (fullPin: string) => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (fullPin === '935989') {
        localStorage.setItem('jjm_auth_user', 'JJMads@Vibesoft.in');
        localStorage.setItem('jjm_auth_token', 'AUTH_' + Date.now());
        onLoginSuccess();
      } else {
        setError('Invalid Security PIN! Please enter the authorized 6-digit PIN.');
        setPin(['', '', '', '', '', '']);
        pinRefs[0].current?.focus();
      }
    }, 300);
  };

  const handleManualPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pin.join(''));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#FFFFFF',
            }}
          >
            <Activity size={28} strokeWidth={2.4} />
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dark)' }}>
            JJM Hospital Kashipur
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
            Central Signage & Queue Control Plane
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid #F8C8CB',
              color: 'var(--danger)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Administrator Credentials */}
        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Administrator ID</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. JJMads@Vibesoft.in"
                  required
                  autoFocus
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '12px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '12px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Control Center'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Pre-fill Helper */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEmail('JJMads@Vibesoft.in');
                  setPassword('JJM@#ads');
                }}
                style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', padding: '2px 8px' }}
              >
                Auto-fill Authorized Hospital Credentials
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: 6-Digit Security PIN */
          <form onSubmit={handleManualPinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                <KeyRound size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
                Security PIN Verification
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Enter the authorized 6-digit administrative security PIN
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={pinRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  style={{
                    width: '44px',
                    height: '52px',
                    fontSize: '22px',
                    fontWeight: 700,
                    textAlign: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    color: 'var(--primary)',
                  }}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || pin.join('').length !== 6}
              style={{ width: '100%' }}
            >
              <span>{loading ? 'Verifying PIN...' : 'Verify & Launch Dashboard'}</span>
              <ShieldCheck size={16} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep('credentials')}
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              >
                ← Back to credentials
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
