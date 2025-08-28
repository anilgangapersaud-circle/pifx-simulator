import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface GetSignaturesFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const GetSignaturesForm: React.FC<GetSignaturesFormProps> = ({ state, updateState, flowType }) => {
  const [formData, setFormData] = useState({
    tradeId: '',
    selector: (flowType || 'taker') as 'taker' | 'maker',
    recipientAddress: ''
  });
  const [justAutoLoaded, setJustAutoLoaded] = useState(false);
  const manuallyChangedRef = useRef(false);

  // Update selector when flowType prop changes
  useEffect(() => {
    if (flowType && flowType !== formData.selector) {
      setFormData(prev => ({
        ...prev,
        selector: flowType
      }));
    }
  }, [flowType, formData.selector]);

  // Auto-populate tradeId from Step 2 trade response (only if field is empty and not manually changed)
  useEffect(() => {
    if (state.tradeResponse && !state.loading && !state.error && !formData.tradeId && !manuallyChangedRef.current) {
      console.log('🔍 Auto-populating presign form from trade response:', state.tradeResponse);
      
      let tradeId = '';
      
      // Extract tradeId from trade response
      if (state.tradeResponse.id) {
        tradeId = state.tradeResponse.id;
      } else if (state.tradeResponse.data && state.tradeResponse.data.id) {
        tradeId = state.tradeResponse.data.id;
      }
      
      if (tradeId) {
        setFormData(prev => ({
          ...prev,
          tradeId: tradeId
        }));
        setJustAutoLoaded(true);
        console.log('✅ Auto-populated presign form with tradeId:', tradeId);
        
        // Clear auto-loaded flag after delay
        setTimeout(() => setJustAutoLoaded(false), 3000);
      }
    }
  }, [state.tradeResponse, state.loading, state.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ error: 'API Key is required' });
      return;
    }
    if (!formData.tradeId) {
      updateState({ error: 'Trade ID is required' });
      return;
    }

    if (formData.selector === 'taker' && !formData.recipientAddress) {
      updateState({ error: 'Recipient Address is required for taker presign' });
      return;
    }

    updateState({ loading: true, error: null, response: null });

    try {
      // Build the URL with selector
      const url = `http://localhost:3001/api/signatures/presign/${formData.selector}/${formData.tradeId}`;
      
      // Build params
      const params: any = {
        environment: state.environment,
        apiKey: state.apiKey
      };

      // Add recipientAddress if taker is selected
      if (formData.selector === 'taker' && formData.recipientAddress) {
        params.recipientAddress = formData.recipientAddress;
      }

      const response = await axios.get(url, { params });
      updateState({ 
        response: response.data, 
        loading: false,
        // Store presign request data for Step 3
        lastPresignTradeId: formData.tradeId,
        lastPresignSelector: formData.selector,
        lastPresignRecipientAddress: formData.recipientAddress
      });
    } catch (error: any) {
      updateState({ 
        error: error.response?.data?.error || error.message, 
        loading: false 
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark as manually changed if trade ID is being edited
    if (name === 'tradeId') {
      manuallyChangedRef.current = true;
    }
    
    // Clear auto-loaded flag when user manually changes data
    setJustAutoLoaded(false);
  };

  const loadFromTradeResponse = () => {
    if (state.tradeResponse) {
      let tradeId = '';
      
      if (state.tradeResponse.id) {
        tradeId = state.tradeResponse.id;
      } else if (state.tradeResponse.data && state.tradeResponse.data.id) {
        tradeId = state.tradeResponse.data.id;
      }
      
      if (tradeId) {
        setFormData(prev => ({
          ...prev,
          tradeId: tradeId
        }));
        // Reset the manual change flag since this is an intentional reload
        manuallyChangedRef.current = false;
        console.log('Manually loaded tradeId from trade response');
      }
    }
  };

  const clearTradeId = () => {
    setFormData(prev => ({
      ...prev,
      tradeId: ''
    }));
    // Mark as manually changed to prevent auto-population
    manuallyChangedRef.current = true;
    setJustAutoLoaded(false);
    console.log('Cleared trade ID for manual entry');
  };

  const hasTradeData = state.tradeResponse && 
    (state.tradeResponse.id || 
     (state.tradeResponse.data && state.tradeResponse.data.id));

  return (
    <div className="form-container">
      {hasTradeData && formData.tradeId && (
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
            {justAutoLoaded ? '🎉 Just auto-populated from Step 2!' : '✅ Auto-populated from Step 2 trade response'}
          </span>
          <br />
          <small>
            {justAutoLoaded 
              ? 'Fresh trade ID loaded from the trade response. You can edit it if needed, or use as-is!'
              : 'The trade ID was automatically loaded from Step 2. You can edit it manually if needed!'
            }
          </small>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Selector:</label>
          <select
            name="selector"
            value={formData.selector}
            onChange={handleChange}
            required
          >
            <option value="taker">Taker</option>
            <option value="maker">Maker</option>
          </select>
          <small className="form-hint">
            Choose between taker or maker presign data
          </small>
        </div>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label>Trade ID:</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasTradeData && (
                <button 
                  type="button" 
                  onClick={loadFromTradeResponse}
                  className="example-button"
                  style={{ fontSize: '0.8rem' }}
                >
                  🔄 Reload from Step 2
                </button>
              )}
              {formData.tradeId && (
                <button 
                  type="button" 
                  onClick={clearTradeId}
                  className="example-button"
                  style={{ fontSize: '0.8rem', backgroundColor: '#fff3cd', borderColor: '#ffeaa7', color: '#856404' }}
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            name="tradeId"
            value={formData.tradeId}
            onChange={handleChange}
            placeholder="Enter or paste trade ID (auto-filled from Step 2)"
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          <small className="form-hint">
            Enter the Trade ID you received from the trades endpoint (auto-populated from Step 2, but you can override it manually)
          </small>
        </div>

        {formData.selector === 'taker' && (
          <div className="form-group">
            <label>Recipient Address:</label>
            <input
              type="text"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              placeholder="Enter recipient wallet address"
              required
            />
            <small className="form-hint">
              Wallet address that will receive the funds (required for taker)
            </small>
          </div>
        )}
        
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Get Presign Data'}
        </button>
      </form>
    </div>
  );
};

export default GetSignaturesForm;
