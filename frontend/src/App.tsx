import React, { useState } from 'react';
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


export interface AppState {
  environment: 'smokebox' | 'sandbox';
  apiKey: string;
  walletApiKey: string;
  entitySecret: string;
  walletId: string;
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
  WALLET_ID: 'circle_wallet_id',
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

const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEYS.API_KEY);
    sessionStorage.removeItem(SESSION_KEYS.WALLET_API_KEY);
    sessionStorage.removeItem(SESSION_KEYS.ENTITY_SECRET);
    sessionStorage.removeItem(SESSION_KEYS.WALLET_ID);
    sessionStorage.removeItem(SESSION_KEYS.ENVIRONMENT);
  } catch (error) {
    console.warn('Failed to clear session storage:', error);
  }
};

function AppContent() {
  const location = useLocation();
  const [state, setState] = useState<AppState>({
    environment: getFromSession(SESSION_KEYS.ENVIRONMENT, 'smokebox'),
    apiKey: getFromSession(SESSION_KEYS.API_KEY, ''),
    walletApiKey: getFromSession(SESSION_KEYS.WALLET_API_KEY, ''),
    entitySecret: getFromSession(SESSION_KEYS.ENTITY_SECRET, ''),
    walletId: getFromSession(SESSION_KEYS.WALLET_ID, ''),
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
    if (updates.walletId !== undefined) {
      saveToSession(SESSION_KEYS.WALLET_ID, updates.walletId);
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
            <h1>PiFX Simulator</h1>
          </div>
          <button 
            className="settings-button"
            onClick={() => updateState({ settingsOpen: true })}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>
      
      <main className="App-main">
        <Routes>
          <Route path="/" element={<GetSignaturesPage state={state} updateState={updateState} />} />
          <Route path="/quotes" element={<QuotesPage state={state} updateState={updateState} />} />
          <Route path="/trades" element={<TradesPage state={state} updateState={updateState} />} />
          <Route path="/signatures" element={<SignaturesPage state={state} updateState={updateState} />} />
          <Route path="/get-trades" element={<GetTradesPage state={state} updateState={updateState} />} />
          <Route path="/get-trade" element={<GetTradeByIdPage state={state} updateState={updateState} />} />
          <Route path="/workflow" element={<GetSignaturesPage state={state} updateState={updateState} />} />
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
        walletId={state.walletId}
        onWalletIdChange={(walletId) => updateState({ walletId })}
        environment={state.environment}
        onEnvironmentChange={(environment) => updateState({ environment })}
      />
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