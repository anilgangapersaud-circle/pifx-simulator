import React, { useState } from 'react';
import axios from 'axios';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  walletApiKey: string;
  onWalletApiKeyChange: (walletApiKey: string) => void;
  entitySecret: string;
  onEntitySecretChange: (entitySecret: string) => void;
  publicKeyPem: string;
  onPublicKeyPemChange: (publicKeyPem: string) => void;
  makerWalletId: string;
  onMakerWalletIdChange: (makerWalletId: string) => void;
  takerWalletId: string;
  onTakerWalletIdChange: (takerWalletId: string) => void;
  makerWalletAddress: string;
  onMakerWalletAddressChange: (makerWalletAddress: string) => void;
  takerWalletAddress: string;
  onTakerWalletAddressChange: (takerWalletAddress: string) => void;
  environment: 'smokebox' | 'sandbox';
  onEnvironmentChange: (environment: 'smokebox' | 'sandbox') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  walletApiKey,
  onWalletApiKeyChange,
  entitySecret,
  onEntitySecretChange,
  publicKeyPem,
  onPublicKeyPemChange,
  makerWalletId,
  onMakerWalletIdChange,
  takerWalletId,
  onTakerWalletIdChange,
  makerWalletAddress,
  onMakerWalletAddressChange,
  takerWalletAddress,
  onTakerWalletAddressChange,
  environment,
  onEnvironmentChange
}) => {
  const [ciphertext, setCiphertext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const generateCiphertext = async () => {
    if (!entitySecret || !publicKeyPem) {
      setGenerateError('Both Entity Secret and Public Key PEM are required');
      return;
    }

    setGenerating(true);
    setGenerateError('');
    setCiphertext('');

    try {
      const response = await axios.post('http://localhost:3001/api/generateEntitySecretCiphertext', {
        entitySecret,
        publicKeyPem
      });

      setCiphertext(response.data.ciphertext);
    } catch (error: any) {
      console.error('Error generating ciphertext:', error);
      setGenerateError(error.response?.data?.error || error.message || 'Failed to generate ciphertext');
    } finally {
      setGenerating(false);
    }
  };

  const copyCiphertext = () => {
    navigator.clipboard.writeText(ciphertext);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="settings-overlay" onClick={onClose}></div>}
      
      {/* Settings Panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="settings-content">
          <div className="settings-group">
            <label>Environment</label>
            <div className="settings-button-group">
              <button
                className={`settings-env-button ${environment === 'sandbox' ? 'active' : ''}`}
                onClick={() => onEnvironmentChange('sandbox')}
              >
                Sandbox
              </button>
              <button
                className={`settings-env-button ${environment === 'smokebox' ? 'active' : ''}`}
                onClick={() => onEnvironmentChange('smokebox')}
              >
                Smokebox
              </button>
            </div>
            <p className="settings-env-url">
              {environment === 'sandbox' ? 'https://api-sandbox.circle.com' : 'https://api-smokebox.circle.com'}
            </p>
          </div>
          
          <div className="settings-group">
            <label htmlFor="api-key">Circle StableFX API Key</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Enter your Circle StableFX API key"
              className="settings-input"
            />
            <p className="settings-help">
              For Circle Programmable Settlements API endpoints
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="wallet-api-key">Programmable Wallets API Key</label>
            <input
              id="wallet-api-key"
              type="password"
              value={walletApiKey}
              onChange={(e) => onWalletApiKeyChange(e.target.value)}
              placeholder="Enter your Programmable Wallets API key"
              className="settings-input"
            />
            <p className="settings-help">
              For api.circle.com wallet operations
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="entity-secret">Entity Secret</label>
            <input
              id="entity-secret"
              type="password"
              value={entitySecret}
              onChange={(e) => onEntitySecretChange(e.target.value)}
              placeholder="Enter your entity secret"
              className="settings-input"
            />
            <p className="settings-help">
              Required for wallet authentication
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="public-key-pem">Programmable Wallet Public Key</label>
            <input
              id="public-key-pem"
              type="password"
              value={publicKeyPem}
              onChange={(e) => onPublicKeyPemChange(e.target.value)}
              placeholder="Enter your programmable wallet public key PEM"
              className="settings-input"
            />
            <p className="settings-help">
              Public key for encrypting entity secret (RSA-OAEP)
            </p>
          </div>

          <div className="settings-group" style={{ backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontWeight: 'bold', color: '#2d3748' }}>Generate Entity Secret Ciphertext</label>
            <p className="settings-help" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              Test your entity secret encryption by generating the ciphertext
            </p>
            <button
              type="button"
              onClick={generateCiphertext}
              disabled={generating || !entitySecret || !publicKeyPem}
              style={{
                backgroundColor: generating ? '#cbd5e0' : '#4299e1',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: generating || !entitySecret || !publicKeyPem ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}
            >
              {generating ? 'Generating...' : 'Generate Ciphertext'}
            </button>
            
            {generateError && (
              <p style={{ color: '#e53e3e', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {generateError}
              </p>
            )}
            
            {ciphertext && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Generated Ciphertext:</label>
                  <button
                    type="button"
                    onClick={copyCiphertext}
                    style={{
                      backgroundColor: '#48bb78',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  readOnly
                  value={ciphertext}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '0.5rem',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem' }}>
                  Length: {ciphertext.length} characters
                </p>
              </div>
            )}
          </div>

          <div className="settings-group">
            <label htmlFor="maker-wallet-id">Maker Wallet ID</label>
            <input
              id="maker-wallet-id"
              type="text"
              value={makerWalletId}
              onChange={(e) => onMakerWalletIdChange(e.target.value)}
              placeholder="Enter maker programmable wallet ID"
              className="settings-input"
            />
            <p className="settings-help">
              Used for maker flow operations (auto-populated when maker flow is selected)
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="taker-wallet-id">Taker Wallet ID</label>
            <input
              id="taker-wallet-id"
              type="text"
              value={takerWalletId}
              onChange={(e) => onTakerWalletIdChange(e.target.value)}
              placeholder="Enter taker programmable wallet ID"
              className="settings-input"
            />
            <p className="settings-help">
              Used for taker flow operations (auto-populated when taker flow is selected)
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="maker-wallet-address">Maker Wallet Address</label>
            <input
              id="maker-wallet-address"
              type="text"
              value={makerWalletAddress}
              onChange={(e) => onMakerWalletAddressChange(e.target.value)}
              placeholder="Enter maker wallet address (0x...)"
              className="settings-input"
            />
            <p className="settings-help">
              Blockchain address for the maker wallet
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="taker-wallet-address">Taker Wallet Address</label>
            <input
              id="taker-wallet-address"
              type="text"
              value={takerWalletAddress}
              onChange={(e) => onTakerWalletAddressChange(e.target.value)}
              placeholder="Enter taker wallet address (0x...)"
              className="settings-input"
            />
            <p className="settings-help">
              Blockchain address for the taker wallet
            </p>
          </div>

          <div className="settings-group">
            <p className="settings-warning">
              Do not share or record your API keys in publicly accessible mediums such as GitHub, client-side code, etc.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
