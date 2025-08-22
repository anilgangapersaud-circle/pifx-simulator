import React from 'react';

interface ResponseDisplayProps {
  response: any;
  loading: boolean;
  error: string | null;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, loading, error }) => {
  if (loading) {
    return (
      <div className="response-display">
        <h3>Response</h3>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    // Try to parse error if it's a JSON string from API response
    let errorData = null;
    try {
      if (typeof error === 'string' && error.includes('{')) {
        errorData = JSON.parse(error);
      }
    } catch (e) {
      // Error is not JSON, use as is
    }

    return (
      <div className="response-display">
        <h3>Response</h3>
        <div className="error">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <strong>Error:</strong> {errorData?.error || error}
            
            {errorData?.debugInfo && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                <strong>🔍 Debug Information:</strong>
                <br />
                <small>
                  Primary Type: {errorData.debugInfo.typedDataStructure?.primaryType || 'Not provided'}<br />
                  Available Types: {errorData.debugInfo.typedDataStructure?.typeNames?.join(', ') || 'None'}<br />
                  Has Domain: {errorData.debugInfo.typedDataStructure?.hasDomain ? '✅' : '❌'}<br />
                  Has Types: {errorData.debugInfo.typedDataStructure?.hasTypes ? '✅' : '❌'}<br />
                  Has Message: {errorData.debugInfo.typedDataStructure?.hasMessage ? '✅' : '❌'}
                </small>
                {errorData.originalError && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Original Error:</strong><br />
                    <code style={{ fontSize: '0.8rem' }}>{errorData.originalError}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-display">
        <h3>Response</h3>
        <div className="no-response">
          <div className="no-response-icon">📝</div>
          No response yet. Make an API call to see results.
        </div>
      </div>
    );
  }

  // Check if response is successful (you can adjust this logic based on your API)
  const isSuccess = response && !response.error && (response.status === 'success' || response.data || response.id || !response.message?.includes('error'));

  return (
    <div className="response-display">
      <h3>Response</h3>
      <div className={`response-container ${isSuccess ? 'success' : 'neutral'}`}>
        {isSuccess && (
          <div className="response-header success-header">
            <div className="success-icon">✅</div>
            <span className="success-text">Success!</span>
          </div>
        )}
        
        {/* Special display for Web3.js wallet generation response */}
        {response?.data?.wallet && response?.data?.method === 'web3js-ethers' && (
          <div style={{ 
            backgroundColor: '#e6fffa', 
            border: '1px solid #319795',
            borderRadius: '6px', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🧪</span>
              <h4 style={{ margin: 0, color: '#319795' }}>Wallet Generated & Data Signed</h4>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '0.75rem', 
              borderRadius: '4px',
              border: '1px solid #90cdf4',
              marginBottom: '0.75rem'
            }}>
              <strong style={{ color: '#2b6cb0' }}>📱 Generated Wallet</strong>
              <br />
              <small style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                <strong>Address:</strong> {response.data.wallet.address}
              </small>
              <br />
              <small style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: '#e53e3e' }}>
                <strong>Private Key:</strong> {response.data.wallet.privateKey}
              </small>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0fff4', 
              padding: '0.75rem', 
              borderRadius: '4px',
              border: '1px solid #68d391',
              marginBottom: '0.75rem'
            }}>
              <strong style={{ color: '#38a169' }}>✍️ EIP-712 Signature</strong>
              <br />
              <small style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                {response.data.signature}
              </small>
            </div>
            
            {response.data.metadata && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '0.75rem', 
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <strong style={{ color: '#495057' }}>📊 Signing Details</strong>
                <br />
                <small style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                  <strong>Primary Type:</strong> {response.data.metadata.primaryType}<br />
                  <strong>Chain ID:</strong> {response.data.metadata.chainId}<br />
                  <strong>Contract:</strong> {response.data.metadata.verifyingContract}<br />
                  <strong>Message Fields:</strong> {response.data.metadata.messageKeys?.join(', ')}
                </small>
              </div>
            )}
            
            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#4a5568' }}>
              <strong>⚠️ Security Notice:</strong>
              <br />
              <span style={{ fontSize: '0.85rem' }}>
                This is a test wallet. In production, private keys should be stored securely and never logged or displayed.
              </span>
            </div>
          </div>
        )}
        
        <pre className={`response-json ${isSuccess ? 'success-json' : ''}`}>
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ResponseDisplay;
