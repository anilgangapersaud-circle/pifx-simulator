import React, { useState } from 'react';
import { AppState } from '../App';
import axios from 'axios';

interface ContractExecutionFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const ContractExecutionForm: React.FC<ContractExecutionFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    contractAddress: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8',
    walletId: state.walletId || '',
    refId: '',
    taker: '',
    maker: '',
    // Taker Details
    consideration: {
      quoteId: '',
      base: '',
      quote: '',
      baseAmount: '',
      quoteAmount: '',
      maturity: '',
    },
    takerRecipient: '',
    takerFee: '',
    takerNonce: '',
    takerDeadline: '',
    takerSignature: '',
    // Maker Details
    makerFee: '',
    makerNonce: '',
    makerDeadline: '',
    makerSignature: ''
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
    if (field.startsWith('consideration.')) {
      const considerationField = field.replace('consideration.', '');
      setFormData(prev => ({
        ...prev,
        consideration: {
          ...prev.consideration,
          [considerationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const loadExampleData = () => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const futureTimestamp = currentTimestamp + 100000;
    const deadlineTimestamp = currentTimestamp + 10000;

    setFormData(prev => ({
      ...prev,
      taker: '0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2',
      maker: '0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2',
      consideration: {
        quoteId: '0x00000000000000000000000000000000fe740ff6c7c1461697cf6eae82f43ae5',
        base: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4', // EURC
        quote: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
        baseAmount: '1370080000',
        quoteAmount: '1500300000',
        maturity: '1755964120'
      },
      takerRecipient: '0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2',
      takerFee: '300000',
      takerNonce: '1',
      takerDeadline: '1755964120',
      takerSignature: '0x12c4e582368d4d228e3a6ceb44a4ce5559d3e5235c0f6cccfb6dd6de4bbb1bd62fae48a719da659f3ab6cd8abf5f5bf7011b7aa35853981c8e3db5bf793ba1891b',
      makerFee: '137008',
      makerNonce: '1',
      makerDeadline: '1755964157',
      makerSignature: '0xd66faf403f4a0734b6361f5df06b508dd9e3e83737593aa44d57e14f434c496c1582a273feae7d303c25811ab03e010f51e98996c0bd156dcca8d2d36bbebe271b'
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

  const generateTestData = async () => {
    if (loading) return; // Prevent multiple calls
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Generating test wallets and signatures...');
      
      const res = await axios.post('http://localhost:3001/api/generateTestData');
      
      if (res.data.success) {
        const testData = res.data.data;
        console.log('✅ Test data received:', testData);
        
        // Update form with the generated test data, preserving wallet ID from settings
        const newFormData = {
          ...testData.formData,
          walletId: state.walletId || testData.formData.walletId
        };
        
        setFormData(newFormData);
        
        // Show success notification with wallet info
        setResponse({
          success: true,
          message: 'Test wallets created and data signed successfully!',
          wallets: testData.wallets,
          metadata: testData.metadata,
          details: {
            takerWallet: testData.wallets.taker.address,
            makerWallet: testData.wallets.maker.address,
            chainId: testData.metadata.chainId,
            signatures: {
              taker: testData.formData.takerSignature,
              maker: testData.formData.makerSignature
            }
          }
        });
        
        console.log('🎉 Form prefilled with test data');
        console.log('Taker wallet:', testData.wallets.taker.address);
        console.log('Maker wallet:', testData.wallets.maker.address);
      } else {
        throw new Error(res.data.error || 'Failed to generate test data');
      }
    } catch (err: any) {
      console.error('❌ Error generating test data:', err);
      let errorMessage = 'Failed to generate test data';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyFromSigningResponse = () => {
    if (state.signingResponse?.data?.signature) {
      const signature = state.signingResponse.data.signature;
      
      const isTakerSignature = window.confirm(
        'Click OK to use this signature as Taker Signature, or Cancel for Maker Signature'
      );
      
      if (isTakerSignature) {
        setFormData(prev => ({
          ...prev,
          takerSignature: signature
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          makerSignature: signature
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Construct the request payload for Circle SDK
      // Note: Circle SDK expects most uint256 values as strings, not integers
      const payload = {
        walletApiKey: state.walletApiKey,
        entitySecret: state.entitySecret,
        contractAddress: formData.contractAddress,
        walletId: formData.walletId,
        refId: formData.refId || undefined, // Only include if provided
        taker: formData.taker,
        takerDetails: {
          consideration: {
            quoteId: formData.consideration.quoteId, // bytes32 (keep as string)
            base: formData.consideration.base, // address (keep as string)
            quote: formData.consideration.quote, // address (keep as string)
            baseAmount: formData.consideration.baseAmount, // uint256 (keep as string)
            quoteAmount: formData.consideration.quoteAmount, // uint256 (keep as string)
            maturity: formData.consideration.maturity // uint256 (keep as string)
          },
          recipient: formData.takerRecipient, // address (keep as string)
          fee: formData.takerFee, // uint256 (keep as string)
          nonce: parseInt(formData.takerNonce), // nonce can be integer
          deadline: formData.takerDeadline // uint256 (keep as string)
        },
        takerSignature: formData.takerSignature, // bytes (keep as string)
        maker: formData.maker, // address (keep as string)
        makerDetails: {
          fee: formData.makerFee, // uint256 (keep as string)
          nonce: parseInt(formData.makerNonce), // nonce can be integer
          deadline: formData.makerDeadline // uint256 (keep as string)
        },
        makerSignature: formData.makerSignature // bytes (keep as string)
      };

      console.log('Circle SDK Contract Execution Request:', payload);

      const result = await axios.post('http://localhost:3001/api/recordTrade', payload);

      setResponse(result.data);
      console.log('Contract Execution Response:', result.data);

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
      console.error('Contract Execution Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>Execute Contract Function (Circle SDK)</h2>
      <p>Execute the recordTrade function on FxEscrow contract using Circle's createContractExecutionTransaction API</p>
      
      {/* Info banner */}
      <div style={{
        backgroundColor: '#e6fffa',
        border: '1px solid #319795',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <strong>🔗 Circle SDK Contract Execution</strong>
        <br />
        <small>
          This uses Circle's Programmable Wallets to execute smart contract functions. 
          Make sure your wallet API key, entity secret, and wallet ID are configured in Settings.
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
          onClick={generateTestData}
          className="example-button"
          style={{ backgroundColor: '#667eea', fontWeight: 'bold' }}
          title="Generate test wallets, sign mock data, and prefill form"
          disabled={loading}
        >
          🧪 {loading ? 'Generating...' : 'Generate Test Data'}
        </button>
        
        <button 
          type="button" 
          onClick={loadExampleData}
          className="example-button"
          title="Load static example contract execution data"
        >
          📄 Load Example Data
        </button>
        
        {state.signingResponse?.data?.signature && (
          <button 
            type="button" 
            onClick={copyFromSigningResponse}
            className="example-button"
            style={{ backgroundColor: '#38a169' }}
            title="Copy signature from signing response"
          >
            📝 Copy Signature
          </button>
        )}
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

        {/* Trade Participants */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Trade Participants</legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div className="form-group">
              <label htmlFor="taker">Taker Address *</label>
              <input
                type="text"
                id="taker"
                value={formData.taker}
                onChange={(e) => handleInputChange('taker', e.target.value)}
                placeholder="0x..."
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maker">Maker Address *</label>
              <input
                type="text"
                id="maker"
                value={formData.maker}
                onChange={(e) => handleInputChange('maker', e.target.value)}
                placeholder="0x..."
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>
          </div>
        </fieldset>

        {/* Consideration - Simplified */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Trade Consideration</legend>
          
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="quoteId">Quote ID *</label>
            <input
              type="text"
              id="quoteId"
              value={formData.consideration.quoteId}
              onChange={(e) => handleInputChange('consideration.quoteId', e.target.value)}
              placeholder="0x..."
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="base">Base Token Address *</label>
              <input
                type="text"
                id="base"
                value={formData.consideration.base}
                onChange={(e) => handleInputChange('consideration.base', e.target.value)}
                placeholder="0x... (e.g., EURC)"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quote">Quote Token Address *</label>
              <input
                type="text"
                id="quote"
                value={formData.consideration.quote}
                onChange={(e) => handleInputChange('consideration.quote', e.target.value)}
                placeholder="0x... (e.g., USDC)"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3rem' }}>
            <div className="form-group">
              <label htmlFor="baseAmount">Base Amount *</label>
              <input
                type="text"
                id="baseAmount"
                value={formData.consideration.baseAmount}
                onChange={(e) => handleInputChange('consideration.baseAmount', e.target.value)}
                placeholder="Amount in smallest unit"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quoteAmount">Quote Amount *</label>
              <input
                type="text"
                id="quoteAmount"
                value={formData.consideration.quoteAmount}
                onChange={(e) => handleInputChange('consideration.quoteAmount', e.target.value)}
                placeholder="Amount in smallest unit"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maturity">Maturity Timestamp *</label>
              <input
                type="text"
                id="maturity"
                value={formData.consideration.maturity}
                onChange={(e) => handleInputChange('consideration.maturity', e.target.value)}
                placeholder="Unix timestamp"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>
          </div>
        </fieldset>

        {/* Taker Details */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Taker Details</legend>
          
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="takerRecipient">Recipient Address *</label>
            <input
              type="text"
              id="takerRecipient"
              value={formData.takerRecipient}
              onChange={(e) => handleInputChange('takerRecipient', e.target.value)}
              placeholder="0x..."
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="takerFee">Taker Fee *</label>
              <input
                type="text"
                id="takerFee"
                value={formData.takerFee}
                onChange={(e) => handleInputChange('takerFee', e.target.value)}
                placeholder="Amount in smallest unit"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="takerNonce">Taker Nonce *</label>
              <input
                type="text"
                id="takerNonce"
                value={formData.takerNonce}
                onChange={(e) => handleInputChange('takerNonce', e.target.value)}
                placeholder="Unique number"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="takerDeadline">Taker Deadline *</label>
              <input
                type="text"
                id="takerDeadline"
                value={formData.takerDeadline}
                onChange={(e) => handleInputChange('takerDeadline', e.target.value)}
                placeholder="Unix timestamp"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="takerSignature">Taker Signature *</label>
            <textarea
              id="takerSignature"
              value={formData.takerSignature}
              onChange={(e) => handleInputChange('takerSignature', e.target.value)}
              placeholder="0x... (signature from signing API)"
              rows={4}
              required
              style={{ width: '100%', resize: 'vertical', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small>Use the signature generated from the signing APIs.</small>
          </div>
        </fieldset>

        {/* Maker Details */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Maker Details</legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="makerFee">Maker Fee *</label>
              <input
                type="text"
                id="makerFee"
                value={formData.makerFee}
                onChange={(e) => handleInputChange('makerFee', e.target.value)}
                placeholder="Amount in smallest unit"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="makerNonce">Maker Nonce *</label>
              <input
                type="text"
                id="makerNonce"
                value={formData.makerNonce}
                onChange={(e) => handleInputChange('makerNonce', e.target.value)}
                placeholder="Unique number"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="makerDeadline">Maker Deadline *</label>
              <input
                type="text"
                id="makerDeadline"
                value={formData.makerDeadline}
                onChange={(e) => handleInputChange('makerDeadline', e.target.value)}
                placeholder="Unix timestamp"
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="makerSignature">Maker Signature *</label>
            <textarea
              id="makerSignature"
              value={formData.makerSignature}
              onChange={(e) => handleInputChange('makerSignature', e.target.value)}
              placeholder="0x... (signature from signing API)"
              rows={4}
              required
              style={{ width: '100%', resize: 'vertical', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small>Use the signature generated from the signing APIs.</small>
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
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Executing Contract...' : 'Execute recordTrade Function'}
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
              
              {/* Special display for test data generation */}
              {response.wallets && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ 
                    backgroundColor: '#e6fffa', 
                    border: '1px solid #319795',
                    borderRadius: '6px', 
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🧪</span>
                      <h4 style={{ margin: 0, color: '#319795' }}>Test Wallets Generated</h4>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        backgroundColor: '#f0f8ff', 
                        padding: '0.75rem', 
                        borderRadius: '4px',
                        border: '1px solid #90cdf4'
                      }}>
                        <strong style={{ color: '#2b6cb0' }}>👤 Taker Wallet</strong>
                        <br />
                        <small style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                          {response.wallets.taker.address}
                        </small>
                      </div>
                      
                      <div style={{ 
                        backgroundColor: '#fffaf0', 
                        padding: '0.75rem', 
                        borderRadius: '4px',
                        border: '1px solid #fbb6ce'
                      }}>
                        <strong style={{ color: '#c53030' }}>👤 Maker Wallet</strong>
                        <br />
                        <small style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                          {response.wallets.maker.address}
                        </small>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>✅ EIP-712 Signatures Generated:</strong>
                      <br />
                      <span style={{ fontSize: '0.85rem' }}>
                        • Taker details signed with taker's private key<br />
                        • Maker details signed with maker's private key<br />
                        • Form automatically prefilled with signed data
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
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
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractExecutionForm;
