import React from 'react';
import { AppState } from '../App';
import QuoteCreationForm from '../components/QuoteCreationForm';
import TradeCreationForm from '../components/TradeCreationForm';
import GetSignaturesForm from '../components/GetSignaturesForm';
import SignTypedDataForm from '../components/SignTypedDataForm';
import RegisterSignatureForm from '../components/RegisterSignatureForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface GetSignaturesPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const GetSignaturesPage: React.FC<GetSignaturesPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎯 Circle PiFX Complete Trading Workflow</h1>
        <p>Welcome to the Circle PiFX Simulator! This tool guides you through the complete end-to-end trading and signature process.</p>
        
        <div style={{ 
          background: '#f0f7ff', 
          border: '1px solid #0066cc', 
          borderRadius: '8px', 
          padding: '1rem', 
          margin: '1rem 0',
          fontSize: '0.9rem'
        }}>
          <strong>🚀 What you'll accomplish:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Create a currency exchange quote</li>
            <li>Execute a trade based on that quote</li>
            <li>Generate presign data for the trade</li>
            <li>Sign the typed data using your wallet</li>
            <li>Register the signature to complete the process</li>
          </ul>
          <small><strong>💡 Tip:</strong> Data flows automatically between steps - just fill in the first form and watch the magic happen!</small>
        </div>
        
        <div className="endpoint-info">
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/exchange/cps/trades</span>
          <span style={{ margin: '0 0.3rem' }}>→</span>
          <span className="method get">GET</span>
          <span className="endpoint-path">/v1/exchange/cps/signatures/presign</span>
          <span style={{ margin: '0 0.3rem' }}>→</span>
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/w3s/developer/sign/typedData</span>
          <span style={{ margin: '0 0.3rem' }}>→</span>
          <span className="method post">POST</span>
          <span className="endpoint-path">/v1/exchange/cps/signatures</span>
        </div>
        
        <div style={{ 
          background: '#fff9e6', 
          border: '1px solid #f59e0b', 
          borderRadius: '8px', 
          padding: '1rem', 
          margin: '1rem 0',
          fontSize: '0.9rem'
        }}>
          <strong>⚙️ Before you start:</strong> Make sure to configure your API keys and wallet settings using the Settings button in the top-right corner.
        </div>
      </div>
      
      <div style={{ padding: '2rem', maxWidth: 'none', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%' }}>
          {/* Step 1: Create Quote */}
          <div className="workflow-step">
            <h3>Step 1: Create Quote</h3>
            <div className="step-content-grid">
              <div className="form-section">
                <QuoteCreationForm state={state} updateState={updateState} />
              </div>
              <div className="response-section">
                <ResponseDisplay 
                  response={state.quoteResponse} 
                  loading={state.quoteLoading} 
                  error={state.quoteError} 
                />
              </div>
            </div>
          </div>

          {/* Step 2: Create Trade */}
          <div className="workflow-step">
            <h3>Step 2: Create Trade</h3>
            <p>Create a trade using the quote from Step 1</p>
            <div className="step-content-grid">
              <div className="form-section">
                <TradeCreationForm state={state} updateState={updateState} />
              </div>
              <div className="response-section">
                <ResponseDisplay 
                  response={state.tradeResponse} 
                  loading={state.tradeLoading} 
                  error={state.tradeError} 
                />
              </div>
            </div>
          </div>

          {/* Step 3: Get Presign Data */}
          <div className="workflow-step">
            <h3>Step 3: Get Presign Data</h3>
            <p>Get the presign data using the trade from Step 2</p>
            <div className="step-content-grid">
              <div className="form-section">
                <GetSignaturesForm state={state} updateState={updateState} />
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

          {/* Step 4: Sign Typed Data */}
          <div className="workflow-step">
            <h3>Step 4: Sign Typed Data</h3>
            <p>Use the presign response to sign the typed data with your wallet</p>
            <div style={{ marginTop: '1rem' }}>
              <SignTypedDataForm state={state} updateState={updateState} />
            </div>
            
            {/* Signing Response */}
            <div style={{ marginTop: '2rem' }}>
              <ResponseDisplay 
                response={state.signingResponse} 
                loading={state.signingLoading} 
                error={state.signingError} 
              />
            </div>
          </div>

          {/* Step 5: Register Signature */}
          <div className="workflow-step">
            <h3>Step 5: Register Signature</h3>
            <p>Register the signature from Step 4 with Circle CPS API</p>
            <div style={{ marginTop: '1rem' }}>
              <RegisterSignatureForm state={state} updateState={updateState} />
            </div>
            
            {/* Registration Response */}
            <div style={{ marginTop: '2rem' }}>
              <ResponseDisplay 
                response={state.registrationResponse} 
                loading={state.registrationLoading} 
                error={state.registrationError} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetSignaturesPage;
