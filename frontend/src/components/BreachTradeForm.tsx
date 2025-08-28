import React, { useState } from 'react';
import { AppState } from '../App';
import axios from 'axios';

interface BreachTradeFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const BreachTradeForm: React.FC<BreachTradeFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    contractAddress: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8', // Default FxEscrow contract
    walletId: state.walletId || '',
    refId: '',
    tradeId: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [walletInfoLoading, setWalletInfoLoading] = useState(false);

  // Auto-populate wallet ID when it changes
  React.useEffect(() => {
    if (state.walletId !== formData.walletId) {
      setFormData(prev => ({
        ...prev,
        walletId: state.walletId
      }));
    }
  }, [state.walletId, formData.walletId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadExampleData = () => {
    setFormData(prev => ({
      ...prev,
      tradeId: '123456' // Example trade ID
    }));
  };

  const checkWalletInfo = async () => {
    if (!formData.walletId || !state.walletApiKey || !state.entitySecret) {
      setError('Wallet ID, API Key, and Entity Secret are required to check wallet info');
      return;
    }

    setWalletInfoLoading(true);
    setWalletInfo(null);
    setError(null);

    try {
      const params = new URLSearchParams({
        walletApiKey: state.walletApiKey,
        entitySecret: state.entitySecret
      });

      const res = await axios.get(`http://localhost:3001/api/wallet/info/${formData.walletId}?${params}`);
      
      setWalletInfo(res.data);
      console.log('💰 Wallet info retrieved:', res.data);
    } catch (err: any) {
      console.error('❌ Error checking wallet info:', err);
      let errorMessage = 'Failed to get wallet information';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setWalletInfoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tradeId) {
      setError('Trade ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Construct the request payload for Circle SDK breach function
      const payload = {
        walletApiKey: state.walletApiKey,
        entitySecret: state.entitySecret,
        contractAddress: formData.contractAddress,
        walletId: formData.walletId,
        refId: formData.refId || undefined, // Only include if provided
        tradeId: parseInt(formData.tradeId) // Convert to integer as required by contract
      };

      console.log('Circle SDK Breach Function Request:', payload);

      const result = await axios.post('http://localhost:3001/api/breachTrade', payload);

      setResponse(result.data);
      console.log('Breach Function Response:', result.data);

    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                     err.response.data?.message || 
                     `HTTP ${err.response.status}: ${err.response.statusText}`;
        
        if (err.response.data?.details) {
          errorMessage += ` - ${JSON.stringify(err.response.data.details)}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Request failed to send';
      }

      setError(errorMessage);
      console.error('Breach Function Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>Breach Trade (Circle SDK)</h2>
      <p>Execute the breach function on FxEscrow contract using Circle's createContractExecutionTransaction API</p>
      
      {/* Info banner */}
      <div style={{
        backgroundColor: '#fed7d7',
        border: '1px solid #e53e3e',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <strong>⚠️ Breach Trade Function</strong>
        <br />
        <small>
          This function allows taker, maker, or authorized relayers to breach a confirmed trade after its maturity date.
          This will refund any funded amounts back to the respective parties and set the trade status to "breach".
        </small>
      </div>

      {/* Contract function info */}
      <div style={{
        backgroundColor: '#f7fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <strong>📄 Contract Function:</strong>
        <br />
        <code style={{ fontSize: '0.9rem', backgroundColor: '#edf2f7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
          function breach(uint256 id) external
        </code>
        <br />
        <small style={{ color: '#718096' }}>
          <strong>Requirements:</strong> Trade must be confirmed, past maturity date, and caller must be taker, maker, or authorized relayer.
        </small>
      </div>

      {/* Helper buttons */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          onClick={checkWalletInfo}
          className="example-button"
          style={{ backgroundColor: '#ed8936', fontWeight: 'bold' }}
          title="Check wallet address and balance (useful for funding)"
          disabled={walletInfoLoading || !formData.walletId}
        >
          💰 {walletInfoLoading ? 'Checking...' : 'Check Wallet Info'}
        </button>
        
        <button 
          type="button" 
          onClick={loadExampleData}
          className="example-button"
          title="Load example trade ID"
        >
          📄 Load Example Data
        </button>
      </div>

      <form onSubmit={handleSubmit} className="api-form" style={{ width: '100%' }}>
        {/* Contract Configuration */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Contract Configuration</legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="contractAddress">Contract Address *</label>
              <input
                type="text"
                id="contractAddress"
                value={formData.contractAddress}
                onChange={(e) => handleInputChange('contractAddress', e.target.value)}
                placeholder="0x..."
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="walletId">Wallet ID *</label>
              <input
                type="text"
                id="walletId"
                value={formData.walletId}
                onChange={(e) => handleInputChange('walletId', e.target.value)}
                placeholder="Enter wallet ID (or set in Settings)"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
              {state.walletId && formData.walletId === state.walletId && (
                <small style={{ color: '#38a169' }}>
                  ✓ Auto-populated from settings
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="refId">Reference ID</label>
              <input
                type="text"
                id="refId"
                value={formData.refId}
                onChange={(e) => handleInputChange('refId', e.target.value)}
                placeholder="Optional tracking ID"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Optional ID for tracking this transaction
              </small>
            </div>
          </div>
        </fieldset>

        {/* Trade ID */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Trade Information</legend>
          
          <div className="form-group">
            <label htmlFor="tradeId">Trade ID *</label>
            <input
              type="number"
              id="tradeId"
              value={formData.tradeId}
              onChange={(e) => handleInputChange('tradeId', e.target.value)}
              placeholder="Enter the trade ID to breach"
              required
              min="0"
              step="1"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              The ID of the trade to breach. Must be a confirmed trade that has passed its maturity date.
            </small>
          </div>
        </fieldset>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
          style={{ 
            marginTop: '2rem', 
            width: '100%', 
            padding: '1rem 2rem', 
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#e53e3e',
            borderColor: '#e53e3e'
          }}
        >
          {loading ? 'Executing Breach...' : 'Breach Trade'}
        </button>
      </form>

      {/* Wallet Info Display */}
      {walletInfo && (
        <div style={{ marginTop: '2rem' }}>
          <h3>💰 Wallet Information</h3>
          <div style={{ 
            backgroundColor: '#fef5e7', 
            border: '1px solid #ed8936', 
            borderRadius: '6px', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong>Wallet Address:</strong>
                <br />
                <code style={{ 
                  fontSize: '0.9rem', 
                  fontFamily: 'monospace',
                  backgroundColor: '#f7fafc',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  wordBreak: 'break-all'
                }}>
                  {walletInfo.wallet?.address || 'N/A'}
                </code>
              </div>
              <div>
                <strong>Network:</strong> {walletInfo.wallet?.blockchain || 'Unknown'}
                <br />
                <strong>State:</strong> {walletInfo.wallet?.state || 'Unknown'}
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#fed7d7', 
              border: '1px solid #e53e3e',
              borderRadius: '4px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <strong>⚠️ Funding Required</strong>
              <p>This wallet needs ETH to pay for gas fees. Send at least <strong>0.001 ETH</strong> to the address above.</p>
              
              {walletInfo.fundingInstructions?.testnetFaucets && (
                <div>
                  <strong>Testnet Faucets:</strong>
                  <ul style={{ marginTop: '0.5rem' }}>
                    {walletInfo.fundingInstructions.testnetFaucets.map((faucet: string, index: number) => (
                      <li key={index}>
                        <a href={faucet} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>
                          {faucet}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Display */}
      {(response || error) && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Response</h3>
          {error && (
            <div style={{ 
              backgroundColor: '#fed7d7', 
              border: '1px solid #e53e3e', 
              borderRadius: '6px', 
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <strong>Error:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{error}</pre>
            </div>
          )}
          
          {response && (
            <div style={{ 
              backgroundColor: '#f0fff4', 
              border: '1px solid #38a169', 
              borderRadius: '6px', 
              padding: '1rem'
            }}>
              <strong>Success:</strong>
              
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {JSON.stringify(response, null, 2)}
              </pre>
              
              {response.id && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e6fffa', borderRadius: '4px' }}>
                  <strong>Transaction Details:</strong>
                  <br />
                  <strong>Transaction ID:</strong> <code>{response.id}</code>
                  <br />
                  <strong>State:</strong> <code>{response.state}</code>
                  {response.txHash && (
                    <>
                      <br />
                      <strong>Transaction Hash:</strong> <code>{response.txHash}</code>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BreachTradeForm;
