import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface RegisterSignatureFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const RegisterSignatureForm: React.FC<RegisterSignatureFormProps> = ({ state, updateState, flowType }) => {
  const [formData, setFormData] = useState({
    tradeId: '',
    type: (flowType || 'taker') as 'taker' | 'maker',
    address: '',
    details: '',
    signature: ''
  });
  // Use global state for registration responses instead of local state
  const [justAutoLoaded, setJustAutoLoaded] = useState(false);

  // Update type when flowType prop changes
  useEffect(() => {
    if (flowType && flowType !== formData.type) {
      setFormData(prev => ({
        ...prev,
        type: flowType
      }));
    }
  }, [flowType, formData.type]);

  // Auto-populate form when signing response is available
  useEffect(() => {
    if (state.signingResponse && state.response && !state.registrationLoading && !state.registrationError) {
      console.log('🔍 Auto-populating signature registration form:', {
        signingResponse: state.signingResponse,
        presignResponse: state.response
      });
      
      // Extract signature from signing response
      let signature = '';
      if (state.signingResponse.signature) {
        signature = state.signingResponse.signature;
      } else if (state.signingResponse.data && state.signingResponse.data.signature) {
        signature = state.signingResponse.data.signature;
      }
      
      // Get typed data from presign response
      const typedData = getTypedDataFromState();
      let address = '';
      let details = '';
      
      // Priority 1: Use generated wallet address from Web3.js signing
      if (state.signingResponse?.data?.wallet?.address) {
        address = state.signingResponse.data.wallet.address;
        console.log('📱 Using generated wallet address:', address);
      }
      // Priority 2: Fall back to recipient from typed data
      else if (typedData && typedData.message && typedData.message.recipient) {
        address = typedData.message.recipient;
        console.log('📝 Using recipient address from typed data:', address);
      }
      
      if (typedData && typedData.message) {
        // Extract details from typedData.message (this becomes the details object)
        details = JSON.stringify(typedData.message, null, 2);
      }
      
      // Extract tradeId and type from the stored presign request data
      const autoTradeId = state.lastPresignTradeId || '';
      const autoType = state.lastPresignSelector || 'taker';
      
      if (signature && details) {
        setFormData(prev => ({
          ...prev,
          signature: signature,
          details: details,
          address: address,
          tradeId: autoTradeId,
          type: autoType
        }));
        setJustAutoLoaded(true);
        console.log('✅ Auto-populated signature registration form');
        
        // Clear auto-loaded flag after delay
        setTimeout(() => setJustAutoLoaded(false), 3000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.signingResponse, state.response, state.registrationLoading, state.registrationError]);

  // Get typed data from presign response
  const getTypedDataFromState = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.apiKey) {
      updateState({ registrationError: 'API Key is required' });
      return;
    }
    
    if (!formData.tradeId) {
      updateState({ registrationError: 'Trade ID is required' });
      return;
    }
    
    if (!formData.address) {
      updateState({ registrationError: 'Address is required' });
      return;
    }
    
    if (!formData.signature) {
      updateState({ registrationError: 'Signature is required' });
      return;
    }
    
    if (!formData.details) {
      updateState({ registrationError: 'Details are required' });
      return;
    }

    // Validate details JSON
    let parsedDetails;
    try {
      parsedDetails = JSON.parse(formData.details);
    } catch (error) {
      updateState({ registrationError: 'Details must be valid JSON' });
      return;
    }

    updateState({ 
      registrationLoading: true, 
      registrationError: null, 
      registrationResponse: null 
    });

    try {
      const requestBody = {
        tradeId: formData.tradeId,
        type: formData.type,
        address: formData.address,
        details: parsedDetails,
        signature: formData.signature
      };
      
      console.log('📤 Sending signature registration request:', requestBody);
      
      const response = await axios.post('http://localhost:3001/api/signatures/register', requestBody, {
        params: {
          environment: state.environment,
          apiKey: state.apiKey
        }
      });
      
      updateState({ 
        registrationResponse: response.data, 
        registrationLoading: false 
      });
      console.log('✅ Signature registered successfully:', response.data);
    } catch (error: any) {
      updateState({ 
        registrationError: error.response?.data?.error || error.message,
        registrationLoading: false 
      });
      console.error('❌ Signature registration failed:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear auto-loaded flag when user manually changes data
    setJustAutoLoaded(false);
    
    // Clear previous responses when user changes data
    if (state.registrationResponse || state.registrationError) {
      updateState({ 
        registrationResponse: null, 
        registrationError: null 
      });
    }
  };


  const loadFromSigningResponse = () => {
    if (state.signingResponse && state.response) {
      // Extract signature
      let signature = '';
      if (state.signingResponse.signature) {
        signature = state.signingResponse.signature;
      } else if (state.signingResponse.data && state.signingResponse.data.signature) {
        signature = state.signingResponse.data.signature;
      }
      
      // Get typed data and extract details from message
      const typedData = getTypedDataFromState();
      let details = '';
      let address = '';
      
      // Priority 1: Use generated wallet address from Web3.js signing
      if (state.signingResponse?.data?.wallet?.address) {
        address = state.signingResponse.data.wallet.address;
        console.log('📱 Manual load: Using generated wallet address:', address);
      }
      // Priority 2: Fall back to recipient from typed data
      else if (typedData && typedData.message && typedData.message.recipient) {
        address = typedData.message.recipient;
        console.log('📝 Manual load: Using recipient address from typed data:', address);
      }
      
      if (typedData && typedData.message) {
        details = JSON.stringify(typedData.message, null, 2);
      }
      
      setFormData(prev => ({
        ...prev,
        signature: signature,
        details: details,
        address: address,
        tradeId: state.lastPresignTradeId || prev.tradeId,
        type: state.lastPresignSelector || prev.type
      }));
      
      // Clear previous responses
      updateState({ 
        registrationResponse: null, 
        registrationError: null 
      });
      console.log('Manually loaded data from signing response');
    }
  };

  const hasSigningData = state.signingResponse && 
    (state.signingResponse.signature || 
     (state.signingResponse.data && state.signingResponse.data.signature));

  return (
    <div className="form-container">
      {hasSigningData && formData.signature && (
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
            {justAutoLoaded ? '🎉 Just auto-populated from Step 4!' : '✅ Auto-populated from Step 4 signing response'}
          </span>
          <br />
          <small>
            {justAutoLoaded 
              ? 'Fresh signature data loaded from the signing response. Ready to register!'
              : 'The signature and details were automatically loaded from Step 4. Ready to submit!'
            }
            {state.signingResponse?.data?.wallet?.address && (
              <><br />🧪 <strong>Using generated wallet address from Web3.js signing</strong></>
            )}
          </small>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="api-form">
        <div className="form-group">
          <label htmlFor="tradeId">Trade ID *</label>
          <input
            type="text"
            id="tradeId"
            value={formData.tradeId}
            onChange={(e) => handleChange('tradeId', e.target.value)}
            placeholder="Trade ID from Step 1"
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          <small className="form-hint">
            The same trade ID used in the presign request
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="type">Type *</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          >
            <option value="taker">Taker</option>
            <option value="maker">Maker</option>
          </select>
          <small className="form-hint">
            The same selector used in the presign request
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Recipient address from typed data"
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          {state.signingResponse?.data?.wallet?.address === formData.address && (
            <small style={{ color: '#319795', fontWeight: 'bold' }}>
              🧪 Using generated wallet address from Step 4 Web3.js signing
            </small>
          )}
          {state.signingResponse?.data?.wallet?.address !== formData.address && formData.address && (
            <small className="form-hint">
              The recipient address from the typed data message
            </small>
          )}
          {!formData.address && (
            <small className="form-hint">
              The recipient address from the typed data message
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="details">Details (JSON) *</label>
          <textarea
            id="details"
            value={formData.details}
            onChange={(e) => handleChange('details', e.target.value)}
            placeholder={`Details from typedData.message, for example:
{
  "consideration": {
    "quoteId": "0x...",
    "base": "0x...",
    "quote": "0x...",
    "quoteAmount": 1000200000,
    "baseAmount": 913390000,
    "maturity": 1755904230
  },
  "fee": 200000,
  "nonce": 205065544,
  "deadline": 1755821430,
  "recipient": "0x..."
}`}
            required
            rows={8}
            className="json-textarea"
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          <small className="form-hint">
            The message object from the typed data (auto-populated from Step 1)
          </small>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="signature">Signature *</label>
            {hasSigningData && (
              <button 
                type="button" 
                onClick={loadFromSigningResponse}
                className="example-button"
                style={{ fontSize: '0.8rem' }}
              >
                🔄 Reload from Step 2
              </button>
            )}
          </div>
          <input
            type="text"
            id="signature"
            value={formData.signature}
            onChange={(e) => handleChange('signature', e.target.value)}
            placeholder="Signature from signing response"
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          <small className="form-hint">
            The signature returned from the wallet signing operation
          </small>
        </div>

        {state.registrationError && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {state.registrationError}
          </div>
        )}

        <button type="submit" disabled={state.registrationLoading}>
          {state.registrationLoading ? 'Registering...' : 'Register Signature'}
        </button>
      </form>
    </div>
  );
};

export default RegisterSignatureForm;
