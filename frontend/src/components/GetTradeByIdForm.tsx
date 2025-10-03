import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface GetTradeByIdFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const GetTradeByIdForm: React.FC<GetTradeByIdFormProps> = ({ state, updateState }) => {
  const [tradeId, setTradeId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ error: 'API Key is required' });
      return;
    }
    if (!tradeId) {
      updateState({ error: 'Trade ID is required' });
      return;
    }

    updateState({ loading: true, error: null, response: null });

    try {
      const response = await axios.get(`http://localhost:3001/api/trades/${tradeId}`, {
        params: {
          environment: state.environment,
          apiKey: state.apiKey
        }
      });
      updateState({ response: response.data, loading: false });
    } catch (error: any) {
      updateState({ 
        error: error.response?.data?.error || error.message, 
        loading: false 
      });
    }
  };

  return (
    <div className="form-container">
      <h4>GET /v1/exchange/stablefx/trades/:tradeId</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Trade ID:</label>
          <input
            type="text"
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
            placeholder="Enter trade ID"
            required
          />
        </div>
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Get Trade Details'}
        </button>
      </form>
    </div>
  );
};

export default GetTradeByIdForm;
