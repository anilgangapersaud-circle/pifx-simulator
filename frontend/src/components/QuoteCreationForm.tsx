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
    fromAmount: '',
    toAmount: '',
    toCurrency: 'USDC'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ quoteError: 'API Key is required' });
      return;
    }

    // Check that exactly one amount is provided
    const hasFromAmount = formData.fromAmount.trim() !== '';
    const hasToAmount = formData.toAmount.trim() !== '';

    if (!hasFromAmount && !hasToAmount) {
      updateState({ quoteError: 'Please specify either From Amount or To Amount (but not both)' });
      return;
    }

    if (hasFromAmount && hasToAmount) {
      updateState({ quoteError: 'Please specify only one amount - either From Amount or To Amount, not both' });
      return;
    }

    updateState({ 
      quoteLoading: true, 
      quoteError: null, 
      quoteResponse: null 
    });

    try {
      const requestBody: any = {
        from: {
          currency: formData.fromCurrency
        },
        to: {
          currency: formData.toCurrency
        }
      };

      // Add amount to either from or to based on what's provided
      if (hasFromAmount) {
        requestBody.from.amount = parseInt(formData.fromAmount);
      } else {
        requestBody.to.amount = parseInt(formData.toAmount);
      }

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
          <label htmlFor="fromAmount">From Amount</label>
          <input
            type="number"
            id="fromAmount"
            name="fromAmount"
            value={formData.fromAmount}
            onChange={handleChange}
            placeholder="Enter amount to exchange (optional)"
          />
          <small className="form-hint">
            The amount you want to exchange FROM (in smallest currency unit)
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

        <div className="form-group">
          <label htmlFor="toAmount">To Amount</label>
          <input
            type="number"
            id="toAmount"
            name="toAmount"
            value={formData.toAmount}
            onChange={handleChange}
            placeholder="Enter amount to receive (optional)"
          />
          <small className="form-hint">
            The amount you want to receive TO (in smallest currency unit)
          </small>
        </div>

        <div style={{ 
          backgroundColor: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '6px', 
          padding: '1rem', 
          marginBottom: '1rem' 
        }}>
          <strong>📝 Note:</strong> Please specify either From Amount OR To Amount, but not both.
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
