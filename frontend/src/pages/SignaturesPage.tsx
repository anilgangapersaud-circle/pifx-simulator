import React from 'react';
import { AppState } from '../App';
import SignaturesForm from '../components/SignaturesForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface SignaturesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const SignaturesPage: React.FC<SignaturesPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>✍️ Signatures</h1>
        <p>Submit cryptographic signatures for trades</p>
        <div className="endpoint-info">
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/exchange/cps/signatures</span>
        </div>
      </div>
      
      <div className="page-content">
        <div className="form-section">
          <SignaturesForm state={state} updateState={updateState} />
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

export default SignaturesPage;
