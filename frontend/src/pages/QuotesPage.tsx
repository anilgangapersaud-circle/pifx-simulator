import React from 'react';
import { AppState } from '../App';
import QuotesForm from '../components/QuotesForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface QuotesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💱 Quotes</h1>
        <p>Get exchange quotes for currency conversion</p>
        <div className="endpoint-info">
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/exchange/cps/quotes</span>
        </div>
      </div>
      
      <div className="page-content">
        <div className="form-section">
          <QuotesForm state={state} updateState={updateState} />
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

export default QuotesPage;
