import React, { useState } from 'react';
import axios from 'axios';
import { AppState } from '../App';

interface SignaturesFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const SignaturesForm: React.FC<SignaturesFormProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    tradeId: '',
    type: 'taker' as 'taker' | 'maker',
    address: '',
    details: '',
    signature: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.apiKey) {
      updateState({ error: 'API Key is required' });
      return;
    }

    updateState({ loading: true, error: null, response: null });

    try {
      // Parse the details JSON string
      let parsedDetails;
      try {
        parsedDetails = JSON.parse(formData.details);
      } catch (parseError) {
        updateState({ 
          error: 'Invalid JSON format in details field', 
          loading: false 
        });
        return;
      }

      const requestBody = {
        tradeId: formData.tradeId,
        type: formData.type,
        address: formData.address,
        details: parsedDetails,
        signature: formData.signature
      };

      const response = await axios.post('http://localhost:3001/api/signatures', {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="form-container">
      <h4>POST /v1/exchange/stablefx/signatures</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Trade ID:</label>
          <input
            type="text"
            name="tradeId"
            value={formData.tradeId}
            onChange={handleChange}
            placeholder="e.g., 43b62d75-b9ea-4562-9648-5efbef53974e"
            required
          />
          <small className="form-hint">
            Enter the Trade ID from the trades endpoint
          </small>
        </div>
        
        <div className="form-group">
          <label>Type:</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="taker">Taker</option>
            <option value="maker">Maker</option>
          </select>
          <small className="form-hint">
            Specify whether this is a taker or maker signature
          </small>
        </div>
        
        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., 0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2"
            required
          />
          <small className="form-hint">
            Enter the wallet address associated with this signature
          </small>
        </div>
        
        <div className="form-group">
          <label>Details (JSON):</label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder='{"consideration": {"quoteId": "0x...", "base": "0x...", "quote": "0x...", "quoteAmount": 1000200000, "baseAmount": 913390000, "maturity": 1755874296}, "fee": 200000, "nonce": 810289489, "deadline": 1755788196, "recipient": "0x..."}'
            rows={8}
            required
          />
          <small className="form-hint">
            Enter the details object as valid JSON. Include consideration, fee, nonce, deadline, and recipient fields.
          </small>
        </div>
        
        <div className="form-group">
          <label>Signature:</label>
          <input
            type="text"
            name="signature"
            value={formData.signature}
            onChange={handleChange}
            placeholder="e.g., 0xf34466c7f98b38b2343ad29017437294a69748934414bf338b6733d4dd91ce4c..."
            required
          />
          <small className="form-hint">
            Enter the cryptographic signature (hex string starting with 0x)
          </small>
        </div>
        
        <button type="submit" disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Submit Signature'}
        </button>
      </form>
    </div>
  );
};

export default SignaturesForm;
