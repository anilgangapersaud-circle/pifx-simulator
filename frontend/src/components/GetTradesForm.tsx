import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface GetTradesFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const GetTradesForm: React.FC<GetTradesFormProps> = ({ state, updateState, flowType }) => {
  const [queryParams, setQueryParams] = useState({
    type: flowType || 'taker',
    status: ''
  });

  // Update type when flowType prop changes
  React.useEffect(() => {
    if (flowType && flowType !== queryParams.type) {
      setQueryParams(prev => ({
        ...prev,
        type: flowType
      }));
    }
  }, [flowType, queryParams.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ error: 'API Key is required' });
      return;
    }

    updateState({ loading: true, error: null, response: null });

    try {
      // Filter out empty parameters
      const filteredParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, value]) => value !== '')
      );

      const response = await axios.get('http://localhost:3001/api/trades', {
        params: {
          environment: state.environment,
          apiKey: state.apiKey,
          ...filteredParams
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQueryParams(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="form-container">
      <p>Retrieve trades filtered by type and status</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type:</label>
          <select
            name="type"
            value={queryParams.type}
            onChange={handleChange}
          >
            <option value="taker">Taker</option>
            <option value="maker">Maker</option>
          </select>
          <small className="form-hint">
            Filter by trade type (defaults to taker)
          </small>
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select
            name="status"
            value={queryParams.status}
            onChange={handleChange}
          >
            <option value="">All statuses</option>
            <option value="terminated">Terminated</option>
            <option value="breached">Breached</option>
            <option value="taker_funded">Taker Funded</option>
            <option value="maker_funded">Maker Funded</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_settlement">Pending Settlement</option>
            <option value="complete">Complete</option>
          </select>
          <small className="form-hint">
            Filter by trade status
          </small>
        </div>
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Get Trades'}
        </button>
      </form>
    </div>
  );
};

export default GetTradesForm;
