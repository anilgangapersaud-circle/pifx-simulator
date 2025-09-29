import React, { useState } from 'react';
import { AppState, getWalletIdForFlow } from '../App';
import axios from 'axios';

interface SignTypedDataFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const SignTypedDataForm: React.FC<SignTypedDataFormProps> = ({ state, updateState, flowType }) => {
  const [formData, setFormData] = useState({
    walletId: getWalletIdForFlow(state, flowType || 'taker'),
    typedData: null as any
  });
  const [typedDataText, setTypedDataText] = useState('');
  const [justAutoLoaded, setJustAutoLoaded] = useState(false);
  const lastPresignResponseRef = React.useRef<any>(null);
  const isAutoUpdatingRef = React.useRef<boolean>(false);

  // Check if there's presign data in the response and auto-populate
  React.useEffect(() => {
    console.log('🔍 Auto-population check:', {
      hasResponse: !!state.response,
      responseKeys: state.response ? Object.keys(state.response) : null,
      hasDirectTypedData: !!(state.response && state.response.typedData),
      hasNestedTypedData: !!(state.response && state.response.data && state.response.data.typedData),
      loading: state.loading,
      error: state.error
    });
    
    if (state.response && !state.loading && !state.error) {
      // Look for typed data in the presign response structure
      let typedDataFromResponse: any = null;
      
      // Check for the nested structure: response.data.typedData (Circle's format)
      if (state.response.data && state.response.data.typedData) {
        typedDataFromResponse = state.response.data.typedData;
        console.log('📋 Found typed data in nested field: data.typedData');
      }
      // Check for direct typedData field
      else if (state.response.typedData) {
        typedDataFromResponse = state.response.typedData;
        console.log('📋 Found typed data in direct field: typedData');
      }
      // Check other possible field names
      else {
        const possibleFields = ['typed_data', 'eip712Data', 'signatureData', 'message'];
        for (const field of possibleFields) {
          if (state.response[field]) {
            typedDataFromResponse = state.response[field];
            console.log(`📋 Found typed data in field: ${field}`);
            break;
          }
        }
      }
      
      // If no direct field found, check if the response itself is the typed data
      if (!typedDataFromResponse && 
          state.response.types && 
          state.response.domain && 
          state.response.message) {
        typedDataFromResponse = state.response;
        console.log('📋 The response itself appears to be typed data');
      }
      
      if (typedDataFromResponse) {
        // Only auto-populate if this is a valid EIP-712 structure
        if (typedDataFromResponse && 
            typeof typedDataFromResponse === 'object' &&
            typedDataFromResponse.types &&
            typedDataFromResponse.domain &&
            typedDataFromResponse.message) {
          const typedDataJson = JSON.stringify(typedDataFromResponse, null, 2);
          
          // Set flag to prevent handleTypedDataChange from clearing signing responses
          isAutoUpdatingRef.current = true;
          setTypedDataText(typedDataJson);
          setFormData(prev => ({
            ...prev,
            typedData: typedDataFromResponse
          }));
          // Reset flag after a brief delay
          setTimeout(() => {
            isAutoUpdatingRef.current = false;
          }, 50);
          
          console.log('✅ Auto-populated typed data from presign response:', typedDataFromResponse);
          
          // Set auto-loaded flag for visual feedback
          setJustAutoLoaded(true);
          
          // Scroll to the textarea to show the auto-populated data
          setTimeout(() => {
            const textarea = document.getElementById('typedData');
            if (textarea) {
              textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          
          // Clear any previous signing responses only when new presign data loads
          const isNewPresignData = lastPresignResponseRef.current !== state.response;
          if (isNewPresignData && (state.signingResponse || state.signingError)) {
            console.log('🔄 Clearing signing responses due to new presign data');
            updateState({ signingResponse: null, signingError: null });
          }
          
          // Update the last presign response reference
          lastPresignResponseRef.current = state.response;
          
          // Clear the auto-loaded flag after a short delay
          const timer = setTimeout(() => setJustAutoLoaded(false), 3000);
          
          // Cleanup timer if component unmounts
          return () => clearTimeout(timer);
        } else {
          console.warn('⚠️ Presign response contains invalid typedData structure:', typedDataFromResponse);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.response, state.loading, state.error]);

  // Update wallet ID when it changes in settings
  React.useEffect(() => {
    const appropriateWalletId = getWalletIdForFlow(state, flowType || 'taker');
    if (appropriateWalletId !== formData.walletId) {
      setFormData(prev => ({
        ...prev,
        walletId: appropriateWalletId
      }));
    }
  }, [state.walletId, state.makerWalletId, state.takerWalletId, flowType, formData.walletId]);

  const fxEscrowExample = {
    "domain": {
      "name": "FxEscrow",
      "version": "1",
      "chainId": 11155111,
      "verifyingContract": "0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8"
    },
    "types": {
      "EIP712Domain": [
        { "name": "name", "type": "string" },
        { "name": "version", "type": "string" },
        { "name": "chainId", "type": "uint256" },
        { "name": "verifyingContract", "type": "address" }
      ],
      "Consideration": [
        { "name": "quoteId", "type": "bytes32" },
        { "name": "base", "type": "address" },
        { "name": "quote", "type": "address" },
        { "name": "baseAmount", "type": "uint256" },
        { "name": "quoteAmount", "type": "uint256" },
        { "name": "maturity", "type": "uint256" }
      ],
      "TakerDetails": [
        { "name": "consideration", "type": "Consideration" },
        { "name": "recipient", "type": "address" },
        { "name": "fee", "type": "uint256" },
        { "name": "nonce", "type": "uint256" },
        { "name": "deadline", "type": "uint256" }
      ]
    },
    "primaryType": "TakerDetails",
    "message": {
      "consideration": {
        "quoteId": "0x00000000000000000000000000000000871fb76c23a24f49a836eaf3548e4240",
        "base": "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
        "quote": "0xA0b86a33E6441e55bED90B28eeB2EceFce9d0b67",
        "quoteAmount": 1000200000,
        "baseAmount": 913390000,
        "maturity": 1755904484
      },
      "fee": 200000,
      "nonce": 1665833639,
      "deadline": 1755821684,
      "recipient": "0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2"
    }
  };

  const loadFxEscrowExample = () => {
    const exampleJson = JSON.stringify(fxEscrowExample, null, 2);
    setTypedDataText(exampleJson);
    setFormData(prev => ({
      ...prev,
      typedData: fxEscrowExample
    }));
    // Clear any previous responses
    if (state.response || state.error) {
      updateState({ response: null, error: null });
    }
  };

  const loadFromPresignResponse = () => {
    const typedDataFromResponse = getTypedDataFromResponse();
    if (typedDataFromResponse) {
      const typedDataJson = JSON.stringify(typedDataFromResponse, null, 2);
      
      // Set flag to prevent handleTypedDataChange from clearing signing responses
      isAutoUpdatingRef.current = true;
      setTypedDataText(typedDataJson);
      setFormData(prev => ({
        ...prev,
        typedData: typedDataFromResponse
      }));
      // Reset flag after a brief delay
      setTimeout(() => {
        isAutoUpdatingRef.current = false;
      }, 50);
      
      // Clear any previous signing responses (this is intentional for manual loading)
      updateState({ signingResponse: null, signingError: null });
      console.log('Manually loaded typed data from presign response');
    }
  };

  // Check if current response contains presign data
  const getTypedDataFromResponse = () => {
    if (!state.response) return null;
    
    // Check for nested structure (Circle's format)
    if (state.response.data && state.response.data.typedData) {
      return state.response.data.typedData;
    }
    // Check for direct structure
    if (state.response.typedData) {
      return state.response.typedData;
    }
    return null;
  };
  
  const typedDataFromState = getTypedDataFromResponse();
  const hasPresignData = typedDataFromState && 
    typeof typedDataFromState === 'object' &&
    typedDataFromState.types &&
    typedDataFromState.domain &&
    typedDataFromState.message;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear previous signing responses when user changes data
    if (state.signingResponse || state.signingError) {
      updateState({ signingResponse: null, signingError: null });
    }
  };

  const handleTypedDataChange = (value: string) => {
    setTypedDataText(value);
    
    // Only clear responses and flags if this is a manual user change, not auto-loading
    if (!isAutoUpdatingRef.current) {
      // Clear auto-loaded flag when user manually changes data
      setJustAutoLoaded(false);
      // Clear previous signing responses when user changes data
      if (state.signingResponse || state.signingError) {
        updateState({ signingResponse: null, signingError: null });
      }
    }
    
    try {
      if (value.trim()) {
        const parsedTypedData = JSON.parse(value);
        
        // Basic validation for EIP-712 structure
        if (parsedTypedData && 
            typeof parsedTypedData === 'object' &&
            parsedTypedData.types && 
            parsedTypedData.primaryType && 
            parsedTypedData.domain && 
            parsedTypedData.message) {
          setFormData(prev => ({
            ...prev,
            typedData: parsedTypedData
          }));
        } else {
          // Valid JSON but invalid EIP-712 structure
          setFormData(prev => ({
            ...prev,
            typedData: null
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          typedData: null
        }));
      }
    } catch (error) {
      // Invalid JSON, keep the text but don't update parsed data
      setFormData(prev => ({
        ...prev,
        typedData: null
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous signing errors
    updateState({ signingError: null, signingResponse: null });
    
    if (!formData.typedData) {
      updateState({ 
        signingError: 'Please enter valid JSON for typed data',
        signingResponse: null 
      });
      return;
    }

    // Validation based on signing method
    if (state.signingMethod === 'circle') {
      if (!state.walletApiKey || !state.entitySecret) {
        updateState({ 
          signingError: 'Please configure your Wallet API Key and Entity Secret in Settings for Circle signing',
          signingResponse: null 
        });
        return;
      }

      if (!formData.walletId.trim()) {
        updateState({ 
          signingError: 'Please enter a wallet ID for Circle signing',
          signingResponse: null 
        });
        return;
      }
    }

    updateState({ signingLoading: true, signingError: null });

    try {
      let response;

      if (state.signingMethod === 'circle') {
        // Circle signing
        response = await axios.post('http://localhost:3001/api/wallet/sign/typedData', {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          walletId: formData.walletId,
          typedData: formData.typedData
        });
      } else {
        // Web3.js signing with wallet generation
        response = await axios.post('http://localhost:3001/api/wallet/generateAndSign', {
          typedData: formData.typedData,
          generateWallet: true // Always generate a new wallet for signing
        });
      }

      updateState({ 
        signingResponse: response.data, 
        signingLoading: false 
      });
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred';
      let errorResponse = null;

      if (error.response) {
        // Server responded with error status
        errorResponse = error.response.data;
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `HTTP ${error.response.status}: ${error.response.statusText}`;
        
        // Include additional details if available
        if (error.response.data?.details) {
          errorMessage += ` - ${JSON.stringify(error.response.data.details)}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Request failed to send';
      }

      updateState({ 
        signingError: errorMessage,
        signingResponse: errorResponse,
        signingLoading: false 
      });
    }
  };

  return (
    <div className="form-container">
      <h2>Sign Typed Data</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Signing Method:</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateState({ signingMethod: 'circle' })}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${state.signingMethod === 'circle' ? '#667eea' : '#e2e8f0'}`,
                backgroundColor: state.signingMethod === 'circle' ? '#667eea' : 'white',
                color: state.signingMethod === 'circle' ? 'white' : '#4a5568',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🔵 Circle
            </button>
            <button
              type="button"
              onClick={() => updateState({ signingMethod: 'web3' })}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${state.signingMethod === 'web3' ? '#38a169' : '#e2e8f0'}`,
                backgroundColor: state.signingMethod === 'web3' ? '#38a169' : 'white',
                color: state.signingMethod === 'web3' ? 'white' : '#4a5568',
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
          {state.signingMethod === 'circle' 
            ? 'Sign EIP-712 typed data using Circle\'s Programmable Wallets with your managed wallet.'
            : 'Generate a new wallet and sign EIP-712 typed data using Web3.js + Ethers.js.'
          }
        </p>
      </div>
      {hasPresignData && typedDataText && (
        <div style={{ 
          background: justAutoLoaded ? '#e6fffa' : '#f0fff4', 
          border: `2px solid ${justAutoLoaded ? '#319795' : '#38a169'}`, 
          borderRadius: '6px', 
          padding: '0.75rem', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          transition: 'all 0.3s ease',
          boxShadow: justAutoLoaded ? '0 4px 12px rgba(56, 161, 105, 0.2)' : 'none'
        }}>
          <span style={{ color: '#38a169', fontWeight: 'bold' }}>
            {justAutoLoaded ? '🎉 Just auto-populated from Step 1!' : '✅ Auto-populated from Step 1 presign response'}
          </span>
          <br />
          <small>
            {justAutoLoaded 
              ? 'Fresh typed data loaded from the presign API response. Ready to sign!'
              : 'The typed data below was automatically loaded from the presign API response. Ready to sign with your wallet!'
            }
          </small>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="api-form">
        {state.signingMethod === 'circle' && (
          <div className="form-group">
            <label htmlFor="walletId">Wallet ID *</label>
            <input
              type="text"
              id="walletId"
              value={formData.walletId}
              onChange={(e) => handleInputChange('walletId', e.target.value)}
              placeholder="Enter wallet ID (or set in Settings)"
              required
            />
            {state.walletId && formData.walletId === state.walletId && (
              <small style={{ color: '#38a169' }}>
                ✓ Auto-populated from settings
              </small>
            )}
          </div>
        )}
        
        {state.signingMethod === 'web3' && (
          <div style={{ 
            backgroundColor: '#e6fffa', 
            border: '1px solid #319795',
            borderRadius: '6px', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🧪</span>
              <h4 style={{ margin: 0, color: '#319795' }}>Web3.js Wallet Generation</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
              A new wallet will be automatically generated for signing. You'll receive the wallet address and private key in the response.
            </p>
          </div>
        )}

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="typedData">Typed Data (JSON) *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasPresignData && (
                <button 
                  type="button" 
                  onClick={loadFromPresignResponse}
                  className="example-button"
                  style={{ backgroundColor: '#38a169' }}
                  title="Load typed data from Step 1 presign response"
                >
                  📝 Load from Presign
                </button>
              )}
              <button 
                type="button" 
                onClick={loadFxEscrowExample}
                className="example-button"
                title="Load example FxEscrow typed data"
              >
                📄 Load Example
              </button>
            </div>
          </div>
          <textarea
            id="typedData"
            value={typedDataText}
            onChange={(e) => handleTypedDataChange(e.target.value)}
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
            placeholder={`Paste your EIP-712 typed data JSON here, for example:

{
  "domain": {
    "name": "FxEscrow",
    "version": "1",
    "chainId": 11155111,
    "verifyingContract": "0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8"
  },
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" },
      { "name": "version", "type": "string" },
      { "name": "chainId", "type": "uint256" },
      { "name": "verifyingContract", "type": "address" }
    ],
    "Consideration": [
      { "name": "quoteId", "type": "bytes32" },
      { "name": "base", "type": "address" },
      { "name": "quote", "type": "address" },
      { "name": "baseAmount", "type": "uint256" },
      { "name": "quoteAmount", "type": "uint256" },
      { "name": "maturity", "type": "uint256" }
    ],
    "TakerDetails": [
      { "name": "consideration", "type": "Consideration" },
      { "name": "recipient", "type": "address" },
      { "name": "fee", "type": "uint256" },
      { "name": "nonce", "type": "uint256" },
      { "name": "deadline", "type": "uint256" }
    ]
  },
  "primaryType": "TakerDetails",
  "message": {
    "consideration": {
      "quoteId": "0x00000000000000000000000000000000871fb76c23a24f49a836eaf3548e4240",
      "base": "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
      "quote": "0xA0b86a33E6441e55bED90B28eeB2EceFce9d0b67",
      "quoteAmount": 1000200000,
      "baseAmount": 913390000,
      "maturity": 1755904484
    },
    "fee": 200000,
    "nonce": 1665833639,
    "deadline": 1755821684,
    "recipient": "0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2"
  }
}`}
            rows={20}
            className="json-textarea"
            required
          />
          <small>
            Paste your EIP-712 typed data JSON. Must include types, primaryType, domain, and message fields.
            {typedDataText && !formData.typedData && (
              <span style={{ color: '#e53e3e', marginLeft: '0.5rem' }}>
                ⚠ {(() => {
                  try {
                    JSON.parse(typedDataText);
                    return 'Invalid EIP-712 structure (missing required fields)';
                  } catch {
                    return 'Invalid JSON format';
                  }
                })()}
              </span>
            )}
            {formData.typedData && (
              <span style={{ color: '#38a169', marginLeft: '0.5rem' }}>✓ Valid EIP-712 structure</span>
            )}
          </small>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={state.signingLoading}
        >
          {state.signingLoading 
            ? 'Signing...' 
            : state.signingMethod === 'circle' 
              ? '🔵 Sign with Circle' 
              : '🧪 Generate Wallet & Sign'
          }
        </button>
      </form>
    </div>
  );
};

export default SignTypedDataForm;
