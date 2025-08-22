import React from 'react';
import { AppState } from '../App';
import ContractExecutionForm from '../components/ContractExecutionForm';

interface ContractExecutionPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const ContractExecutionPage: React.FC<ContractExecutionPageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container" style={{ maxWidth: 'none', width: '98%' }}>
      <div className="page-header">
        <h1>Contract Execution</h1>
        <p>Execute smart contract functions using Circle's Programmable Wallets</p>
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
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🔗</span>
          <h3 style={{ margin: 0, color: '#319795' }}>Circle SDK Integration</h3>
        </div>
        <p style={{ margin: '0.5rem 0', color: '#2c5aa0' }}>
          This page uses Circle's <code>createContractExecutionTransaction</code> API to execute the <code>recordTrade</code> function 
          on the FxEscrow smart contract. No private keys needed - Circle handles all the blockchain interactions securely.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Secure wallet management
          </div>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Automatic gas handling
          </div>
          <div style={{ 
            backgroundColor: '#f0fff4', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '4px',
            border: '1px solid #38a169',
            fontSize: '0.85rem'
          }}>
            ✅ Enterprise-grade infrastructure
          </div>
        </div>
      </div>

      {/* Step indicators for the workflow */}
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
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Step 1</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0' }}>Get Presign Data</div>
          <div style={{ fontSize: '0.8rem', color: '#718096' }}>Use Signatures page</div>
        </div>
        
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#e6fffa',
          borderRadius: '6px',
          border: '1px solid #319795'
        }}>
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Step 2</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0' }}>Sign Typed Data</div>
          <div style={{ fontSize: '0.8rem', color: '#718096' }}>Generate signatures</div>
        </div>

        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#e6fffa',
          borderRadius: '6px',
          border: '2px solid #319795'
        }}>
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Step 3</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0' }}>Execute Contract</div>
          <div style={{ fontSize: '0.8rem', color: '#319795' }}>Submit via Circle SDK ← You are here</div>
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
          <p><strong>Endpoint:</strong> <code>POST /api/recordTrade</code></p>
          <p><strong>Circle SDK Method:</strong> <code>createContractExecutionTransaction</code></p>
          <p><strong>Contract Function:</strong> <code>recordTrade(address,((bytes32,address,address,uint256,uint256,uint256),address,uint256,uint256,uint256),bytes,address,(uint256,uint256,uint256),bytes)</code></p>
          <p><strong>Fee Level:</strong> <code>MEDIUM</code> (automatically configured)</p>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>Example ABI Parameters Structure:</strong>
            <pre style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
{`[
  "0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2", // taker
  [
    [
      "0x00000000000000000000000000000000fe740ff6c7c1461697cf6eae82f43ae5", // quoteId
      "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4", // base
      "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", // quote
      1370080000, // baseAmount
      1500300000, // quoteAmount
      1755964120  // maturity
    ],
    "0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2", // recipient
    300000, // fee
    1,      // nonce
    1755964120 // deadline
  ],
  "0x12c4e582...", // takerSignature
  "0xf0e7ccf7817b30fa0dd6bdeaea3ad54c140647b2", // maker
  [
    137008, // fee
    1,      // nonce
    1755964157 // deadline
  ],
  "0xd66faf403..." // makerSignature
]`}
            </pre>
          </div>
        </div>
      </details>

      {/* Main form */}
      <div style={{ width: '100%' }}>
        <ContractExecutionForm state={state} updateState={updateState} />
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>🚀 Ready for Production</h4>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
          This integration uses Circle's production-ready infrastructure for secure, reliable smart contract execution.
          Perfect for applications that need enterprise-grade blockchain interactions without the complexity.
        </p>
      </div>
    </div>
  );
};

export default ContractExecutionPage;
