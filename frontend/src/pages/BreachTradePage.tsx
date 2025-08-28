import React from 'react';
import { AppState } from '../App';
import BreachTradeForm from '../components/BreachTradeForm';

interface BreachTradePageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const BreachTradePage: React.FC<BreachTradePageProps> = ({ state, updateState }) => {
  return (
    <div className="page-container" style={{ maxWidth: 'none', width: '98%' }}>
      <div className="page-header">
        <h1>Breach Trade</h1>
        <p>Breach a confirmed trade that has passed its maturity date using Circle's Programmable Wallets</p>
      </div>

      {/* Integration Info Banner */}
      <div style={{
        backgroundColor: '#fed7d7',
        border: '2px solid #e53e3e',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
          <h3 style={{ margin: 0, color: '#e53e3e' }}>Breach Trade Function</h3>
        </div>
        <p style={{ margin: '0.5rem 0', color: '#2c5aa0' }}>
          This page uses Circle's <code>createContractExecutionTransaction</code> API to execute the <code>breach</code> function 
          on the FxEscrow smart contract. This function allows authorized parties to breach confirmed trades after maturity.
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
          backgroundColor: '#fed7d7',
          borderRadius: '6px',
          border: '1px solid #e53e3e'
        }}>
          <div style={{ fontWeight: 'bold', color: '#e53e3e' }}>Contract Function</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            <code>breach(uint256 id)</code>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Breach confirmed trade after maturity
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
          <div style={{ fontWeight: 'bold', color: '#ed8936' }}>Authorization</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            Taker, Maker, or Relayer
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Only authorized parties can breach
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '0.75rem',
          backgroundColor: '#e6fffa',
          borderRadius: '6px',
          border: '1px solid #319795'
        }}>
          <div style={{ fontWeight: 'bold', color: '#319795' }}>Requirements</div>
          <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginTop: '0.25rem' }}>
            Confirmed & Past Maturity
          </div>
          <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
            Trade must be confirmed and matured
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
          <p><strong>Endpoint:</strong> <code>POST /api/breachTrade</code></p>
          <p><strong>Circle SDK Method:</strong> <code>createContractExecutionTransaction</code></p>
          <p><strong>Contract Function:</strong> <code>breach(uint256)</code></p>
          <p><strong>Fee Level:</strong> <code>MEDIUM</code> (automatically configured)</p>
          
          <div style={{ marginTop: '1rem' }}>
            <strong>Function Behavior:</strong>
            <ul style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.9rem',
              margin: '0.5rem 0'
            }}>
              <li>Verifies caller is taker, maker, or authorized relayer</li>
              <li>Checks trade status is "confirmed"</li>
              <li>Ensures current timestamp is past trade maturity</li>
              <li>Sets trade status to "breach"</li>
              <li>Refunds funded amounts to respective parties</li>
              <li>Emits TradeStatusChanged event</li>
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
  123456  // tradeId (uint256)
]`}
            </pre>
          </div>
        </div>
      </details>

      {/* Main form */}
      <div style={{ width: '100%' }}>
        <BreachTradeForm state={state} updateState={updateState} />
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#fef5e7',
        borderRadius: '6px',
        border: '1px solid #ed8936',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#ed8936' }}>⚠️ Important Notice</h4>
        <p style={{ margin: 0, color: '#8b5738', fontSize: '0.9rem' }}>
          Breaching a trade is a serious action that should only be performed when a confirmed trade has passed its maturity date.
          This action will permanently change the trade status and trigger refunds to the respective parties.
        </p>
      </div>
    </div>
  );
};

export default BreachTradePage;
