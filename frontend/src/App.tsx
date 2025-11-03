import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import HamburgerMenu from './components/HamburgerMenu';
import SettingsPanel from './components/SettingsPanel';

import QuotesPage from './pages/QuotesPage';
import TradesPage from './pages/TradesPage';
import SignaturesPage from './pages/SignaturesPage';
import GetTradesPage from './pages/GetTradesPage';
import GetTradeByIdPage from './pages/GetTradeByIdPage';
import GetSignaturesPage from './pages/GetSignaturesPage';
import ContractExecutionPage from './pages/ContractExecutionPage';
import TakerDeliverPage from './pages/TakerDeliverPage';
import CompleteWorkflowPage from './pages/CompleteWorkflowPage';


export interface AppState {
  environment: 'smokebox' | 'sandbox';
  apiKey: string;
  walletApiKey: string;
  entitySecret: string;
  publicKeyPem: string;
  walletId: string; // Keep for backward compatibility
  makerWalletId: string;
  takerWalletId: string;
  makerWalletAddress: string;
  takerWalletAddress: string;
  currentFlowType?: 'taker' | 'maker'; // Track current flow type for UI theming
  // Token balance
  tokenBalance: any;
  balanceLoading: boolean;
  balanceError: string | null;
  showBalanceToast: boolean;
  // Step responses
  quoteResponse: any;
  tradeResponse: any;
  response: any; // presign response
  signingResponse: any;
  registrationResponse: any;
  // Loading states
  quoteLoading: boolean;
  tradeLoading: boolean;
  loading: boolean; // presign loading
  signingLoading: boolean;
  registrationLoading: boolean;
  // Error states
  quoteError: string | null;
  tradeError: string | null;
  error: string | null; // presign error
  signingError: string | null;
  registrationError: string | null;
  settingsOpen: boolean;
  // Store presign request data for Step 3
  lastPresignTradeId?: string;
  lastPresignSelector?: 'taker' | 'maker';
  lastPresignRecipientAddress?: string;
}

// Session storage utilities
const SESSION_KEYS = {
  API_KEY: 'circle_api_key',
  WALLET_API_KEY: 'circle_wallet_api_key',
  ENTITY_SECRET: 'circle_entity_secret',
  PUBLIC_KEY_PEM: 'circle_public_key_pem',
  MAKER_WALLET_ID: 'circle_maker_wallet_id',
  TAKER_WALLET_ID: 'circle_taker_wallet_id',
  MAKER_WALLET_ADDRESS: 'circle_maker_wallet_address',
  TAKER_WALLET_ADDRESS: 'circle_taker_wallet_address',
  ENVIRONMENT: 'circle_environment'
};

const getFromSession = (key: string, defaultValue: any) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToSession = (key: string, value: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to session storage:', error);
  }
};

// Helper function to get appropriate wallet ID based on flow type
export const getWalletIdForFlow = (state: AppState, flowType: 'taker' | 'maker'): string => {
  if (flowType === 'taker') {
    return state.takerWalletId || state.walletId || ''; // Fallback to legacy walletId then empty string
  } else {
    return state.makerWalletId || state.walletId || ''; // Fallback to legacy walletId then empty string
  }
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEYS.API_KEY);
    sessionStorage.removeItem(SESSION_KEYS.WALLET_API_KEY);
    sessionStorage.removeItem(SESSION_KEYS.ENTITY_SECRET);
    sessionStorage.removeItem(SESSION_KEYS.PUBLIC_KEY_PEM);
    sessionStorage.removeItem(SESSION_KEYS.MAKER_WALLET_ID);
    sessionStorage.removeItem(SESSION_KEYS.TAKER_WALLET_ID);
    sessionStorage.removeItem(SESSION_KEYS.ENVIRONMENT);
  } catch (error) {
    console.warn('Failed to clear session storage:', error);
  }
};

function AppContent() {
  const location = useLocation();
  
  // Migration logic: if maker/taker wallet IDs are empty but legacy walletId exists, use it for both
  const legacyWalletId = getFromSession('circle_wallet_id', ''); // Direct key for one-time migration
  const makerWalletId = getFromSession(SESSION_KEYS.MAKER_WALLET_ID, '') || legacyWalletId;
  const takerWalletId = getFromSession(SESSION_KEYS.TAKER_WALLET_ID, '') || legacyWalletId;
  
  const [state, setState] = useState<AppState>({
    environment: getFromSession(SESSION_KEYS.ENVIRONMENT, 'smokebox'),
    apiKey: getFromSession(SESSION_KEYS.API_KEY, ''),
    walletApiKey: getFromSession(SESSION_KEYS.WALLET_API_KEY, ''),
    entitySecret: getFromSession(SESSION_KEYS.ENTITY_SECRET, ''),
    publicKeyPem: getFromSession(SESSION_KEYS.PUBLIC_KEY_PEM, ''),
    walletId: legacyWalletId, // Keep for migration purposes only
    makerWalletId: makerWalletId,
    takerWalletId: takerWalletId,
    makerWalletAddress: getFromSession(SESSION_KEYS.MAKER_WALLET_ADDRESS, ''),
    takerWalletAddress: getFromSession(SESSION_KEYS.TAKER_WALLET_ADDRESS, ''),
    currentFlowType: 'taker', // Default to taker flow
    // Token balance
    tokenBalance: null,
    balanceLoading: false,
    balanceError: null,
    showBalanceToast: false,
    // Step responses
    quoteResponse: null,
    tradeResponse: null,
    response: null, // presign response
    signingResponse: null,
    registrationResponse: null,
    // Loading states
    quoteLoading: false,
    tradeLoading: false,
    loading: false, // presign loading
    signingLoading: false,
    registrationLoading: false,
    // Error states
    quoteError: null,
    tradeError: null,
    error: null, // presign error
    signingError: null,
    registrationError: null,
    settingsOpen: false
  });

  // One-time migration effect
  useEffect(() => {
    if (legacyWalletId && (!makerWalletId || !takerWalletId)) {
      // Migrate legacy wallet ID to both maker and taker if they're empty
      if (!makerWalletId) {
        saveToSession(SESSION_KEYS.MAKER_WALLET_ID, legacyWalletId);
      }
      if (!takerWalletId) {
        saveToSession(SESSION_KEYS.TAKER_WALLET_ID, legacyWalletId);
      }
      // Remove legacy wallet ID from session storage after migration
      try {
        sessionStorage.removeItem('circle_wallet_id');
      } catch (error) {
        console.warn('Failed to remove legacy wallet ID:', error);
      }
    }
  }, []); // Run only once on mount

  // Helper function to get token image
  const getTokenImage = (symbol: string, tokenAddress?: string) => {
    const tokenImages: { [key: string]: string } = {
      'USDC': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ43MuDqq54iD1ZCRL_uthAPkfwSSL-J5qI_Q&s',
      'USDC-TESTNET': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ43MuDqq54iD1ZCRL_uthAPkfwSSL-J5qI_Q&s',
      'EURC': 'https://assets.coingecko.com/coins/images/26045/standard/euro.png',
      'ETH': 'https://www.citypng.com/public/uploads/preview/ethereum-eth-round-logo-icon-png-701751694969815akblwl2552.png',
      'ETH-SEPOLIA': 'https://www.citypng.com/public/uploads/preview/ethereum-eth-round-logo-icon-png-701751694969815akblwl2552.png'
    };
    
    return tokenImages[symbol] || `https://via.placeholder.com/24/e2e8f0/718096?text=${symbol?.charAt(0) || '?'}`;
  };

  // Function to check token balance
  const checkTokenBalance = async () => {
    const currentWalletId = getWalletIdForFlow(state, state.currentFlowType || 'taker');
    
    if (!currentWalletId) {
      updateState({ 
        balanceError: 'No wallet ID configured for current flow type',
        balanceLoading: false,
        showBalanceToast: true
      });
      return;
    }

    if (!state.walletApiKey) {
      updateState({ 
        balanceError: 'Wallet API key not configured',
        balanceLoading: false,
        showBalanceToast: true
      });
      return;
    }

    updateState({ 
      balanceLoading: true, 
      balanceError: null,
      tokenBalance: null 
    });

    try {
      const response = await fetch('http://localhost:3001/api/getTokenBalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletApiKey: state.walletApiKey,
          walletId: currentWalletId,
          environment: state.environment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch token balance');
      }

      updateState({ 
        tokenBalance: data,
        balanceLoading: false,
        balanceError: null,
        showBalanceToast: true
      });
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      updateState({ 
        balanceError: error.message || 'Failed to fetch token balance',
        balanceLoading: false,
        tokenBalance: null,
        showBalanceToast: true
      });
    }
  };

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
    
    // Save API keys and environment to session storage
    if (updates.apiKey !== undefined) {
      saveToSession(SESSION_KEYS.API_KEY, updates.apiKey);
    }
    if (updates.walletApiKey !== undefined) {
      saveToSession(SESSION_KEYS.WALLET_API_KEY, updates.walletApiKey);
    }
    if (updates.entitySecret !== undefined) {
      saveToSession(SESSION_KEYS.ENTITY_SECRET, updates.entitySecret);
    }
    if (updates.publicKeyPem !== undefined) {
      saveToSession(SESSION_KEYS.PUBLIC_KEY_PEM, updates.publicKeyPem);
    }
    if (updates.makerWalletId !== undefined) {
      saveToSession(SESSION_KEYS.MAKER_WALLET_ID, updates.makerWalletId);
    }
    if (updates.takerWalletId !== undefined) {
      saveToSession(SESSION_KEYS.TAKER_WALLET_ID, updates.takerWalletId);
    }
    if (updates.makerWalletAddress !== undefined) {
      saveToSession(SESSION_KEYS.MAKER_WALLET_ADDRESS, updates.makerWalletAddress);
    }
    if (updates.takerWalletAddress !== undefined) {
      saveToSession(SESSION_KEYS.TAKER_WALLET_ADDRESS, updates.takerWalletAddress);
    }
    if (updates.environment !== undefined) {
      saveToSession(SESSION_KEYS.ENVIRONMENT, updates.environment);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <HamburgerMenu currentPath={location.pathname} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="balance-button"
              onClick={checkTokenBalance}
              disabled={state.balanceLoading}
              title={`Check token balance for ${state.currentFlowType || 'taker'} wallet`}
            >
              {state.balanceLoading ? '⏳' : '💳'} Wallet
            </button>
            <button 
              className="settings-button"
              onClick={() => updateState({ settingsOpen: true })}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </header>
      
      <main className="App-main">
        <Routes>
          <Route path="/" element={<CompleteWorkflowPage state={state} updateState={updateState} />} />
          <Route path="/get-signatures" element={<GetSignaturesPage state={state} updateState={updateState} />} />
          <Route path="/quotes" element={<QuotesPage state={state} updateState={updateState} />} />
          <Route path="/trades" element={<TradesPage state={state} updateState={updateState} />} />
          <Route path="/signatures" element={<SignaturesPage state={state} updateState={updateState} />} />
          <Route path="/contract-execution" element={<ContractExecutionPage state={state} updateState={updateState} />} />
          <Route path="/taker-deliver" element={<TakerDeliverPage state={state} updateState={updateState} />} />
          <Route path="/get-trades" element={<GetTradesPage state={state} updateState={updateState} />} />
          <Route path="/get-trade" element={<GetTradeByIdPage state={state} updateState={updateState} />} />
          <Route path="/complete-workflow" element={<CompleteWorkflowPage state={state} updateState={updateState} />} />
        </Routes>
      </main>

      <SettingsPanel
        isOpen={state.settingsOpen}
        onClose={() => updateState({ settingsOpen: false })}
        apiKey={state.apiKey}
        onApiKeyChange={(apiKey) => updateState({ apiKey })}
        walletApiKey={state.walletApiKey}
        onWalletApiKeyChange={(walletApiKey) => updateState({ walletApiKey })}
        entitySecret={state.entitySecret}
        onEntitySecretChange={(entitySecret) => updateState({ entitySecret })}
        publicKeyPem={state.publicKeyPem}
        onPublicKeyPemChange={(publicKeyPem) => updateState({ publicKeyPem })}
        makerWalletId={state.makerWalletId}
        onMakerWalletIdChange={(makerWalletId) => updateState({ makerWalletId })}
        takerWalletId={state.takerWalletId}
        onTakerWalletIdChange={(takerWalletId) => updateState({ takerWalletId })}
        makerWalletAddress={state.makerWalletAddress}
        onMakerWalletAddressChange={(makerWalletAddress) => updateState({ makerWalletAddress })}
        takerWalletAddress={state.takerWalletAddress}
        onTakerWalletAddressChange={(takerWalletAddress) => updateState({ takerWalletAddress })}
        environment={state.environment}
        onEnvironmentChange={(environment) => updateState({ environment })}
      />

      {/* Token Balance Toast */}
      {state.showBalanceToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '450px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s ease-out',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: state.balanceError ? 'none' : '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: state.balanceError ? '#fed7d7' : '#f0fff4'
          }}>
            <h4 style={{ 
              margin: 0, 
              color: state.balanceError ? '#c53030' : '#38a169',
              fontSize: '1rem'
            }}>
              {state.balanceError ? '❌ Balance Error' : `💰 Token Balances`}
            </h4>
            <button 
              onClick={() => updateState({ showBalanceToast: false })}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: state.balanceError ? '#c53030' : '#38a169'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ padding: '1rem' }}>
            {state.balanceError ? (
              <p style={{ margin: 0, color: '#c53030' }}>
                {state.balanceError}
              </p>
            ) : state.tokenBalance ? (
              <div>
                  {state.tokenBalance.tokens && state.tokenBalance.tokens.length > 0 ? (
                    <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {state.tokenBalance.tokens.map((tokenBalance: any, index: number) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img 
                              src={getTokenImage(tokenBalance.token?.symbol, tokenBalance.token?.tokenAddress)}
                              alt={tokenBalance.token?.symbol}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0'
                              }}
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.src = `https://via.placeholder.com/32/e2e8f0/718096?text=${tokenBalance.token?.symbol?.charAt(0) || '?'}`;
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {tokenBalance.token?.symbol || 'Unknown'}
                                {tokenBalance.token?.isNative && (
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    backgroundColor: '#e6fffa', 
                                    color: '#234e52', 
                                    padding: '0.1rem 0.4rem', 
                                    borderRadius: '12px',
                                    fontWeight: 'normal'
                                  }}>
                                    NATIVE
                                  </span>
                                )}
                              </div>
                              <div style={{ color: '#718096', fontSize: '0.8rem' }}>
                                {tokenBalance.token?.name}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1rem' }}>
                              {parseFloat(tokenBalance.amount || '0').toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                                minimumFractionDigits: 0
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '1rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '4px', 
                      color: '#718096', 
                      textAlign: 'center',
                      fontSize: '0.9rem'
                    }}>
                      No tokens found
                    </div>
                  )}
                </div>
            ) : (
              <p style={{ margin: 0, color: '#718096' }}>
                No balance data available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;