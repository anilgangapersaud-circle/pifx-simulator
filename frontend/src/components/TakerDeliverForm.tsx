import React, { useState } from 'react';
import { AppState } from '../App';
import axios from 'axios';

interface TakerDeliverFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const TakerDeliverForm: React.FC<TakerDeliverFormProps> = ({ state, updateState, flowType }) => {
  const [formData, setFormData] = useState({
    contractAddress: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8', // FxEscrow proxy contract
    walletId: state.walletId || '',
    refId: '',
    tradeId: '',
    // Permit data
    permitToken: '', // permitted.token
    permitAmount: '', // permitted.amount (will be converted to integer)
    permitNonce: '', // nonce (will be converted to integer)
    permitDeadline: '', // deadline (will be converted to integer)
    signature: '',
    // Web3js private key for signing
    privateKey: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingMethod, setSigningMethod] = useState<'circle' | 'web3'>('circle');
  const [deliverType, setDeliverType] = useState<'taker' | 'maker'>(flowType || 'taker');

  // Auto-populate wallet ID when it changes
  React.useEffect(() => {
    if (state.walletId !== formData.walletId) {
      setFormData(prev => ({
        ...prev,
        walletId: state.walletId
      }));
    }
  }, [state.walletId, formData.walletId]);

  // Update deliver type when flowType prop changes
  React.useEffect(() => {
    if (flowType && flowType !== deliverType) {
      setDeliverType(flowType);
    }
  }, [flowType, deliverType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const generateAndSignPermit = async () => {
    if (!formData.permitToken || !formData.permitAmount) {
      setError('Please select a token and enter an amount to generate permit');
      return;
    }

    // Validation based on signing method
    if (signingMethod === 'circle') {
      if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
        setError('Circle credentials (API Key, Entity Secret, Wallet ID) are required to sign with programmable wallet');
        return;
      }
    } else {
      if (!formData.privateKey) {
        setError('Private key is required for web3js signing');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Generate random nonce and future deadline
      const randomNonce = Math.floor(Math.random() * 1000000);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const futureDeadline = currentTimestamp + 3600; // 1 hour from now

      console.log('🔐 Generating Permit2 signature...');
      console.log('Token:', formData.permitToken);
      console.log('Amount:', formData.permitAmount);
      console.log('Nonce:', randomNonce);
      console.log('Deadline:', futureDeadline);

                 // Permit2 domain configuration (standard Permit2 format)
        const domain = {
          name: 'Permit2',
          chainId: 11155111, // Sepolia
          verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' 
        };

      // EIP-712 types including domain
      const types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        PermitTransferFrom: [
          { name: 'permitted', type: 'TokenPermissions' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ],
        TokenPermissions: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ]
      };

      const message = {
        permitted: {
          token: formData.permitToken,
          amount: parseInt(formData.permitAmount) // Convert to numeric
        },
        nonce: randomNonce,
        deadline: futureDeadline
      };

      // Debug logging
      console.log('🔍 Message structure:', JSON.stringify(message, null, 2));
      console.log('🔍 Domain:', JSON.stringify(domain, null, 2));
      console.log('🔍 Types:', JSON.stringify(types, null, 2));

      const typedData = {
        domain,
        types,
        primaryType: 'PermitTransferFrom',
        message
      };

      console.log('📝 Signing typed data:', JSON.stringify(typedData, null, 2));

      let result;
      let signerInfo = '';

      if (signingMethod === 'circle') {
        // Use Circle SDK to sign with the configured programmable wallet
        const signingPayload = {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          walletId: formData.walletId,
          typedData
        };

        result = await axios.post('http://localhost:3001/api/wallet/sign/typedData', signingPayload);
        signerInfo = `Circle SDK wallet ${formData.walletId}`;
      } else {
        // Use web3js to sign with the provided private key
        const signingPayload = {
          typedData,
          generateWallet: false,
          privateKey: formData.privateKey
        };

        result = await axios.post('http://localhost:3001/api/wallet/generateAndSign', signingPayload);
        signerInfo = `Web3js wallet from private key`;
      }

      // Handle different response structures for Circle SDK vs Web3js
      const responseData = signingMethod === 'circle' ? result.data : result.data.data;
      
      if (responseData && responseData.signature) {
        const signature = responseData.signature;
        
        console.log('✅ Permit signature generated successfully!');
        console.log('Signature:', signature);
        console.log('Signed with:', signerInfo);

        // Update form with generated values
        setFormData(prev => ({
          ...prev,
          permitNonce: randomNonce.toString(),
          permitDeadline: futureDeadline.toString(),
          signature: signature
        }));

        // Show success message
        setResponse({
          success: true,
          message: `Permit signature generated successfully with ${signingMethod === 'circle' ? 'Circle SDK' : 'Web3js'}!`,
          details: {
            signingMethod: signingMethod,
            signerInfo: signerInfo,
            signerWalletId: signingMethod === 'circle' ? formData.walletId : undefined,
            signerAddress: signingMethod === 'web3' ? responseData.wallet?.address : undefined,
            actualSigningWallet: signingMethod === 'web3' ? responseData.wallet : undefined,
            signature: signature,
            permitData: message
          }
        });

        console.log(`🎉 Form updated with ${signingMethod} permit signature`);
      } else {
        const errorMessage = signingMethod === 'circle' 
          ? (result.data?.error || 'Failed to generate permit signature')
          : (result.data?.error || result.data?.data?.error || 'Failed to generate permit signature');
        throw new Error(errorMessage);
      }
    } catch (err: any) {

      
      let errorMessage = 'Failed to generate permit signature';
      if (err.response) {
        console.error('❌ Server response:', err.response.data);
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tradeId) {
      setError('Trade ID is required');
      return;
    }

    // For taker deliver, all permit fields are required
    if (deliverType === 'taker') {
      if (!formData.permitToken || !formData.permitAmount || !formData.permitNonce || !formData.permitDeadline || !formData.signature) {
        setError('All permit fields and signature are required for Taker Deliver');
        return;
      }
      
      // Validate that numeric fields can be converted to integers
      if (isNaN(parseInt(formData.permitAmount)) || isNaN(parseInt(formData.permitNonce)) || isNaN(parseInt(formData.permitDeadline))) {
        setError('Permit amount, nonce, and deadline must be valid numbers');
        return;
      }
    }
    // For maker deliver, permit fields are optional but form is shown for consistency

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let payload;
      let endpoint;

      if (deliverType === 'taker') {
        // Construct the request payload for Circle SDK takerDeliver function
        payload = {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          contractAddress: formData.contractAddress,
          walletId: formData.walletId,
          refId: formData.refId || undefined, // Only include if provided
          tradeId: parseInt(formData.tradeId), // Convert to integer as required by contract
          permit: {
            permitted: {
              token: formData.permitToken,
              amount: parseInt(formData.permitAmount) // Convert to numeric
            },
            nonce: parseInt(formData.permitNonce), // Convert to numeric
            deadline: parseInt(formData.permitDeadline) // Convert to numeric
          },
          signature: formData.signature
        };
        endpoint = 'http://localhost:3001/api/takerDeliver';
      } else {
        // Construct the request payload for Circle SDK makerDeliver function
        payload = {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          contractAddress: formData.contractAddress,
          walletId: formData.walletId,
          refId: formData.refId || undefined, // Only include if provided
          tradeId: parseInt(formData.tradeId) // Convert to integer as required by contract
        };
        endpoint = 'http://localhost:3001/api/makerDeliver';
      }

      console.log(`Circle SDK ${deliverType}Deliver Function Request:`, payload);

      const result = await axios.post(endpoint, payload);

      setResponse(result.data);
      console.log(`${deliverType}Deliver Function Response:`, result.data);

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
      console.error('TakerDeliver Function Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>{deliverType === 'taker' ? 'Taker Deliver' : 'Maker Deliver'}</h2>
      <p>Execute the {deliverType}Deliver function on FxEscrow contract{deliverType === 'taker' ? ' with permit signature' : ''}</p>
      
      {/* Deliver Type Toggle - Only show when not in workflow mode */}
      {!flowType && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Deliver Type:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeliverType('taker')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${deliverType === 'taker' ? '#667eea' : '#e2e8f0'}`,
                  backgroundColor: deliverType === 'taker' ? '#667eea' : 'white',
                  color: deliverType === 'taker' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                📦 Taker Deliver
              </button>
              <button
                type="button"
                onClick={() => setDeliverType('maker')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${deliverType === 'maker' ? '#38a169' : '#e2e8f0'}`,
                  backgroundColor: deliverType === 'maker' ? '#38a169' : 'white',
                  color: deliverType === 'maker' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                🏭 Maker Deliver
              </button>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
            {deliverType === 'taker' 
              ? 'Execute takerDeliver - Requires Permit2 signature for token transfer from taker to contract.'
              : 'Execute makerDeliver - Simple function that only requires trade ID. No permit signature needed.'
            }
          </p>
        </div>
      )}

      {/* Signing Method Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Signing Method:</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setSigningMethod('circle')}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${signingMethod === 'circle' ? '#667eea' : '#e2e8f0'}`,
                backgroundColor: signingMethod === 'circle' ? '#667eea' : 'white',
                color: signingMethod === 'circle' ? 'white' : '#4a5568',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🔵 Circle SDK
            </button>
            <button
              type="button"
              onClick={() => setSigningMethod('web3')}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${signingMethod === 'web3' ? '#38a169' : '#e2e8f0'}`,
                backgroundColor: signingMethod === 'web3' ? '#38a169' : 'white',
                color: signingMethod === 'web3' ? 'white' : '#4a5568',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🧪 Web3.js + Ethers
            </button>
          </div>
        </div>
        
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
          {signingMethod === 'circle' 
            ? 'Sign EIP-712 permit data using Circle\'s Programmable Wallets SDK with your managed wallet.'
            : 'Sign EIP-712 permit data using Web3.js + Ethers.js with your private key.'
          }
        </p>
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

            {signingMethod === 'circle' ? (
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
            ) : (
              <div className="form-group">
                <label htmlFor="privateKey">Private Key *</label>
                <input
                  type="password"
                  id="privateKey"
                  value={formData.privateKey}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  placeholder="0x... (64-character private key)"
                  required
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                />
                <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                  Your private key for signing the permit. This is used directly for signing and never stored.
                </small>
              </div>
            )}

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
              placeholder="Enter the trade ID for delivery"
              required
              min="0"
              step="1"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              The ID of the trade where the taker will deliver tokens.
            </small>
          </div>
        </fieldset>

        {/* Permit2 Data */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>
            Permit2 Transfer Data {deliverType === 'maker' && <span style={{ fontSize: '0.9rem', color: '#718096' }}>(Optional for Maker Deliver)</span>}
          </legend>
          


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="permitToken">Token *</label>
              <select
                id="permitToken"
                value={formData.permitToken}
                onChange={(e) => handleInputChange('permitToken', e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', backgroundColor: 'white' }}
              >
                <option value="">Select a token...</option>
                <option value="0x1c7d4b196cb0c7b01d743fbc6116a902379c7238">USDC (USD Coin)</option>
                <option value="0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4">EURC (Euro Coin)</option>
              </select>
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Select the token to be transferred (Ethereum Sepolia testnet)
                {formData.permitToken && (
                  <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    <br />📍 {formData.permitToken}
                  </span>
                )}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="permitAmount">Amount *</label>
              <input
                type="number"
                id="permitAmount"
                value={formData.permitAmount}
                onChange={(e) => handleInputChange('permitAmount', e.target.value)}
                placeholder={formData.permitToken ? 
                  (formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? '1000000 (1 USDC)' : 
                   formData.permitToken === '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4' ? '1000000 (1 EURC)' : 
                   'Amount in smallest unit') : 'Amount in smallest unit'
                }
                required
                min="0"
                step="1"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Amount to transfer (both USDC and EURC use 6 decimals)
                {formData.permitToken && formData.permitAmount && (
                  <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    <br />💰 {(parseInt(formData.permitAmount) / 1000000).toFixed(6)} {
                      formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' :
                      formData.permitToken === '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4' ? 'EURC' : 'tokens'
                    }
                  </span>
                )}
              </small>
              {formData.permitToken && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleInputChange('permitAmount', '1000000')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    1 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('permitAmount', '10000000')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    10 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('permitAmount', '100000000')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#f7fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    100 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Generate Permit Button */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={generateAndSignPermit}
              className="example-button"
              style={{ 
                backgroundColor: '#667eea', 
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
              }}
              title="Generate random nonce/deadline and sign permit with web3js"
              disabled={loading || !formData.permitToken || !formData.permitAmount || 
                (signingMethod === 'circle' && (!state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
                (signingMethod === 'web3' && !formData.privateKey)}
            >
              🔐 {loading ? 'Signing...' : 'Generate & Sign Permit'}
            </button>
            {((signingMethod === 'circle' && (!formData.permitToken || !formData.permitAmount || !state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
             (signingMethod === 'web3' && (!formData.permitToken || !formData.permitAmount || !formData.privateKey))) && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
                {!formData.permitToken || !formData.permitAmount ? 
                  'Select a token and enter an amount to enable permit generation' :
                  signingMethod === 'circle' ? 
                    'Configure Circle credentials in Settings to enable programmable wallet signing' :
                    'Enter a private key to enable Web3js signing'
                }
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="permitNonce">
                Nonce * 
                <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                  🔐 Auto-generated
                </span>
              </label>
              <input
                type="number"
                id="permitNonce"
                value={formData.permitNonce}
                onChange={(e) => handleInputChange('permitNonce', e.target.value)}
                placeholder="Unique nonce for this permit (click Generate & Sign Permit)"
                required
                min="0"
                step="1"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '0.95rem',
                  backgroundColor: formData.permitNonce ? '#f0f8ff' : 'white',
                  borderColor: formData.permitNonce ? '#667eea' : '#e2e8f0'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Unique number to prevent replay attacks
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="permitDeadline">
                Deadline * 
                <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                  🔐 Auto-generated
                </span>
              </label>
              <input
                type="number"
                id="permitDeadline"
                value={formData.permitDeadline}
                onChange={(e) => handleInputChange('permitDeadline', e.target.value)}
                placeholder="Unix timestamp (click Generate & Sign Permit)"
                required
                min="0"
                step="1"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '0.95rem',
                  backgroundColor: formData.permitDeadline ? '#f0f8ff' : 'white',
                  borderColor: formData.permitDeadline ? '#667eea' : '#e2e8f0'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Expiration time for this permit
                {formData.permitDeadline && (
                  <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    (Expires: {new Date(parseInt(formData.permitDeadline) * 1000).toLocaleString()})
                  </span>
                )}
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signature">
              Permit Signature * 
              <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                🔐 Auto-generated
              </span>
            </label>
            <textarea
              id="signature"
              value={formData.signature}
              onChange={(e) => handleInputChange('signature', e.target.value)}
              placeholder="0x... (signature authorizing the token transfer - click Generate & Sign Permit)"
              rows={4}
              required
              style={{ 
                width: '100%', 
                resize: 'vertical', 
                padding: '0.75rem', 
                fontSize: '0.95rem',
                backgroundColor: formData.signature ? '#f0f8ff' : 'white',
                borderColor: formData.signature ? '#667eea' : '#e2e8f0'
              }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              The signature authorizing this permit transfer. This should be generated by signing the permit data with the token holder's private key.
              {formData.signature && (
                <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                  ✅ Signature ready
                </span>
              )}
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
            backgroundColor: '#319795',
            borderColor: '#319795'
          }}
        >
          {loading ? `Executing ${deliverType} Deliver...` : `Execute ${deliverType === 'taker' ? 'Taker' : 'Maker'} Deliver`}
        </button>
      </form>

      {/* Response Display */}
      {(response || error || loading) && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>Response</h3>
          
          {loading && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#3182ce',
              fontSize: '1rem'
            }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #3182ce', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
              Loading...
            </div>
          )}

          {error && !loading && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fed7d7', 
              border: '1px solid #e53e3e', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>❌</span>
                <div>
                  <strong style={{ color: '#e53e3e' }}>Error:</strong>
                  <div style={{ marginTop: '0.5rem', color: '#2d3748' }}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {response && !loading && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0fff4', 
              border: '1px solid #38a169', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <strong style={{ color: '#38a169' }}>Success!</strong>
              </div>
              
              {/* Special handling for permit signature generation */}
              {response.details?.signingMethod && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e6fffa', 
                  border: '1px solid #319795', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔐</span>
                    <strong style={{ color: '#319795' }}>Permit Signature Generated</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#2c5aa0' }}>
                    <strong>Method:</strong> {response.details.signingMethod}<br/>
                    <strong>Signer:</strong> {response.details.signerInfo}<br/>
                    {response.details.permitData && (
                      <>
                        <strong>Token:</strong> {response.details.permitData.permitted.token}<br/>
                        <strong>Amount:</strong> {response.details.permitData.permitted.amount}<br/>
                        <strong>Deadline:</strong> {new Date(response.details.permitData.deadline * 1000).toLocaleString()}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction details */}
              {response.id && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ color: '#2d3748' }}>Transaction Details:</strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>ID:</strong> <code>{response.id}</code><br/>
                    <strong>State:</strong> <code>{response.state}</code>
                    {response.txHash && (
                      <>
                        <br/>
                        <strong>Hash:</strong> <code>{response.txHash}</code>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Raw response */}
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  color: '#4a5568',
                  marginBottom: '0.5rem'
                }}>
                  📄 Raw Response Data
                </summary>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '4px', 
                  padding: '1rem', 
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakerDeliverForm;
