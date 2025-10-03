import React from 'react';
import { AppState } from '../App';
import GetTradesForm from '../components/GetTradesForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface GetTradesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const GetTradesPage: React.FC<GetTradesPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Get Trades</h1>
        <p>Retrieve a list of trades with optional filtering</p>
        <div className="endpoint-info">
          <span className="method get">GET</span>
          <span className="endpoint-path">/v1/exchange/stablefx/trades</span>
        </div>
      </div>
      
      <div className="page-content">
        <div className="form-section">
          <GetTradesForm state={state} updateState={updateState} />
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

export default GetTradesPage;
