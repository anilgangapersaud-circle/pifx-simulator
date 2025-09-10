import React, { useState } from 'react';
import { AppState } from '../App';
import axios from 'axios';
import ResponseDisplay from '../components/ResponseDisplay';

interface MakerNetBalancesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const MakerNetBalancesPage: React.FC<MakerNetBalancesPageProps> = ({ state, updateState }) => {
  const [formData, setFormData] = useState({
    contractAddress: '0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1', // FxEscrow proxy contract
    tradeIds: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  // Helper function to parse trade IDs
  const parseTradeIds = (tradeIdsInput: string): number[] => {
    if (!tradeIdsInput.trim()) return [];
    
    return tradeIdsInput
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id >= 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tradeIds.trim()) {
      setError('At least one Trade ID is required');
      return;
    }

    const tradeIds = parseTradeIds(formData.tradeIds);
    if (tradeIds.length === 0) {
      setError('Please enter valid trade IDs (comma-separated numbers)');
      return;
    }

    if (!formData.contractAddress) {
      setError('Contract address is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload = {
        contractAddress: formData.contractAddress,
        tradeIds: tradeIds
      };

      const result = await axios.post('http://localhost:3001/api/getMakerNetBalances', payload);
      
      setResponse(result.data);

    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                     err.response.data?.message || 
                     `HTTP ${err.response.status}: ${err.response.statusText}`;
        
        if (err.response.data?.details) {
          errorMessage += ` - ${JSON.stringify(err.response.data.details)}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Request failed to send';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>Get Maker Net Balances</h2>
      <p>Get the net balances for a maker across multiple trades by directly querying the contract's getMakerNetBalances function using web3js.</p>
      
      {/* Info about the function */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', border: '1px solid #667eea', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontWeight: 'bold', color: '#667eea' }}>Contract Read Function</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
          This function calculates the net balances (positive/negative amounts) for each token across the specified trade IDs. 
          It shows what the maker would need to deposit or would receive in a net settlement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="api-form" style={{ width: '100%' }}>
        
        {/* Contract Information */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Contract Information</legend>
          
          {/* Contract Address */}
          <div className="form-group">
            <label htmlFor="contractAddress">Contract Address *</label>
            <input
              type="text"
              id="contractAddress"
              value={formData.contractAddress}
              onChange={(e) => handleInputChange('contractAddress', e.target.value)}
              placeholder="0x... (FxEscrow contract address)"
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              The deployed FxEscrow contract address on the target blockchain.
            </small>
          </div>
        </fieldset>

        {/* Trade IDs */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Trade Information</legend>
          
          <div className="form-group">
            <label htmlFor="tradeIds">Trade ID(s) *</label>
            <input
              type="text"
              id="tradeIds"
              value={formData.tradeIds}
              onChange={(e) => handleInputChange('tradeIds', e.target.value)}
              placeholder="Enter trade ID(s) - single: 123, multiple: 123,124,125"
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              Enter one or more trade IDs separated by commas. The function will calculate net balances across all specified trades.
            </small>
            
            {/* Show parsed trade IDs preview */}
            {formData.tradeIds && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f7fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const tradeIds = parseTradeIds(formData.tradeIds);
                  const validIds = tradeIds.length > 0;
                  
                  if (!validIds) {
                    return (
                      <div style={{ color: '#e53e3e', fontSize: '0.9rem' }}>
                        ⚠️ No valid trade IDs found. Please enter numeric values.
                      </div>
                    );
                  }
                  
                  return (
                    <div>
                      <div style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '500' }}>
                        📊 Net Balance Calculation: {tradeIds.length} trade{tradeIds.length > 1 ? 's' : ''}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Trade IDs: {tradeIds.join(', ')}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div style={{ 
          marginTop: '2rem',
          textAlign: 'center',
          padding: '1.5rem',
          backgroundColor: '#f0fff4',
          border: '2px solid #38a169',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
            <h3 style={{ 
              margin: 0, 
              color: '#38a169'
            }}>
              Get Maker Net Balances
            </h3>
          </div>
          
          <button 
            type="submit"
            className="example-button"
            style={{ 
              backgroundColor: '#38a169', 
              fontWeight: 'bold',
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '6px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(56, 161, 105, 0.3)',
              opacity: 1
            }}
            title="Get net balances from the contract"
            disabled={loading || !formData.contractAddress}
          >
            {loading ? 'Getting Balances...' : '📊 Get Net Balances'}
          </button>
          
          {!formData.contractAddress && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
              Enter contract address
            </div>
          )}
        </div>
      </form>

      {/* Response Display */}
      {(response || error || loading) && (
        <ResponseDisplay 
          response={response}
          error={error}
          loading={loading}
        />
      )}
    </div>
  );
};

export default MakerNetBalancesPage;
