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
    return (
      <div className="response-display">
        <h3>Response</h3>
        <div className="error">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <strong>Error:</strong> {error}
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
        <pre className={`response-json ${isSuccess ? 'success-json' : ''}`}>
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ResponseDisplay;
