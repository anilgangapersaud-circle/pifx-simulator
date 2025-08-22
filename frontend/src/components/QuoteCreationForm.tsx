import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface QuoteCreationFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const QuoteCreationForm: React.FC<QuoteCreationFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    fromCurrency: 'EURC',
    toAmount: '',
    toCurrency: 'USDC'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ quoteError: 'API Key is required' });
      return;
    }

    if (!formData.toAmount) {
      updateState({ quoteError: 'To Amount is required' });
      return;
    }

    updateState({ 
      quoteLoading: true, 
      quoteError: null, 
      quoteResponse: null 
    });

    try {
      const requestBody = {
        from: {
          currency: formData.fromCurrency
        },
        to: {
          amount: parseInt(formData.toAmount),
          currency: formData.toCurrency
        }
      };

      console.log('📤 Creating quote:', requestBody);

      const response = await axios.post('http://localhost:3001/api/quotes', {
        environment: state.environment,
        apiKey: state.apiKey,
        ...requestBody
      });
      
      updateState({ 
        quoteResponse: response.data, 
        quoteLoading: false 
      });
      console.log('✅ Quote created successfully:', response.data);
    } catch (error: any) {
      updateState({ 
        quoteError: error.response?.data?.error || error.message, 
        quoteLoading: false 
      });
      console.error('❌ Quote creation failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear previous responses when user changes data
    if (state.quoteResponse || state.quoteError) {
      updateState({ 
        quoteResponse: null, 
        quoteError: null 
      });
    }
  };

  return (
    <div className="form-container">
      <h4>POST /v1/exchange/cps/quotes</h4>
      <p>Create a new quote for currency exchange</p>
      
      <form onSubmit={handleSubmit} className="api-form">
        <div className="form-group">
          <label htmlFor="fromCurrency">From Currency *</label>
          <select
            id="fromCurrency"
            name="fromCurrency"
            value={formData.fromCurrency}
            onChange={handleChange}
            required
          >
            <option value="EURC">EURC</option>
            <option value="USDC">USDC</option>
          </select>
          <small className="form-hint">
            The currency you want to exchange from
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="toAmount">To Amount *</label>
          <input
            type="number"
            id="toAmount"
            name="toAmount"
            value={formData.toAmount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
          />
          <small className="form-hint">
            The amount you want to receive (in smallest currency unit)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="toCurrency">To Currency *</label>
          <select
            id="toCurrency"
            name="toCurrency"
            value={formData.toCurrency}
            onChange={handleChange}
            required
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
          </select>
          <small className="form-hint">
            The currency you want to receive
          </small>
        </div>

        {state.quoteError && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {state.quoteError}
          </div>
        )}

        <button type="submit" disabled={state.quoteLoading}>
          {state.quoteLoading ? 'Creating Quote...' : 'Create Quote'}
        </button>
      </form>
    </div>
  );
};

export default QuoteCreationForm;
