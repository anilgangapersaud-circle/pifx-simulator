import React from 'react';
import { AppState } from '../App';
import TakerDeliverForm from '../components/TakerDeliverForm';

interface TakerDeliverPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const TakerDeliverPage: React.FC<TakerDeliverPageProps> = ({ state, updateState }) => {

  return (
    <div className="page-container" style={{ maxWidth: 'none', width: '98%' }}>
      <div className="page-header">
        <h1>Taker Deliver</h1>
        <p>Execute token delivery as the taker using Circle's StableFX Fund API with Permit2 signatures</p>
      </div>

      {/* Integration Info Banner */}
      <div style={{
        backgroundColor: '#e6fffa',
        border: '2px solid #319795',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📦</span>
          <h3 style={{ margin: 0, color: '#319795' }}>Taker Deliver Function</h3>
        </div>
        <p style={{ margin: '0.5rem 0', color: '#2c5aa0' }}>
          This page uses Circle's <code>StableFX Fund API</code> to execute funding operations instead of contract calls. 
          Features a 3-step workflow: Typed data retrieval, permit signing, and API execution.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Permit2 integration
          </div>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Gasless token approvals
          </div>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Automatic permit signing
          </div>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Circle StableFX Fund API
          </div>
        </div>
      </div>

      {/* Function explanation */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f7fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#e6fffa',
          borderRadius: '6px',
          border: '1px solid #319795'
        }}>
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Circle StableFX Fund API</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            <code>POST /v1/exchange/stablefx/fund</code>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Direct API funding execution
          </div>
        </div>
        
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#f0fff4',
          borderRadius: '6px',
          border: '1px solid #38a169'
        }}>
          <div style={{ fontWeight: 'bold', color: '#38a169' }}>Permit2 Integration</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            Gasless Token Approvals
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            No separate approval transaction needed
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#fef5e7',
          borderRadius: '6px',
          border: '1px solid #ed8936'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ed8936' }}>Security</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            Signature-based Authorization
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Cryptographic proof of intent
          </div>
        </div>
      </div>

      {/* Permit2 explanation */}
      <div style={{
        backgroundColor: '#f0fff4',
        border: '1px solid #38a169',
        borderRadius: '6px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#38a169' }}>📝 About Permit2</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c5aa0' }}>What is Permit2?</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
              Permit2 is a token approval system that allows users to approve token transfers via signatures instead of on-chain transactions. 
              This enables gasless approvals and better UX by bundling approvals with the actual transfer.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c5aa0' }}>How it Works</h4>
            <ul style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568', paddingLeft: '1.25rem' }}>
              <li>User signs a permit off-chain</li>
              <li>Permit includes token, amount, nonce, deadline</li>
              <li>Contract validates signature and transfers tokens</li>
              <li>No separate approval transaction needed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prerequisites check */}
      <div style={{
        backgroundColor: state.apiKey && state.environment ? '#f0fff4' : '#fffaf0',
        border: `1px solid ${state.apiKey && state.environment ? '#38a169' : '#ed8936'}`,
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          color: state.apiKey && state.environment ? '#38a169' : '#ed8936', 
          marginTop: 0 
        }}>
          {state.apiKey && state.environment ? '✅' : '⚠️'} Prerequisites Check
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.apiKey ? '#38a169' : '#e53e3e' }}>
              {state.apiKey ? '✅' : '❌'}
            </span>
            <span>API Key</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.environment ? '#38a169' : '#e53e3e' }}>
              {state.environment ? '✅' : '❌'}
            </span>
            <span>Environment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.walletApiKey && state.entitySecret ? '#38a169' : '#e53e3e' }}>
              {state.walletApiKey && state.entitySecret ? '✅' : '❌'}
            </span>
            <span>Circle SDK (for signing)</span>
          </div>
        </div>
        {!(state.apiKey && state.environment) && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#8b5738' }}>
            💡 <strong>Missing credentials:</strong> Please configure your API Key and Environment in Settings before proceeding.
          </p>
        )}
      </div>

      {/* API Information */}
      <details style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px',
        border: '1px solid #dee2e6'
      }}>
        <summary style={{ 
          fontWeight: 'bold', 
          cursor: 'pointer', 
          color: '#495057',
          marginBottom: '0.5rem'
        }}>
          📚 API Information
        </summary>
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Endpoint:</strong> <code>POST /api/takerDeliver</code></p>
          <p><strong>Circle API:</strong> <code>POST /v1/exchange/stablefx/fund</code></p>
          <p><strong>Method:</strong> Direct API call instead of contract execution</p>
          <p><strong>Parameters:</strong> permit2, signature, type, fundingMode</p>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>Note:</strong> <em>This implementation uses Circle's StableFX fund endpoint directly instead of executing smart contract functions. The permit2 data from typed data is passed along with the signature to the API.</em>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>API Request Parameters:</strong>
            <ul style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.9rem',
              margin: '0.5rem 0'
            }}>
              <li><strong>permit2:</strong> The permit2 message from typed data containing:
                <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                  <li><strong>permitted:</strong> Token and amount information</li>
                  <li><strong>spender:</strong> Contract address that will spend tokens</li>
                  <li><strong>nonce:</strong> Unique nonce for replay protection</li>
                  <li><strong>deadline:</strong> Expiration timestamp</li>
                </ul>
              </li>
              <li><strong>signature:</strong> String signature from signing the typed data</li>
              <li><strong>type:</strong> "taker" or "maker" depending on selection</li>
              <li><strong>fundingMode:</strong> "gross" for taker, "net" if maker chose net</li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Example API Request Body:</strong>
            <pre style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
{`{
  "permit2": {
    "permitted": {
      "token": "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
      "amount": "1500300000"
    },
    "spender": "0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8",
    "nonce": "1",
    "deadline": "1740000000"
  },
  "signature": "0x1234567890abcdef...",
  "type": "taker",
  "fundingMode": "gross"
}`}
            </pre>
          </div>
        </div>
      </details>

      {/* Main form */}
      <div style={{ width: '100%' }}>
        <TakerDeliverForm state={state} updateState={updateState} />
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#e6fffa',
        borderRadius: '6px',
        border: '1px solid #319795',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#319795' }}>🚀 Circle StableFX Fund Integration</h4>
        <p style={{ margin: 0, color: '#2c5aa0', fontSize: '0.9rem' }}>
          This integration demonstrates direct API-based funding using Circle's StableFX fund endpoint. 
          Replaces contract execution with API calls for streamlined funding operations.
        </p>
      </div>
    </div>
  );
};

export default TakerDeliverPage;
