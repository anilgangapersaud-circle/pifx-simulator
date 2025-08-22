import React from 'react';
import { AppState } from '../App';
import GetTradeByIdForm from '../components/GetTradeByIdForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface GetTradeByIdPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const GetTradeByIdPage: React.FC<GetTradeByIdPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔍 Get Trade by ID</h1>
        <p>Retrieve specific trade details using trade ID</p>
        <div className="endpoint-info">
          <span className="method get">GET</span>
          <span className="endpoint-path">/v1/exchange/cps/trades/:tradeId</span>
        </div>
      </div>
      
      <div className="page-content">
        <div className="form-section">
          <GetTradeByIdForm state={state} updateState={updateState} />
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

export default GetTradeByIdPage;
