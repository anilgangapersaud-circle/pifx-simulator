import React from 'react';
import { AppState } from '../App';
import TradesForm from '../components/TradesForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface TradesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const TradesPage: React.FC<TradesPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💼 Create Trade</h1>
        <p>Create a new trade using a quote ID</p>
        <div className="endpoint-info">
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/exchange/stablefx/trades</span>
        </div>
      </div>
      
      <div className="page-content">
        <div className="form-section">
          <TradesForm state={state} updateState={updateState} />
        </div>
        
        <div className="response-section">
          <ResponseDisplay 
            response={state.response} 
            loading={state.loading} 
            error={state.error} 
          />
        </div>
      </div>
    </div>
  );
};

export default TradesPage;
