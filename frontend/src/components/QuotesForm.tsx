import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface QuotesFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const QuotesForm: React.FC<QuotesFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    fromCurrency: 'EURC',
    toAmount: '',
    toCurrency: 'USDC'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ error: 'API Key is required' });
      return;
    }

    updateState({ loading: true, error: null, response: null });

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

      const response = await axios.post('http://localhost:3001/api/quotes', {
        environment: state.environment,
        apiKey: state.apiKey,
        ...requestBody
      });
      updateState({ response: response.data, loading: false });
    } catch (error: any) {
      updateState({ 
        error: error.response?.data?.error || error.message, 
        loading: false 
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>From Currency:</label>
          <select
            name="fromCurrency"
            value={formData.fromCurrency}
            onChange={handleChange}
            required
          >
            <option value="EURC">EURC</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <div className="form-group">
          <label>To Amount:</label>
          <input
            type="number"
            name="toAmount"
            value={formData.toAmount}
            onChange={handleChange}
            placeholder="e.g., 1000"
            min="1"
            step="1"
            required
          />
        </div>
        <div className="form-group">
          <label>To Currency:</label>
          <select
            name="toCurrency"
            value={formData.toCurrency}
            onChange={handleChange}
            required
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
          </select>
        </div>
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Get Quote'}
        </button>
      </form>
    </div>
  );
};

export default QuotesForm;
