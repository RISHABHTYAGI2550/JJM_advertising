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

    // Move to next box if digit entered
    if (value && index < 5) {
      pinRefs[index + 1].current?.focus();
    }

    // Auto-verify if all 6 digits entered
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
        backgroundColor: '#070D1E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambience Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0D9488 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Activity size={30} color="#FFFFFF" />
          </div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            JJM HOSPITAL KASHIPUR
          </h1>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#38BDF8',
              fontWeight: 600,
              letterSpacing: '0.08em',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            Central Signage & Queue Controller
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: ID & Password */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#CBD5E1',
                  marginBottom: '6px',
                }}
              >
                Administrator User ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="#64748B"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. JJMads@Vibesoft.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#CBD5E1',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#64748B"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '8px',
                fontSize: '0.95rem',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  <span>Proceed to Security PIN</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: 6-Digit PIN Verification */}
        {step === 'pin' && (
          <form onSubmit={handleManualPinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(2, 132, 199, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <KeyRound size={22} color="#38BDF8" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Two-Factor Security PIN
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#94A3B8', marginTop: '4px' }}>
                Enter the authorized 6-digit administrator verification PIN
              </p>
            </div>

            {/* 6 PIN Input Boxes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  style={{
                    width: '48px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#38BDF8',
                    backgroundColor: '#070D1E',
                    border: digit ? '2px solid #0284C7' : '1px solid #334155',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStep('credentials');
                  setError(null);
                  setPin(['', '', '', '', '', '']);
                }}
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || pin.join('').length !== 6}
                style={{ flex: 2, padding: '12px', justifyContent: 'center' }}
              >
                {loading ? 'Verifying PIN...' : 'Verify & Enter Dashboard'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Badge */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#64748B',
            fontSize: '0.725rem',
          }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span>Protected by Vibesoft Healthcare Security Protocol</span>
        </div>
      </div>
    </div>
  );
};
