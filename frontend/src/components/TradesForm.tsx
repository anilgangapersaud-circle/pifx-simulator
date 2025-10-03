import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface TradesFormProps {
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

const TradesForm: React.FC<TradesFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    quoteId: ''
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
        idempotencyKey: generateUUID(),
        quoteId: formData.quoteId
      };

      const response = await axios.post('http://localhost:3001/api/trades', {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="form-container">
      <h4>POST /v1/exchange/stablefx/trades</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Quote ID:</label>
          <input
            type="text"
            name="quoteId"
            value={formData.quoteId}
            onChange={handleChange}
            placeholder="e.g., 246bb94f-cff4-44a6-a9c6-c0695c64357d"
            required
          />
          <small className="form-hint">
            Enter the Quote ID you received from the quotes endpoint
          </small>
        </div>
        <div className="form-group">
          <label>Idempotency Key:</label>
          <div className="auto-generated-field">
            <span className="auto-generated-text">🔄 Auto-generated UUID</span>
            <small className="form-hint">
              A unique UUID will be automatically generated for this request
            </small>
          </div>
        </div>
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Create Trade'}
        </button>
      </form>
    </div>
  );
};

export default TradesForm;
