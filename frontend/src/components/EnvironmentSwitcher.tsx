import React from 'react';

interface EnvironmentSwitcherProps {
  environment: 'smokebox' | 'sandbox';
  onEnvironmentChange: (environment: 'smokebox' | 'sandbox') => void;
}

const EnvironmentSwitcher: React.FC<EnvironmentSwitcherProps> = ({
  environment,
  onEnvironmentChange
}) => {
  return (
    <div className="environment-switcher">
      <h3>Environment</h3>
      <div className="button-group">
        <button
          className={`env-button ${environment === 'sandbox' ? 'active' : ''}`}
          onClick={() => onEnvironmentChange('sandbox')}
        >
          Sandbox
        </button>
        <button
          className={`env-button ${environment === 'smokebox' ? 'active' : ''}`}
          onClick={() => onEnvironmentChange('smokebox')}
        >
          Smokebox
        </button>
      </div>
      <p className="env-url">
        {environment === 'sandbox' ? 'https://api-sandbox.circle.com' : 'https://api-smokebox.circle.com'}
      </p>
    </div>
  );
};

export default EnvironmentSwitcher;
