import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface TradeCreationFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

// Function to generate a random UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const TradeCreationForm: React.FC<TradeCreationFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    quoteId: '',
    idempotencyKey: generateUUID()
  });
  const [justAutoLoaded, setJustAutoLoaded] = useState(false);

  // Auto-populate quoteId from Step 1 quote response
  useEffect(() => {
    if (state.quoteResponse && !state.tradeLoading && !state.tradeError) {
      console.log('🔍 Auto-populating trade form from quote response:', state.quoteResponse);
      
      let quoteId = '';
      
      // Extract quoteId from quote response
      if (state.quoteResponse.id) {
        quoteId = state.quoteResponse.id;
      } else if (state.quoteResponse.data && state.quoteResponse.data.id) {
        quoteId = state.quoteResponse.data.id;
      }
      
      if (quoteId && quoteId !== formData.quoteId) {
        setFormData(prev => ({
          ...prev,
          quoteId: quoteId
        }));
        setJustAutoLoaded(true);
        console.log('✅ Auto-populated trade form with quoteId:', quoteId);
        
        // Clear auto-loaded flag after delay
        setTimeout(() => setJustAutoLoaded(false), 3000);
      }
    }
  }, [state.quoteResponse, state.tradeLoading, state.tradeError, formData.quoteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ tradeError: 'API Key is required' });
      return;
    }

    if (!formData.quoteId) {
      updateState({ tradeError: 'Quote ID is required' });
      return;
    }

    updateState({ 
      tradeLoading: true, 
      tradeError: null, 
      tradeResponse: null 
    });

    try {
      const requestBody = {
        idempotencyKey: formData.idempotencyKey,
        quoteId: formData.quoteId
      };

      console.log('📤 Creating trade:', requestBody);

      const response = await axios.post('http://localhost:3001/api/trades', {
        environment: state.environment,
        apiKey: state.apiKey,
        ...requestBody
      });
      
      updateState({ 
        tradeResponse: response.data, 
        tradeLoading: false 
      });
      console.log('✅ Trade created successfully:', response.data);
    } catch (error: any) {
      updateState({ 
        tradeError: error.response?.data?.error || error.message, 
        tradeLoading: false 
      });
      console.error('❌ Trade creation failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear auto-loaded flag when user manually changes data
    setJustAutoLoaded(false);
    
    // Clear previous responses when user changes data
    if (state.tradeResponse || state.tradeError) {
      updateState({ 
        tradeResponse: null, 
        tradeError: null 
      });
    }
  };

  const generateNewKey = () => {
    setFormData(prev => ({
      ...prev,
      idempotencyKey: generateUUID()
    }));
  };

  const loadFromQuoteResponse = () => {
    if (state.quoteResponse) {
      let quoteId = '';
      
      if (state.quoteResponse.id) {
        quoteId = state.quoteResponse.id;
      } else if (state.quoteResponse.data && state.quoteResponse.data.id) {
        quoteId = state.quoteResponse.data.id;
      }
      
      if (quoteId) {
        setFormData(prev => ({
          ...prev,
          quoteId: quoteId
        }));
        
        // Clear previous responses
        updateState({ 
          tradeResponse: null, 
          tradeError: null 
        });
        console.log('Manually loaded quoteId from quote response');
      }
    }
  };

  const hasQuoteData = state.quoteResponse && 
    (state.quoteResponse.id || 
     (state.quoteResponse.data && state.quoteResponse.data.id));

  return (
    <div className="form-container">
      <h4>POST /v1/exchange/cps/trades</h4>
      <p>Create a new trade using the quote from Step 1</p>
      
      {hasQuoteData && formData.quoteId && (
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
            {justAutoLoaded ? '🎉 Just auto-populated from Step 1!' : '✅ Auto-populated from Step 1 quote response'}
          </span>
          <br />
          <small>
            {justAutoLoaded 
              ? 'Fresh quote ID loaded from the quote response. Ready to create trade!'
              : 'The quote ID was automatically loaded from Step 1. Ready to submit!'
            }
          </small>
        </div>
      )}
      
      {!hasQuoteData && !formData.quoteId && (
        <div style={{ 
          background: '#fffaf0', 
          border: '1px solid #ed8936', 
          borderRadius: '6px', 
          padding: '0.75rem', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: '#ed8936', fontWeight: 'bold' }}>
            ⏳ Waiting for quote data
          </span>
          <br />
          <small>
            Complete Step 1 to automatically populate the quote ID, or manually enter a quote ID below.
          </small>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="api-form">
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="quoteId">Quote ID *</label>
            {hasQuoteData && (
              <button 
                type="button" 
                onClick={loadFromQuoteResponse}
                className="example-button"
                style={{ fontSize: '0.8rem' }}
              >
                🔄 Reload from Step 1
              </button>
            )}
          </div>
          <input
            type="text"
            id="quoteId"
            name="quoteId"
            value={formData.quoteId}
            onChange={handleChange}
            placeholder="Quote ID from Step 1"
            required
            style={{
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              borderColor: justAutoLoaded ? '#38a169' : undefined,
              boxShadow: justAutoLoaded ? '0 0 0 3px rgba(56, 161, 105, 0.1)' : undefined
            }}
          />
          <small className="form-hint">
            The quote ID returned from the quote creation
          </small>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="idempotencyKey">Idempotency Key *</label>
            <button 
              type="button" 
              onClick={generateNewKey}
              className="example-button"
              style={{ fontSize: '0.8rem' }}
            >
              🔄 Generate New
            </button>
          </div>
          <input
            type="text"
            id="idempotencyKey"
            name="idempotencyKey"
            value={formData.idempotencyKey}
            onChange={handleChange}
            placeholder="Auto-generated UUID"
            required
            readOnly
          />
          <small className="form-hint">
            Unique key to prevent duplicate trades (auto-generated)
          </small>
        </div>

        {state.tradeError && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {state.tradeError}
          </div>
        )}

        <button type="submit" disabled={state.tradeLoading}>
          {state.tradeLoading ? 'Creating Trade...' : 'Create Trade'}
        </button>
      </form>
    </div>
  );
};

export default TradeCreationForm;
