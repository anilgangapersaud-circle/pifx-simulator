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
        <p>Execute token delivery as the taker using Permit2 and Circle's Programmable Wallets</p>
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
          This page uses Circle's <code>createContractExecutionTransaction</code> API to execute the <code>takerDeliver</code> function 
          on the FxEscrow smart contract. Features integrated Permit2 signing with web3js for automatic permit generation.
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
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Contract Function</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            <code>takerDeliver(uint256, PermitTransferFrom, bytes)</code>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Deliver tokens using Permit2
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
        backgroundColor: state.walletApiKey && state.entitySecret && state.walletId ? '#f0fff4' : '#fffaf0',
        border: `1px solid ${state.walletApiKey && state.entitySecret && state.walletId ? '#38a169' : '#ed8936'}`,
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          color: state.walletApiKey && state.entitySecret && state.walletId ? '#38a169' : '#ed8936', 
          marginTop: 0 
        }}>
          {state.walletApiKey && state.entitySecret && state.walletId ? '✅' : '⚠️'} Prerequisites Check
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.walletApiKey ? '#38a169' : '#e53e3e' }}>
              {state.walletApiKey ? '✅' : '❌'}
            </span>
            <span>Wallet API Key</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.entitySecret ? '#38a169' : '#e53e3e' }}>
              {state.entitySecret ? '✅' : '❌'}
            </span>
            <span>Entity Secret</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: state.walletId ? '#38a169' : '#e53e3e' }}>
              {state.walletId ? '✅' : '❌'}
            </span>
            <span>Wallet ID</span>
          </div>
        </div>
        {!(state.walletApiKey && state.entitySecret && state.walletId) && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#8b5738' }}>
            💡 <strong>Missing credentials:</strong> Please configure your Circle credentials in Settings before proceeding.
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
          <p><strong>Circle SDK Method:</strong> <code>createContractExecutionTransaction</code></p>
          <p><strong>Contract Function:</strong> <code>takerDeliver(uint256,((address,uint256),uint256,uint256),bytes)</code></p>
          <p><strong>Fee Level:</strong> <code>MEDIUM</code> (automatically configured)</p>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>Function Parameters:</strong>
            <ul style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.9rem',
              margin: '0.5rem 0'
            }}>
              <li><strong>id:</strong> Trade ID (uint256)</li>
              <li><strong>permit:</strong> PermitTransferFrom struct containing:
                <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                  <li><strong>permitted.token:</strong> Token contract address</li>
                  <li><strong>permitted.amount:</strong> Amount to transfer</li>
                  <li><strong>nonce:</strong> Unique nonce for replay protection</li>
                  <li><strong>deadline:</strong> Expiration timestamp</li>
                </ul>
              </li>
              <li><strong>signature:</strong> Permit signature (bytes)</li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Example ABI Parameters:</strong>
            <pre style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
{`[
  123456,  // tradeId
  [
    [
      "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",  // token
      "1500300000"  // amount
    ],
    "1",  // nonce
    "1740000000"  // deadline
  ],
  "0x1234567890abcdef..."  // signature
]`}
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
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#319795' }}>🚀 Advanced Token Transfer</h4>
        <p style={{ margin: 0, color: '#2c5aa0', fontSize: '0.9rem' }}>
          This integration demonstrates advanced DeFi patterns using Permit2 for efficient token transfers. 
          Perfect for applications requiring seamless user experiences with minimal gas overhead.
        </p>
      </div>
    </div>
  );
};

export default TakerDeliverPage;
