import { useMemo } from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password?: string;
}

export function PasswordStrengthMeter({ password = '' }: PasswordStrengthMeterProps) {
  const result = useMemo(() => zxcvbn(password), [password]);
  const score = password ? result.score : 0; // 0 to 4

  const getStrengthLabel = () => {
    if (!password) return 'None';
    switch (score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'None';
    }
  };

  const getColor = () => {
    if (!password) return 'var(--color-border, #334155)';
    switch (score) {
      case 0:
      case 1:
        return 'var(--color-danger, #ef4444)';
      case 2:
        return 'var(--color-warning, #f59e0b)';
      case 3:
      case 4:
        return 'var(--color-success, #10b981)';
      default:
        return 'var(--color-border, #334155)';
    }
  };

  const width = password ? `${Math.max((score / 4) * 100, 5)}%` : '0%';
  const color = getColor();

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.25rem',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
          Password strength:
        </span>
        <span style={{ color, fontWeight: 500 }}>
          {getStrengthLabel()}
        </span>
      </div>
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width,
            backgroundColor: color,
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>
      {password && result.feedback.warning && (
        <p
          style={{
            color: 'var(--color-danger, #ef4444)',
            fontSize: '0.75rem',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {result.feedback.warning}
        </p>
      )}
    </div>
  );
}
