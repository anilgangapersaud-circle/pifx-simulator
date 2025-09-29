import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, getWalletIdForFlow } from '../App';
import axios from 'axios';

interface TakerDeliverFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const TakerDeliverForm: React.FC<TakerDeliverFormProps> = ({ state, updateState, flowType }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    contractAddress: '0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1', // FxEscrow proxy contract
    walletId: getWalletIdForFlow(state, flowType || 'taker'),
    refId: '',
    tradeIds: '', // Changed from tradeId to tradeIds to support multiple IDs
    // Permit data
    permitToken: '', // permitted.token (for single mode)
    permitAmount: '', // permitted.amount (for single mode, will be converted to integer)
    permitTokens: [{ token: '', amount: '' }], // for batch mode - array of token/amount pairs
    permitNonce: '', // nonce (will be converted to integer)
    permitDeadline: '', // deadline (will be converted to integer)
    signature: '',
    // Web3js private key for signing
    privateKey: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResponseDisplay, setShowResponseDisplay] = useState(true);
  const [signingMethod, setSigningMethod] = useState<'circle' | 'web3'>('circle');
  const [deliverType, setDeliverType] = useState<'taker' | 'maker'>(flowType || 'taker');
  const [fundingMode, setFundingMode] = useState<'gross' | 'net'>('gross');
  const [editableTypedData, setEditableTypedData] = useState<string>('');
  const [typedDataError, setTypedDataError] = useState<string | null>(null);
  const [permit2ApprovalLoading, setPermit2ApprovalLoading] = useState(false);
  const [permit2ApprovalResponse, setPermit2ApprovalResponse] = useState<any>(null);
  const [permit2ApprovalError, setPermit2ApprovalError] = useState<string | null>(null);

  // Auto-switch to gross when taker is selected (net is only available for makers)
  React.useEffect(() => {
    if (deliverType === 'taker' && fundingMode === 'net') {
      setFundingMode('gross');
    }
  }, [deliverType, fundingMode]);



  // Auto-populate wallet ID when it changes or flow type changes
  React.useEffect(() => {
    const appropriateWalletId = getWalletIdForFlow(state, flowType || deliverType);
    if (appropriateWalletId !== formData.walletId) {
      setFormData(prev => ({
        ...prev,
        walletId: appropriateWalletId
      }));
    }
  }, [state.walletId, state.makerWalletId, state.takerWalletId, flowType, deliverType, formData.walletId]);

  // Update deliver type when flowType prop changes
  React.useEffect(() => {
    if (flowType && flowType !== deliverType) {
      setDeliverType(flowType);
    }
  }, [flowType, deliverType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions for managing batch permit tokens
  const addPermitToken = () => {
    setFormData(prev => ({
      ...prev,
      permitTokens: [...prev.permitTokens, { token: '', amount: '' }]
    }));
  };

  const removePermitToken = (index: number) => {
    setFormData(prev => ({
      ...prev,
      permitTokens: prev.permitTokens.filter((_, i) => i !== index)
    }));
  };

  const updatePermitToken = (index: number, field: 'token' | 'amount', value: string) => {
    setFormData(prev => ({
      ...prev,
      permitTokens: prev.permitTokens.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Initialize permitTokens array for batch mode (start with one token)
  React.useEffect(() => {
    const tradeIds = parseTradeIds(formData.tradeIds);
    const batchMode = tradeIds.length > 1;
    
    if (batchMode && formData.permitTokens.length === 0) {
      // Initialize with one token/amount pair for batch mode
      setFormData(prev => ({
        ...prev,
        permitTokens: [{ token: '', amount: '' }]
      }));
    } else if (!batchMode && formData.permitTokens.length > 0) {
      // Clear permitTokens array when switching back to single mode
      setFormData(prev => ({
        ...prev,
        permitTokens: [{ token: '', amount: '' }]
      }));
    }
  }, [formData.tradeIds]);

  // Helper function to parse trade IDs and determine if batch mode
  const parseTradeIds = (tradeIdsInput: string): number[] => {
    if (!tradeIdsInput.trim()) return [];
    
    return tradeIdsInput
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id >= 0);
  };

  const isBatchMode = (): boolean => {
    const tradeIds = parseTradeIds(formData.tradeIds);
    return tradeIds.length > 1;
  };

  const getSingleTradeId = (): number | null => {
    const tradeIds = parseTradeIds(formData.tradeIds);
    return tradeIds.length === 1 ? tradeIds[0] : null;
  };



  const signTypedData = async () => {
    if (!editableTypedData) {
      setError('No typed data available to sign. Get typed data first.');
      return;
    }

    // Validate that the editable typed data is valid JSON
    let parsedTypedData;
    try {
      parsedTypedData = JSON.parse(editableTypedData);
    } catch (err) {
      setTypedDataError('Invalid JSON format. Please check the typed data structure.');
      return;
    }

    // Basic validation of typed data structure
    if (!parsedTypedData.domain || !parsedTypedData.types || !parsedTypedData.message || !parsedTypedData.primaryType) {
      setTypedDataError('Invalid typed data structure. Must include domain, types, message, and primaryType.');
      return;
    }

    if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
      setError('Circle credentials (API Key, Entity Secret, Wallet ID) are required to sign with programmable wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      
      // Use Circle to sign the (possibly edited) typed data
      const signingPayload = {
        walletApiKey: state.walletApiKey,
        entitySecret: state.entitySecret,
        walletId: formData.walletId,
        typedData: parsedTypedData
      };

      const result = await axios.post('http://localhost:3001/api/wallet/sign/typedData', signingPayload);
      
      if (result.data && result.data.data && result.data.data.signature) {
        const signature = result.data.data.signature;
        
        // Update form with signature
        setFormData(prev => ({
          ...prev,
          signature: signature
        }));

        // Hide the response display after successful signing
        setShowResponseDisplay(false);
      } else {
        throw new Error(result.data?.error || 'Failed to sign typed data');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to sign typed data';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const approvePermit2 = async () => {
    // Extract token address from the typed data
    let tokenAddress = '';
    try {
      if (editableTypedData) {
        const typedDataObj = JSON.parse(editableTypedData);
        const permitData = typedDataObj?.message;
        if (permitData?.permitted) {
          if (Array.isArray(permitData.permitted)) {
            // Batch mode - use first token
            tokenAddress = permitData.permitted[0]?.token || '';
          } else {
            // Single mode
            tokenAddress = permitData.permitted.token || '';
          }
        }
      }
    } catch (err) {
      setPermit2ApprovalError('Cannot extract token address from typed data');
      return;
    }

    if (!tokenAddress) {
      setPermit2ApprovalError('No token address found in typed data. Get typed data first.');
      return;
    }

    if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
      setPermit2ApprovalError('Circle credentials (API Key, Entity Secret, Wallet ID) are required');
      return;
    }

    setPermit2ApprovalLoading(true);
    setPermit2ApprovalError(null);
    setPermit2ApprovalResponse(null);

    try {
      const approvalPayload = {
        walletApiKey: state.walletApiKey,
        entitySecret: state.entitySecret,
        walletId: formData.walletId,
        tokenAddress: tokenAddress,
        refId: `permit2-approval-${Date.now()}`
      };

      const result = await axios.post('http://localhost:3001/api/approvePermit2', approvalPayload);
      
      setPermit2ApprovalResponse(result.data);
      
    } catch (err: any) {
      let errorMessage = 'Failed to approve Permit2';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setPermit2ApprovalError(errorMessage);
    } finally {
      setPermit2ApprovalLoading(false);
    }
  };

  const getFundingTypedData = async () => {
    if (!formData.tradeIds.trim()) {
      setError('Please enter at least one trade ID');
      return;
    }

    const tradeIds = parseTradeIds(formData.tradeIds);
    if (tradeIds.length === 0) {
      setError('Please enter valid trade IDs (comma-separated numbers)');
      return;
    }

    // Validate API key for Circle presign endpoint
    if (!state.apiKey) {
      setError('API Key is required to get typed data from Circle API');
      return;
    }

    setLoading(true);
    setError(null);
    setShowResponseDisplay(true); // Show response display for typed data retrieval

    try {
      
      // Call Circle API to get typed data
      const presignPayload = {
        environment: state.environment,
        apiKey: state.apiKey,
        contractTradeIds: tradeIds,
        traderType: deliverType,
        fundingMode: fundingMode
      };

      
      const presignResult = await axios.post('http://localhost:3001/api/signatures/funding/presign', presignPayload);
      
      // Handle nested response structure: data.data.typedData
      const responseData = presignResult.data?.data || presignResult.data;
      if (!responseData || !responseData.typedData) {
        throw new Error('Invalid response from Circle presign API - missing typedData');
      }

      const { typedData } = responseData;
      const permitData = responseData.permitData || typedData.message;

      // Extract nonce and deadline from typed data message
      const nonce = typedData?.message?.nonce;
      const deadline = typedData?.message?.deadline;

      if (!nonce || !deadline) {
        console.warn('⚠️ Could not extract nonce or deadline from typed data');
      }

      // Extract permit data from typed data message
      const permitMessage = typedData?.message;
      let extractedPermitTokens: { token: string; amount: string }[] = [];
      
      if (permitMessage?.permitted) {
        if (Array.isArray(permitMessage.permitted)) {
          // Batch mode - array of token permissions
          extractedPermitTokens = permitMessage.permitted.map((p: any) => ({
            token: p.token || '',
            amount: p.amount?.toString() || ''
          }));
        } else {
          // Single mode - single token permission
          extractedPermitTokens = [{
            token: permitMessage.permitted.token || '',
            amount: permitMessage.permitted.amount?.toString() || ''
          }];
        }
      }


      // Update form with values from Circle API
      setFormData(prev => ({
        ...prev,
        permitNonce: nonce ? nonce.toString() : '',
        permitDeadline: deadline ? deadline.toString() : '',
        permitTokens: extractedPermitTokens.length > 0 ? extractedPermitTokens : prev.permitTokens,
        permitToken: extractedPermitTokens.length > 0 ? extractedPermitTokens[0].token : prev.permitToken,
        permitAmount: extractedPermitTokens.length > 0 ? extractedPermitTokens[0].amount : prev.permitAmount,
        signature: '' // Clear any existing signature
      }));

      // Set the editable typed data
      setEditableTypedData(JSON.stringify(typedData, null, 2));
      setTypedDataError(null);

      // Show success message with typed data
      setResponse({
        success: true,
        message: 'Funding typed data retrieved successfully from Circle API!',
        details: {
          permitData: permitData,
          typedData: typedData,
          fundingMode: fundingMode,
          traderType: deliverType,
          contractTradeIds: tradeIds,
          nonce: nonce,
          deadline: deadline,
          readyForSigning: true
        }
      });

    } catch (err: any) {
      let errorMessage = 'Failed to get funding typed data';
      if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Removed approvePermit2 function as we only get typed data and sign it now



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (!formData.tradeIds.trim()) {
      setError('At least one Trade ID is required');
      return;
    }

    const tradeIds = parseTradeIds(formData.tradeIds);
    if (tradeIds.length === 0) {
      setError('Please enter valid trade IDs (comma-separated numbers)');
      return;
    }

    // Both taker and maker deliver require all permit fields and signature
    const batchMode = isBatchMode();
    
    // Validate net delivery requires multiple trades (only for makers)
    if (fundingMode === 'net' && deliverType === 'maker' && tradeIds.length === 1) {
      setError('Net funding requires multiple trade IDs to calculate net balances across trades');
      return;
    }
    
    // Basic validation - only check essential fields, permit data will be extracted from typed data
    if (!formData.permitNonce || !formData.permitDeadline || !formData.signature) {
      setError(`Nonce, deadline and signature are required for ${deliverType === 'taker' ? 'Taker' : 'Maker'} Deliver`);
      return;
    }
    
    
    // Validate that nonce and deadline can be converted to integers
    if (isNaN(parseInt(formData.permitNonce)) || isNaN(parseInt(formData.permitDeadline))) {
      setError('Nonce and deadline must be valid numbers');
      return;
    }

    // Validation based on signing method
    if (signingMethod === 'circle') {
      if (!state.apiKey) {
        setError('API Key is required for Circle CPS fund API');
        return;
      }
      if (!state.environment) {
        setError('Environment selection is required for Circle CPS fund API');
        return;
      }
    } else {
      if (!formData.privateKey) {
        setError('Private key is required for ethers wallet execution');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let payload;
      let endpoint;
      const batchMode = isBatchMode();
      const singleTradeId = getSingleTradeId();

      // Extract permit data from the typed data that was signed
      let typedDataObj = null;
      try {
        typedDataObj = JSON.parse(editableTypedData);
      } catch (err) {
        setError('Invalid typed data format. Please get fresh typed data.');
        return;
      }

      const permitDataFromTypedData = typedDataObj?.message;

      if (signingMethod === 'circle') {
        // Circle CPS Fund API implementation
        if (deliverType === 'taker') {
          if (batchMode) {
            // Batch taker deliver - use Circle CPS fund API
            payload = {
              environment: state.environment,
              apiKey: state.apiKey,
              permit2: permitDataFromTypedData,
              signature: formData.signature,
              type: 'taker',
              fundingMode: 'gross' // Taker always uses gross
            };
            endpoint = 'http://localhost:3001/api/takerBatchDeliver';
          } else {
            // Single taker deliver - use Circle CPS fund API
            payload = {
              environment: state.environment,
              apiKey: state.apiKey,
              permit2: permitDataFromTypedData,
              signature: formData.signature,
              type: 'taker',
              fundingMode: 'gross' // Taker always uses gross
            };
            endpoint = 'http://localhost:3001/api/takerDeliver';
          }
        } else {
          // Maker deliver logic - use Circle CPS fund API
          if (fundingMode === 'net') {
            // Net delivery always uses batch format (multiple trade IDs) - use Circle CPS fund API
            payload = {
              environment: state.environment,
              apiKey: state.apiKey,
              permit2: permitDataFromTypedData,
              signature: formData.signature,
              type: 'maker',
              fundingMode: 'net'
            };
            endpoint = 'http://localhost:3001/api/makerNetDeliver';
          } else if (batchMode) {
            // Batch maker deliver (gross) - use Circle CPS fund API
            payload = {
              environment: state.environment,
              apiKey: state.apiKey,
              permit2: permitDataFromTypedData,
              signature: formData.signature,
              type: 'maker',
              fundingMode: 'gross'
            };
            endpoint = 'http://localhost:3001/api/makerBatchDeliver';
          } else {
            // Single maker deliver (gross) - use Circle CPS fund API
            payload = {
              environment: state.environment,
              apiKey: state.apiKey,
              permit2: permitDataFromTypedData,
              signature: formData.signature,
              type: 'maker',
              fundingMode: 'gross'
            };
            endpoint = 'http://localhost:3001/api/makerDeliver';
          }
        }

      } else {
        // Web3js/Ethers implementation
        if (deliverType === 'taker') {
          if (batchMode) {
            // Batch taker deliver - use permit data directly from typed data
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitDataFromTypedData.permitted,
                nonce: permitDataFromTypedData.nonce,
                deadline: permitDataFromTypedData.deadline
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/takerBatchDeliver';
          } else {
            // Single taker deliver
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeId: singleTradeId,
              permit: {
                permitted: permitDataFromTypedData.permitted,
                nonce: permitDataFromTypedData.nonce,
                deadline: permitDataFromTypedData.deadline
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/takerDeliver';
          }
        } else {
          // Maker deliver logic
          if (fundingMode === 'net') {
            // Net delivery always uses batch format (multiple trade IDs) - use permit data directly from typed data
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitDataFromTypedData.permitted,
                nonce: permitDataFromTypedData.nonce,
                deadline: permitDataFromTypedData.deadline
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/makerNetDeliver';
          } else if (batchMode) {
            // Batch maker deliver (gross) - use permit data directly from typed data
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitDataFromTypedData.permitted,
                nonce: permitDataFromTypedData.nonce,
                deadline: permitDataFromTypedData.deadline
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/makerBatchDeliver';
          } else {
            // Single maker deliver (gross)
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeId: singleTradeId,
              permit: {
                permitted: permitDataFromTypedData.permitted,
                nonce: permitDataFromTypedData.nonce,
                deadline: permitDataFromTypedData.deadline
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/makerDeliver';
          }
        }

      }

      const result = await axios.post(endpoint, payload);
      
      setResponse(result.data);
      setShowResponseDisplay(true);

      // Check if the API call was successful (200 status) and navigate to complete step
      if (result.status === 200) {
        console.log('✅ Fund delivery API call successful');
        
        // Check if we're on the complete workflow page (integrated workflow)
        const isOnWorkflowPage = window.location.pathname === '/complete-workflow' || window.location.pathname === '/';
        
        if (isOnWorkflowPage) {
          // If we're on the workflow page, the workflow will handle the completion automatically
          console.log('On workflow page - letting workflow handle completion');
        } else {
          // If we're on a standalone page, navigate to complete workflow
          console.log('On standalone page - navigating to complete workflow');
          
          // Add success message with navigation info
          setResponse({
            ...result.data,
            _navigationMessage: 'Success! Redirecting to complete workflow in 2 seconds...',
            _navigating: true
          });
          
          // Small delay to let user see the success response before navigating
          setTimeout(() => {
            navigate('/complete-workflow');
          }, 2000);
        }
      }

    } catch (err: any) {
      let errorMessage = 'An unknown error occurred';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                     err.response.data?.message || 
                     `HTTP ${err.response.status}: ${err.response.statusText}`;
        
        if (err.response.data?.details) {
          errorMessage += ` - ${JSON.stringify(err.response.data.details)}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Request failed to send';
      }

      setError(errorMessage);
      setShowResponseDisplay(true);
    } finally {
      setLoading(false);
    }
  };

  // Remove permitTokens, handlePermitTokenChange, addPermitToken, removePermitToken, and batch UI logic

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>{deliverType === 'taker' ? 'Taker' : 'Maker'} Funding via Circle CPS API</h2>
      <p>Get EIP-712 typed data for Permit2 funding from Circle's API, sign it with Circle, and execute funding via Circle's CPS fund endpoint. This replaces the contract execution with a direct API call.</p>
      
      {/* Deliver Type Toggle - Only show when not in workflow mode */}
      {!flowType && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Deliver Type:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeliverType('taker')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${deliverType === 'taker' ? '#667eea' : '#e2e8f0'}`,
                  backgroundColor: deliverType === 'taker' ? '#667eea' : 'white',
                  color: deliverType === 'taker' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                📦 Taker
              </button>
              <button
                type="button"
                onClick={() => setDeliverType('maker')}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${deliverType === 'maker' ? '#38a169' : '#e2e8f0'}`,
                  backgroundColor: deliverType === 'maker' ? '#38a169' : 'white',
                  color: deliverType === 'maker' ? 'white' : '#4a5568',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                🏭 Maker
              </button>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
            {deliverType === 'taker' 
              ? 'Execute takerDeliver (single) or takerBatchDeliver (multiple) - Requires Permit2 signature(s) for token transfer from taker to contract.'
              : 'Execute makerDeliver/makerBatchDeliver (gross) or makerNetDeliver (net) - Requires Permit2 signature(s) for token transfer from maker to contract.'
            }
          </p>
        </div>
      )}



      {/* Info about Circle CPS fund API */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', border: '1px solid #667eea', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔄</span>
          <span style={{ fontWeight: 'bold', color: '#667eea' }}>Circle CPS Fund API Integration</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
          This form uses Circle's CPS fund endpoint instead of contract execution. It retrieves EIP-712 typed data, signs it, and calls the fund API with permit2, signature, type, and fundingMode parameters.
        </p>
      </div>

      {/* Permit2 Approval Info */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔓</span>
          <span style={{ fontWeight: 'bold', color: '#856404' }}>Permit2 Approval Required</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
          Before using Permit2 for token transfers, you need to approve the Permit2 contract to spend your tokens. 
          This is a one-time approval per token that allows Permit2 to transfer tokens on your behalf using signatures instead of separate approval transactions.
        </p>
      </div>
      




      <form onSubmit={handleSubmit} className="api-form" style={{ width: '100%' }}>

        {/* Trade IDs */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Trade Information</legend>
          
          <div className="form-group">
            <label htmlFor="tradeIds">Trade ID(s) *</label>
            <input
              type="text"
              id="tradeIds"
              value={formData.tradeIds}
              onChange={(e) => handleInputChange('tradeIds', e.target.value)}
              placeholder="Enter trade ID(s) - single: 123, multiple: 123,124,125"
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              Enter one or more trade IDs separated by commas. Single ID uses individual deliver functions, multiple IDs use batch deliver functions.
            </small>
            
            {/* Funding Mode Selection - Show for both taker and maker when not in workflow mode, or for makers in workflow mode */}
            {(!flowType || (flowType === 'maker' && deliverType === 'maker')) && (
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ fontWeight: 'bold', color: '#2d3748', display: 'block', marginBottom: '0.75rem' }}>
                  Funding Mode:
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="fundingMode"
                      value="gross"
                      checked={fundingMode === 'gross'}
                      onChange={() => setFundingMode('gross')}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: '500', color: '#2d3748' }}>Gross</span>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: deliverType === 'taker' ? 'not-allowed' : 'pointer',
                    opacity: deliverType === 'taker' ? 0.5 : 1
                  }}>
                    <input
                      type="radio"
                      name="fundingMode"
                      value="net"
                      checked={fundingMode === 'net'}
                      onChange={() => setFundingMode('net')}
                      disabled={deliverType === 'taker'}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: '500', color: '#2d3748' }}>Net</span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Get Typed Data and Permit2 Approval Buttons - Side by side */}
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={getFundingTypedData}
                  style={{ 
                    backgroundColor: response?.success ? '#38a169' : '#667eea', 
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  title="Get typed data for funding from Circle API"
                  disabled={loading || !formData.tradeIds || !state.apiKey}
                >
                  {response?.success ? 'Retrieved' : (loading ? 'Getting...' : 'Get Typed Data')}
                </button>
                
                {/* Permit2 Approval Button - Show beside Get Typed Data button */}
                <button 
                  type="button" 
                  onClick={approvePermit2}
                  style={{ 
                    backgroundColor: permit2ApprovalResponse ? '#38a169' : '#667eea', 
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  title="Approve Permit2 contract to spend tokens"
                  disabled={permit2ApprovalLoading || !editableTypedData || !state.walletApiKey || !state.entitySecret || !formData.walletId}
                >
                  {permit2ApprovalResponse ? '✅ Approved' : (permit2ApprovalLoading ? 'Approving...' : '🔓 Approve Permit2')}
                </button>
              </div>
              
              {/* Status messages below buttons */}
              <div style={{ marginTop: '0.5rem' }}>
                {(!formData.tradeIds || !state.apiKey) && (
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                    {!formData.tradeIds ? 
                      'Enter trade IDs first' :
                      'Configure API Key in Settings'
                    }
                  </div>
                )}
                
                {(!state.walletApiKey || !state.entitySecret || !formData.walletId) && editableTypedData && (
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                    Configure Circle credentials in Settings for Permit2 approval
                  </div>
                )}
                
                {permit2ApprovalError && (
                  <div style={{ fontSize: '0.8rem', color: '#e53e3e' }}>
                    ❌ {permit2ApprovalError}
                  </div>
                )}
                
                {permit2ApprovalResponse && (
                  <div style={{ fontSize: '0.8rem', color: '#38a169', fontWeight: '500' }}>
                    ✅ Permit2 approval transaction ID: <code style={{ backgroundColor: '#f0fff4', padding: '0.25rem', borderRadius: '3px' }}>{permit2ApprovalResponse.id || permit2ApprovalResponse.data?.id || 'Success'}</code>
                  </div>
                )}
              </div>
            </div>
            
            {/* Show parsed trade IDs preview */}
            {formData.tradeIds && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f7fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const tradeIds = parseTradeIds(formData.tradeIds);
                  const batchMode = tradeIds.length > 1;
                  const validIds = tradeIds.length > 0;
                  
                  if (!validIds) {
                    return (
                      <div style={{ color: '#e53e3e', fontSize: '0.9rem' }}>
                        ⚠️ No valid trade IDs found. Please enter numeric values.
                      </div>
                    );
                  }
                  
                  return (
                    <div>
                      <div style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '500' }}>
                        {batchMode ? `🔄 Batch Mode: ${tradeIds.length} trades` : `📦 Single Mode: 1 trade`}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Trade IDs: {tradeIds.join(', ')}
                      </div>
                      <div style={{ color: '#667eea', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Will use: {fundingMode === 'net' && deliverType === 'maker' ? 'makerNetDeliver' : 
                          `${deliverType}${batchMode ? 'BatchDeliver' : 'Deliver'}`}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </fieldset>


        {/* Typed Data Display */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>
            Typed Data Response
          </legend>



            {/* Typed Data Display - Editable */}
            <div className="form-group">
              <label>
                EIP-712 Typed Data
                <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                  📝 Editable
                </span>
              </label>
              <textarea
                value={editableTypedData}
                onChange={(e) => {
                  setEditableTypedData(e.target.value);
                  setTypedDataError(null);
                  // Clear signature when typed data is modified
                  setFormData(prev => ({ ...prev, signature: '' }));
                }}
                placeholder="Typed data will appear here after clicking 'Get Typed Data'. You can edit it before signing."
                rows={16}
                style={{ 
                  width: '100%', 
                  resize: 'vertical', 
                  padding: '0.75rem', 
                  fontSize: '0.8rem',
                  backgroundColor: editableTypedData ? '#f0f8ff' : '#f8f9fa',
                  borderColor: typedDataError ? '#e53e3e' : (editableTypedData ? '#667eea' : '#e2e8f0'),
                  fontFamily: 'monospace'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                EIP-712 typed data structure for Permit2 funding. Retrieved from Circle's API and editable before signing.
                {response?.success && (
                  <span style={{ color: '#38a169', marginLeft: '0.5rem' }}>
                    ✅ Typed data retrieved
                  </span>
                )}
                {editableTypedData && response?.details?.typedData && editableTypedData !== JSON.stringify(response.details.typedData, null, 2) && (
                  <span style={{ color: '#f56500', marginLeft: '0.5rem' }}>
                    ⚠️ Modified from original
                  </span>
                )}
              </small>
              
              {/* Reset to Original Button */}
              {editableTypedData && response?.details?.typedData && editableTypedData !== JSON.stringify(response.details.typedData, null, 2) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditableTypedData(JSON.stringify(response.details.typedData, null, 2));
                      setTypedDataError(null);
                      setFormData(prev => ({ ...prev, signature: '' }));
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#fff3cd',
                      color: '#856404',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ↺ Reset to Original
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(editableTypedData);
                        setEditableTypedData(JSON.stringify(parsed, null, 2));
                        setTypedDataError(null);
                      } catch (err) {
                        setTypedDataError('Cannot format invalid JSON');
                      }
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#e6fffa',
                      color: '#234e52',
                      border: '1px solid #81e6d9',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '0.5rem'
                    }}
                  >
                    📝 Format JSON
                  </button>
                </div>
              )}
              
              {typedDataError && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem', 
                  backgroundColor: '#fed7d7', 
                  border: '1px solid #e53e3e', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#e53e3e'
                }}>
                  {typedDataError}
                </div>
              )}
            </div>
            
            {/* Sign Typed Data Button - Only show if we have editable typed data and no signature */}
            {editableTypedData && !formData.signature && (
              <div style={{ 
                marginBottom: '1rem', 
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🔐</span>
                  <h4 style={{ 
                    margin: 0, 
                    color: '#856404'
                  }}>
                    Sign Typed Data with Circle
                  </h4>
                </div>
                
                <button 
                  type="button" 
                  onClick={signTypedData}
                  style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  disabled={loading || !state.walletApiKey || !state.entitySecret || !formData.walletId || !!typedDataError}
                >
                  {loading ? 'Signing...' : 'Sign with Circle'}
                </button>
                
                {(!state.walletApiKey || !state.entitySecret || !formData.walletId) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#856404' }}>
                    Configure Circle credentials in Settings to enable signing
                  </div>
                )}
              </div>
            )}

          <div className="form-group">
            <label htmlFor="signature">
              Permit Signature * 
              <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                🔐 Auto-generated
              </span>
            </label>
            <textarea
              id="signature"
              value={formData.signature}
              onChange={(e) => handleInputChange('signature', e.target.value)}
              placeholder="0x... (signature authorizing the token transfer - click Generate & Sign Permit)"
              rows={4}
              required
              style={{ 
                width: '100%', 
                resize: 'vertical', 
                padding: '0.75rem', 
                fontSize: '0.95rem',
                backgroundColor: formData.signature ? '#f0f8ff' : 'white',
                borderColor: formData.signature ? '#667eea' : '#e2e8f0'
              }}
            />
            <small style={{ color: '#718096', fontSize: '0.85rem' }}>
              The signature authorizing this permit transfer. This should be generated by signing the permit data with the token holder's private key.
              {formData.signature && (
                <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                  ✅ Signature ready
                </span>
              )}
            </small>
          </div>
        </fieldset>

        {/* Circle CPS Fund Execution Section */}
        {formData.signature && (
          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>
              Circle CPS Fund Execution
            </legend>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', border: '1px solid #667eea', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
                <strong style={{ color: '#2d3748' }}>Ready to Call Circle CPS Fund API</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
                Call Circle's CPS fund endpoint with {deliverType} type and {fundingMode} funding mode.
                This will process the funding using the permit2 signature and typed data.
              </p>
            </div>

            {/* Request Body Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#2d3748', fontSize: '1rem' }}>
                📋 Request Body Preview
              </h4>
              
              <div>
                <label style={{ fontWeight: 'bold', color: '#4a5568', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                  Complete Request Body
                  <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                    (what will be sent to Circle CPS fund API)
                  </span>
                </label>
                <textarea
                  value={(() => {
                    try {
                      if (!editableTypedData || !formData.signature) {
                        return 'Complete request body will appear here after getting typed data and signature';
                      }
                      const typedDataObj = JSON.parse(editableTypedData);
                      const permitData = typedDataObj?.message;
                      const requestBody = {
                        permit2: permitData,
                        signature: formData.signature,
                        type: deliverType,
                        fundingMode: fundingMode
                      };
                      return JSON.stringify(requestBody, null, 2);
                    } catch (err) {
                      return 'Invalid data - please ensure typed data and signature are valid';
                    }
                  })()}
                  readOnly
                  rows={15}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontSize: '0.8rem',
                    backgroundColor: (editableTypedData && formData.signature) ? '#f0fff4' : '#f8f9fa',
                    border: `2px solid ${(editableTypedData && formData.signature) ? '#38a169' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    color: (editableTypedData && formData.signature) ? '#2d3748' : '#a0aec0'
                  }}
                />
                <small style={{ color: '#718096', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                  This is the exact JSON payload that will be sent to <code>POST /v1/exchange/cps/fund</code>
                </small>
              </div>
            </div>

            {/* Execute Fund API Button */}
            <div style={{ 
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: '#f0fff4',
              border: '2px solid #38a169',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🚀</span>
                <h3 style={{ 
                  margin: 0, 
                  color: '#38a169'
                }}>
                  Execute Circle CPS Fund
                </h3>
              </div>
              
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#4a5568' }}>
                <strong>Type:</strong> {deliverType} | <strong>Funding Mode:</strong> {fundingMode}
              </div>
              
              <button 
                type="submit"
                className="example-button"
                style={{ 
                  backgroundColor: '#38a169', 
                  fontWeight: 'bold',
                  padding: '0.75rem 2rem',
                  fontSize: '1.1rem',
                  borderRadius: '6px',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(56, 161, 105, 0.3)',
                  opacity: 1
                }}
                title="Call Circle CPS fund endpoint"
                disabled={loading || !state.apiKey || !state.environment}
              >
                {loading ? 'Calling Circle API...' : `🚀 Execute CPS Fund (${deliverType}/${fundingMode})`}
              </button>
              
              {(!state.apiKey || !state.environment) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
                  {!state.apiKey ? 'Configure API Key in Settings' :
                   !state.environment ? 'Select Environment in Settings' : ''
                  }
                </div>
              )}
            </div>
          </fieldset>
        )}

      </form>

      {/* Response Display */}
      {(response || error || loading) && showResponseDisplay && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '2rem', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          backgroundColor: '#f9f9f9',
          minHeight: '400px',
          maxHeight: '800px',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>Response</h3>
          
          {loading && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#3182ce',
              fontSize: '1rem'
            }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #3182ce', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
              Loading...
            </div>
          )}

          {error && !loading && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fed7d7', 
              border: '1px solid #e53e3e', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>❌</span>
                <div>
                  <strong style={{ color: '#e53e3e' }}>Error:</strong>
                  <div style={{ marginTop: '0.5rem', color: '#2d3748' }}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {response && !loading && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f0fff4', 
              border: '1px solid #38a169', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <strong style={{ color: '#38a169' }}>Success!</strong>
              </div>
              
              {/* Navigation message */}
              {response._navigating && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e6fffa', 
                  border: '2px solid #319795', 
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🚀</span>
                    <strong style={{ color: '#319795' }}>{response._navigationMessage}</strong>
                  </div>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.9rem', 
                    color: '#2c5aa0' 
                  }}>
                    Taking you to the complete workflow page...
                  </div>
                </div>
              )}
              
              {/* Special handling for Circle CPS Fund API response */}
              {response && !response.details?.signingMethod && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e6fffa', 
                  border: '1px solid #319795', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🚀</span>
                    <strong style={{ color: '#319795' }}>Circle CPS Fund API Response</strong>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginBottom: '1rem' }}>
                    <strong>Endpoint:</strong> POST /v1/exchange/cps/fund<br/>
                    <strong>Type:</strong> {deliverType}<br/>
                    <strong>Funding Mode:</strong> {fundingMode}<br/>
                    <strong>Status:</strong> {response.status || 'Success'}
                  </div>

                  {/* Show key response fields */}
                  {response.id && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#319795' }}>📋 Response Details:</strong>
                      <div style={{ 
                        backgroundColor: '#f0f8ff', 
                        border: '1px solid #90cdf4', 
                        borderRadius: '4px', 
                        padding: '0.75rem',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem'
                      }}>
                        {response.id && <div><strong>ID:</strong> {response.id}</div>}
                        {response.state && <div><strong>State:</strong> {response.state}</div>}
                        {response.txHash && <div><strong>Transaction Hash:</strong> {response.txHash}</div>}
                        {response.blockNumber && <div><strong>Block Number:</strong> {response.blockNumber}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Special handling for permit signature generation */}
              {response.details?.signingMethod && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e6fffa', 
                  border: '1px solid #319795', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔐</span>
                    <strong style={{ color: '#319795' }}>Permit Signature Generated</strong>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#2c5aa0', marginBottom: '1rem' }}>
                    <strong>Method:</strong> {response.details.signingMethod}<br/>
                    <strong>Signer:</strong> {response.details.signerInfo}<br/>
                    {response.details.permitData && (
                      <>
                        <strong>Token:</strong> {response.details.permitData.permitted.token}<br/>
                        <strong>Amount:</strong> {response.details.permitData.permitted.amount}<br/>
                        <strong>Deadline:</strong> {new Date(response.details.permitData.deadline * 1000).toLocaleString()}
                      </>
                    )}
                  </div>

                  {/* Show the signature */}
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#319795' }}>📝 Generated Signature:</strong>
                    <div style={{ 
                      backgroundColor: '#f0f8ff', 
                      border: '1px solid #90cdf4', 
                      borderRadius: '4px', 
                      padding: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                      marginTop: '0.5rem'
                    }}>
                      {response.details.signature}
                    </div>
                  </div>

                  {/* Show the typed data that was signed */}
                  {response.details.typedData && (
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        color: '#319795',
                        marginBottom: '0.5rem'
                      }}>
                        📋 EIP-712 Typed Data (Signed)
                      </summary>
                      <div style={{ marginTop: '0.5rem' }}>
                        {/* Domain */}
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748' }}>Domain:</strong>
                          <pre style={{ 
                            backgroundColor: '#f8f9fa', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '4px', 
                            padding: '0.5rem', 
                            fontSize: '0.8rem',
                            marginTop: '0.25rem',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {JSON.stringify(response.details.typedData.domain, null, 2)}
                          </pre>
                        </div>

                        {/* Types */}
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748' }}>Types:</strong>
                          <pre style={{ 
                            backgroundColor: '#f8f9fa', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '4px', 
                            padding: '0.5rem', 
                            fontSize: '0.8rem',
                            marginTop: '0.25rem',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {JSON.stringify(response.details.typedData.types, null, 2)}
                          </pre>
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: '1rem' }}>
                          <strong style={{ color: '#2d3748' }}>Message:</strong>
                          <pre style={{ 
                            backgroundColor: '#f8f9fa', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '4px', 
                            padding: '0.5rem', 
                            fontSize: '0.8rem',
                            marginTop: '0.25rem',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {JSON.stringify(response.details.typedData.message, null, 2)}
                          </pre>
                        </div>

                        {/* Primary Type */}
                        <div>
                          <strong style={{ color: '#2d3748' }}>Primary Type:</strong>
                          <code style={{ 
                            backgroundColor: '#f0f8ff', 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            marginLeft: '0.5rem',
                            fontSize: '0.85rem'
                          }}>
                            {response.details.typedData.primaryType}
                          </code>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Transaction details */}
              {response.id && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ color: '#2d3748' }}>Transaction Details:</strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>ID:</strong> <code>{response.id}</code><br/>
                    <strong>State:</strong> <code>{response.state}</code>
                    {response.txHash && (
                      <>
                        <br/>
                        <strong>Hash:</strong> <code>{response.txHash}</code>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Raw response */}
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  color: '#4a5568',
                  marginBottom: '0.5rem'
                }}>
                  📄 Raw Response Data
                </summary>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '4px', 
                  padding: '1rem', 
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.5rem',
                  maxHeight: '400px',
                  minHeight: '200px'
                }}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakerDeliverForm;
