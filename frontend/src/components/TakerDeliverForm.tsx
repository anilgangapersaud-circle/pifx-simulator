import React, { useState } from 'react';
import { AppState } from '../App';
import axios from 'axios';

interface TakerDeliverFormProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  flowType?: 'taker' | 'maker';
}

const TakerDeliverForm: React.FC<TakerDeliverFormProps> = ({ state, updateState, flowType }) => {
  const [formData, setFormData] = useState({
    contractAddress: '0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1', // FxEscrow proxy contract
    walletId: state.walletId || '',
    refId: '',
    tradeIds: '', // Changed from tradeId to tradeIds to support multiple IDs
    // Permit data
    permitToken: '', // permitted.token
    permitAmount: '', // permitted.amount (will be converted to integer)
    permitNonce: '', // nonce (will be converted to integer)
    permitDeadline: '', // deadline (will be converted to integer)
    signature: '',
    // Web3js private key for signing
    privateKey: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingMethod, setSigningMethod] = useState<'circle' | 'web3'>('circle');
  const [deliverType, setDeliverType] = useState<'taker' | 'maker'>(flowType || 'taker');
  
  // Permit2 approval state
  const [permit2Loading, setPermit2Loading] = useState(false);
  const [permit2Approved, setPermit2Approved] = useState<{[token: string]: boolean}>({});
  const [permit2Response, setPermit2Response] = useState<any>(null);
  const [permit2Error, setPermit2Error] = useState<string | null>(null);



  // Auto-populate wallet ID when it changes
  React.useEffect(() => {
    if (state.walletId !== formData.walletId) {
      setFormData(prev => ({
        ...prev,
        walletId: state.walletId
      }));
    }
  }, [state.walletId, formData.walletId]);

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



  const generateAndSignPermit = async () => {
    if (!formData.permitToken || !formData.permitAmount) {
      setError('Please select a token and enter an amount to generate permit');
      return;
    }

    if (!formData.tradeIds.trim()) {
      setError('Please enter at least one trade ID - it is required for the witness in the permit signature');
      return;
    }

    const tradeIds = parseTradeIds(formData.tradeIds);
    if (tradeIds.length === 0) {
      setError('Please enter valid trade IDs (comma-separated numbers)');
      return;
    }

    // Validation based on signing method
    if (signingMethod === 'circle') {
      if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
        setError('Circle credentials (API Key, Entity Secret, Wallet ID) are required to sign with programmable wallet');
        return;
      }
    } else {
      if (!formData.privateKey) {
        setError('Private key is required for web3js signing');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Generate random nonce and future deadline
      const randomNonce = Math.floor(Math.random() * 1000000);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const futureDeadline = 1759159650;

      console.log('🔐 Generating Permit2 signature...');
      console.log('Token:', formData.permitToken);
      console.log('Amount:', formData.permitAmount);
      console.log('Nonce:', randomNonce);
      console.log('Deadline:', futureDeadline);

      const domain = {
            name: 'Permit2',
            chainId: 11155111, // Sepolia
            verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' 
      };

      // Determine if we need batch or single permit
      const batchMode = isBatchMode();
      const singleTradeId = getSingleTradeId();

      // EIP-712 types - different structures for single vs batch permits
      let types: Record<string, Array<{name: string, type: string}>>;
      let primaryType: string;
      let permitStruct: any;
      let witness: any;

      if (batchMode) {
        // Batch permit types
        types = {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          PermitBatchWitnessTransferFrom: [
            { name: 'permitted', type: 'TokenPermissions[]' },
            { name: 'spender', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'witness', type: 'BatchTradeWitness' }
          ],
          TokenPermissions: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          BatchTradeWitness: [
            { name: 'ids', type: 'uint256[]' }
          ]
        };
        primaryType = 'PermitBatchWitnessTransferFrom';
        
        // For batch, we need an array of TokenPermissions (one per trade)
        const permitTokens = [{
          token: formData.permitToken,
          amount: parseInt(formData.permitAmount)
        }];
        
        permitStruct = {
          permitted: permitTokens,
          spender: "0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1",
          nonce: randomNonce,
          deadline: futureDeadline,
          witness: {
            ids: tradeIds
          }
        };
      } else {
        // Single permit types (existing)
        types = {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          PermitWitnessTransferFrom: [
            { name: 'permitted', type: 'TokenPermissions' },
            { name: 'spender', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'witness', type: 'SingleTradeWitness' }
          ],
          TokenPermissions: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          SingleTradeWitness: [
            { name: 'id', type: 'uint256' }
          ]
        };
        primaryType = 'PermitWitnessTransferFrom';
        
        permitStruct = {
          permitted: {
            token: formData.permitToken,
            amount: parseInt(formData.permitAmount)
          },
          spender: "0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1",
          nonce: randomNonce,
          deadline: futureDeadline,
          witness: {
            id: singleTradeId!
          }
        };
      }

      const message = permitStruct;

      // Debug logging
      console.log('🔍 Message structure:', JSON.stringify(message, null, 2));
      console.log('🔍 Domain:', JSON.stringify(domain, null, 2));
      console.log('🔍 Types:', JSON.stringify(types, null, 2));

      const typedData = {
        domain,
        types,
        primaryType: primaryType,
        message
      };

      console.log('📝 Signing typed data:', JSON.stringify(typedData, null, 2));
      
      // Validate that all types in the types object are actually used
      const usedTypes = new Set([primaryType]); // Start with primary type
      const findReferencedTypes = (typeName: string): void => {
        if (types[typeName]) {
          types[typeName].forEach((field: any) => {
            if (field.type && types[field.type] && !usedTypes.has(field.type)) {
              usedTypes.add(field.type);
              findReferencedTypes(field.type);
            }
          });
        }
      };
      
      findReferencedTypes(primaryType);
      console.log('🔍 Used types:', Array.from(usedTypes));
      console.log('🔍 Defined types:', Object.keys(types));
      
      // Check for unused types
      const unusedTypes = Object.keys(types).filter(t => !usedTypes.has(t));
      if (unusedTypes.length > 0) {
        console.warn('⚠️ Unused types detected:', unusedTypes);
      }

      let result;
      let signerInfo = '';

      if (signingMethod === 'circle') {
        // Use Circle SDK to sign with the configured programmable wallet
        const signingPayload = {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          walletId: formData.walletId,
          typedData
        };

        result = await axios.post('http://localhost:3001/api/wallet/sign/typedData', signingPayload);
        signerInfo = `Circle SDK wallet ${formData.walletId}`;
      } else {
        // Use web3js to sign with the provided private key
        const signingPayload = {
          typedData,
          generateWallet: false,
          privateKey: formData.privateKey
        };

        result = await axios.post('http://localhost:3001/api/wallet/generateAndSign', signingPayload);
        signerInfo = `Web3js wallet from private key`;
      }

      // Handle different response structures for Circle SDK vs Web3js
      const responseData = signingMethod === 'circle' ? result.data : result.data.data;
      
      if (responseData && responseData.signature) {
        const signature = responseData.signature;
        
        console.log('✅ Permit signature generated successfully!');
        console.log('Signature:', signature);
        console.log('Signed with:', signerInfo);

        // Update form with generated values
        setFormData(prev => ({
          ...prev,
          permitNonce: randomNonce.toString(),
          permitDeadline: futureDeadline.toString(),
          signature: signature
        }));

        // Show success message
        setResponse({
          success: true,
          message: `Permit signature generated successfully with ${signingMethod === 'circle' ? 'Circle SDK' : 'Web3js'}!`,
          details: {
            signingMethod: signingMethod,
            signerInfo: signerInfo,
            signerWalletId: signingMethod === 'circle' ? formData.walletId : undefined,
            signerAddress: signingMethod === 'web3' ? responseData.wallet?.address : undefined,
            actualSigningWallet: signingMethod === 'web3' ? responseData.wallet : undefined,
            signature: signature,
            permitData: message,
            typedData: typedData
          }
        });

        console.log(`🎉 Form updated with ${signingMethod} permit signature`);
      } else {
        const errorMessage = signingMethod === 'circle' 
          ? (result.data?.error || 'Failed to generate permit signature')
          : (result.data?.error || result.data?.data?.error || 'Failed to generate permit signature');
        throw new Error(errorMessage);
      }
    } catch (err: any) {

      
      let errorMessage = 'Failed to generate permit signature';
      if (err.response) {
        console.error('❌ Server response:', err.response.data);
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
    if (!formData.permitToken) {
      setPermit2Error('Please select a token to approve');
      return;
    }

    // Validation based on signing method
    if (signingMethod === 'circle') {
      if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
        setPermit2Error('Circle credentials (API Key, Entity Secret, Wallet ID) are required for programmable wallet approval');
        return;
      }
    } else {
      if (!formData.privateKey) {
        setPermit2Error('Private key is required for ethers wallet approval');
        return;
      }
    }

    setPermit2Loading(true);
    setPermit2Error(null);
    setPermit2Response(null);

    try {
      console.log(`🔓 Approving Permit2 for token using ${signingMethod === 'circle' ? 'Circle SDK' : 'ethers wallet'}:`, formData.permitToken);

      let payload: any;
      let endpoint: string;

      if (signingMethod === 'circle') {
        // Circle SDK approval
        payload = {
          walletApiKey: state.walletApiKey,
          entitySecret: state.entitySecret,
          walletId: formData.walletId,
          tokenAddress: formData.permitToken,
          refId: formData.refId || undefined
        };
        endpoint = 'http://localhost:3001/api/approvePermit2';
      } else {
        // Ethers wallet approval
        payload = {
          privateKey: formData.privateKey,
          tokenAddress: formData.permitToken,
          rpcUrl: undefined, // Will use default Sepolia RPC
          gasLimit: undefined, // Will estimate gas
          gasPrice: undefined // Will use current gas price
        };
        endpoint = 'http://localhost:3001/api/web3/approvePermit2';
      }

      console.log(`Permit2 Approval Request (${signingMethod}):`, payload);

      const result = await axios.post(endpoint, payload);

      console.log('✅ Permit2 approval successful!', result.data);

      // Update approval state
      setPermit2Approved(prev => ({
        ...prev,
        [formData.permitToken]: true
      }));

      setPermit2Response(result.data);

      // Show success message
      console.log(`🎉 Token approved for Permit2 transfers using ${signingMethod === 'circle' ? 'Circle SDK' : 'ethers wallet'}`);

    } catch (err: any) {
      let errorMessage = `Failed to approve Permit2 using ${signingMethod === 'circle' ? 'Circle SDK' : 'ethers wallet'}`;
      if (err.response) {
        console.error('❌ Server response:', err.response.data);
        errorMessage = err.response.data?.error || err.response.data?.message || `HTTP ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setPermit2Error(errorMessage);
    } finally {
      setPermit2Loading(false);
    }
  };



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
    // Check if Permit2 is approved for the token
    if (formData.permitToken && !permit2Approved[formData.permitToken]) {
      setError(`Please approve Permit2 contract for this token before executing ${deliverType} deliver`);
      return;
    }

    if (!formData.permitToken || !formData.permitAmount || !formData.permitNonce || !formData.permitDeadline || !formData.signature) {
      setError(`All permit fields and signature are required for ${deliverType === 'taker' ? 'Taker' : 'Maker'} Deliver`);
      return;
    }
    
    // Validate that numeric fields can be converted to integers
    if (isNaN(parseInt(formData.permitAmount)) || isNaN(parseInt(formData.permitNonce)) || isNaN(parseInt(formData.permitDeadline))) {
      setError('Permit amount, nonce, and deadline must be valid numbers');
      return;
    }

    // Validation based on signing method
    if (signingMethod === 'circle') {
      if (!state.walletApiKey || !state.entitySecret || !formData.walletId) {
        setError('Circle credentials (API Key, Entity Secret, Wallet ID) are required for programmable wallet execution');
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

      if (signingMethod === 'circle') {
        // Circle SDK implementation
        if (deliverType === 'taker') {
          if (batchMode) {
            // Batch taker deliver
            const permitTokens = [{
              token: formData.permitToken,
              amount: parseInt(formData.permitAmount)
            }];
            
            payload = {
              walletApiKey: state.walletApiKey,
              entitySecret: state.entitySecret,
              contractAddress: formData.contractAddress,
              walletId: formData.walletId,
              refId: formData.refId || undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitTokens,
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/takerBatchDeliver';
          } else {
            // Single taker deliver
            payload = {
              walletApiKey: state.walletApiKey,
              entitySecret: state.entitySecret,
              contractAddress: formData.contractAddress,
              walletId: formData.walletId,
              refId: formData.refId || undefined,
              tradeId: singleTradeId,
              permit: {
                permitted: {
                  token: formData.permitToken,
                  amount: parseInt(formData.permitAmount)
                },
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/takerDeliver';
          }
        } else {
          if (batchMode) {
            // Batch maker deliver
            const permitTokens = [{
              token: formData.permitToken,
              amount: parseInt(formData.permitAmount)
            }];
            
            payload = {
              walletApiKey: state.walletApiKey,
              entitySecret: state.entitySecret,
              contractAddress: formData.contractAddress,
              walletId: formData.walletId,
              refId: formData.refId || undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitTokens,
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/makerBatchDeliver';
          } else {
            // Single maker deliver
            payload = {
              walletApiKey: state.walletApiKey,
              entitySecret: state.entitySecret,
              contractAddress: formData.contractAddress,
              walletId: formData.walletId,
              refId: formData.refId || undefined,
              tradeId: singleTradeId,
              permit: {
                permitted: {
                  token: formData.permitToken,
                  amount: parseInt(formData.permitAmount)
                },
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/makerDeliver';
          }
        }

        console.log(`Circle SDK ${deliverType}${batchMode ? 'Batch' : ''}Deliver Function Request:`, payload);
      } else {
        // Web3js/Ethers implementation
        if (deliverType === 'taker') {
          if (batchMode) {
            // Batch taker deliver
            const permitTokens = tradeIds.map(() => ({
              token: formData.permitToken,
              amount: parseInt(formData.permitAmount)
            }));
            
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitTokens,
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
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
                permitted: {
                  token: formData.permitToken,
                  amount: parseInt(formData.permitAmount)
                },
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/takerDeliver';
          }
        } else {
          if (batchMode) {
            // Batch maker deliver
            const permitTokens = tradeIds.map(() => ({
              token: formData.permitToken,
              amount: parseInt(formData.permitAmount)
            }));
            
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeIds: tradeIds,
              permit: {
                permitted: permitTokens,
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/makerBatchDeliver';
          } else {
            // Single maker deliver
            payload = {
              privateKey: formData.privateKey,
              contractAddress: formData.contractAddress,
              rpcUrl: undefined,
              gasLimit: undefined,
              gasPrice: undefined,
              tradeId: singleTradeId,
              permit: {
                permitted: {
                  token: formData.permitToken,
                  amount: parseInt(formData.permitAmount)
                },
                nonce: parseInt(formData.permitNonce),
                deadline: parseInt(formData.permitDeadline)
              },
              signature: formData.signature
            };
            endpoint = 'http://localhost:3001/api/web3/makerDeliver';
          }
        }

        console.log(`Web3js ${deliverType}${batchMode ? 'Batch' : ''}Deliver Function Request:`, payload);
      }

      const result = await axios.post(endpoint, payload);

      setResponse(result.data);
      console.log(`${deliverType}Deliver Function Response:`, result.data);

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
      console.error('TakerDeliver Function Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove permitTokens, handlePermitTokenChange, addPermitToken, removePermitToken, and batch UI logic

  return (
    <div className="form-container" style={{ maxWidth: 'none', width: '100%', padding: '2rem 3rem' }}>
      <h2>{deliverType === 'taker' ? 'Taker Deliver' : 'Maker Deliver'}</h2>
      <p>Execute {deliverType}Deliver or {deliverType}BatchDeliver functions on FxEscrow contract with permit signatures. Single trade ID uses individual functions, multiple trade IDs use batch functions.</p>
      
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
                📦 Taker Deliver
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
                🏭 Maker Deliver
              </button>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
            {deliverType === 'taker' 
              ? 'Execute takerDeliver (single) or takerBatchDeliver (multiple) - Requires Permit2 signature(s) for token transfer from taker to contract.'
              : 'Execute makerDeliver (single) or makerBatchDeliver (multiple) - Requires Permit2 signature(s) for token transfer from maker to contract.'
            }
          </p>
        </div>
      )}

      {/* Signing Method Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 'bold', color: '#2d3748' }}>Signing Method:</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setSigningMethod('circle')}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${signingMethod === 'circle' ? '#667eea' : '#e2e8f0'}`,
                backgroundColor: signingMethod === 'circle' ? '#667eea' : 'white',
                color: signingMethod === 'circle' ? 'white' : '#4a5568',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🔵 Circle SDK
            </button>
            <button
              type="button"
              onClick={() => setSigningMethod('web3')}
              style={{
                padding: '0.5rem 1rem',
                border: `2px solid ${signingMethod === 'web3' ? '#38a169' : '#e2e8f0'}`,
                backgroundColor: signingMethod === 'web3' ? '#38a169' : 'white',
                color: signingMethod === 'web3' ? 'white' : '#4a5568',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🧪 Web3.js + Ethers
            </button>
          </div>
        </div>
        
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>
          {signingMethod === 'circle' 
            ? 'Sign EIP-712 permit data using Circle\'s Programmable Wallets SDK with your managed wallet.'
            : 'Sign EIP-712 permit data using Web3.js + Ethers.js with your private key.'
          }
        </p>
      </div>
      




      <form onSubmit={handleSubmit} className="api-form" style={{ width: '100%' }}>
        {/* Contract Configuration */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>Contract Configuration</legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {signingMethod === 'circle' ? (
              <div className="form-group">
                <label htmlFor="walletId">Wallet ID *</label>
                <input
                  type="text"
                  id="walletId"
                  value={formData.walletId}
                  onChange={(e) => handleInputChange('walletId', e.target.value)}
                  placeholder="Enter wallet ID (or set in Settings)"
                  required
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                />
                {state.walletId && formData.walletId === state.walletId && (
                  <small style={{ color: '#38a169' }}>
                    ✓ Auto-populated from settings
                  </small>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="privateKey">Private Key *</label>
                <input
                  type="password"
                  id="privateKey"
                  value={formData.privateKey}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  placeholder="0x... (64-character private key)"
                  required
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                />
                <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                  Your private key for signing the permit. This is used directly for signing and never stored.
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="refId">Reference ID</label>
              <input
                type="text"
                id="refId"
                value={formData.refId}
                onChange={(e) => handleInputChange('refId', e.target.value)}
                placeholder="Optional tracking ID"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Optional ID for tracking this transaction
              </small>
            </div>
          </div>
        </fieldset>

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
                        Will use: {deliverType}{batchMode ? 'BatchDeliver' : 'Deliver'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </fieldset>

        {/* Permit2 Data */}
        <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2rem', marginBottom: '2rem' }}>
          <legend style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.1rem' }}>
            Permit2 Transfer Data <span style={{ fontSize: '0.9rem', color: '#e53e3e' }}>(Required for Both Taker and Maker Deliver)</span>
          </legend>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="form-group">
                    <label htmlFor="permitToken">Token *</label>
                    <select
                        id="permitToken"
                        value={formData.permitToken}
                        onChange={(e) => handleInputChange('permitToken', e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', backgroundColor: 'white' }}
                    >
                        <option value="">Select a token...</option>
                        <option value="0x1c7d4b196cb0c7b01d743fbc6116a902379c7238">USDC (USD Coin)</option>
                        <option value="0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4">EURC (Euro Coin)</option>
                    </select>
                    <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                        Select the token to be transferred (Ethereum Sepolia testnet)
                        {formData.permitToken && (
                            <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    <br />📍 {formData.permitToken}
                  </span>
                        )}
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="permitAmount">Amount *</label>
                    <input
                        type="number"
                        id="permitAmount"
                        value={formData.permitAmount}
                        onChange={(e) => handleInputChange('permitAmount', e.target.value)}
                        placeholder={formData.permitToken ?
                            (formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? '1000000 (1 USDC)' :
                                formData.permitToken === '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4' ? '1000000 (1 EURC)' :
                                    'Amount in smallest unit') : 'Amount in smallest unit'
                        }
                        required
                        min="0"
                        step="1"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    />
                    <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                        Amount to transfer (both USDC and EURC use 6 decimals)
                        {formData.permitToken && formData.permitAmount && (
                            <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    <br />💰 {(parseInt(formData.permitAmount) / 1000000).toFixed(6)} {
                                formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' :
                                    formData.permitToken === '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4' ? 'EURC' : 'tokens'
                            }
                  </span>
                        )}
                    </small>
                    {formData.permitToken && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => handleInputChange('permitAmount', '1000000')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#f7fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                1 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleInputChange('permitAmount', '10000000')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#f7fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                10 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleInputChange('permitAmount', '100000000')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#f7fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                100 {formData.permitToken === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' ? 'USDC' : 'EURC'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

          {/* Permit2 Approval Section */}
          {formData.permitToken && (
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1.5rem', 
              backgroundColor: permit2Approved[formData.permitToken] ? '#f0fff4' : '#fffaf0', 
              border: `2px solid ${permit2Approved[formData.permitToken] ? '#38a169' : '#ed8936'}`,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                  {permit2Approved[formData.permitToken] ? '✅' : '🔓'}
                </span>
                <h3 style={{ 
                  margin: 0, 
                  color: permit2Approved[formData.permitToken] ? '#38a169' : '#ed8936' 
                }}>
                  Step 1: Approve Permit2 Contract
                </h3>
              </div>
              
              <p style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.95rem', 
                color: '#4a5568' 
              }}>
                {permit2Approved[formData.permitToken] 
                  ? '✅ This token is approved for Permit2 transfers. You can now generate and sign permits.'
                  : 'Before you can use Permit2 signatures, you need to approve the Permit2 contract to spend your tokens. This is a one-time approval per token.'
                }
              </p>

              {!permit2Approved[formData.permitToken] && (
                <div style={{ textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={approvePermit2}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      backgroundColor: '#ed8936',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(237, 137, 54, 0.3)'
                    }}
                    disabled={permit2Loading || 
                      (signingMethod === 'circle' && (!state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
                      (signingMethod === 'web3' && !formData.privateKey)}
                  >
                    {permit2Loading 
                      ? `Approving with ${signingMethod === 'circle' ? 'Circle SDK' : 'Ethers Wallet'}...` 
                      : `🔓 Approve Permit2 (${signingMethod === 'circle' ? 'Circle SDK' : 'Ethers Wallet'})`
                    }
                  </button>
                  
                  {((signingMethod === 'circle' && (!state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
                    (signingMethod === 'web3' && !formData.privateKey)) && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
                      {signingMethod === 'circle' 
                        ? 'Configure Circle credentials in Settings to enable approval'
                        : 'Enter a private key to enable ethers wallet approval'
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Permit2 Response Display */}
              {permit2Error && (
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem', 
                  backgroundColor: '#fed7d7', 
                  border: '1px solid #e53e3e', 
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>❌</span>
                    <div>
                      <strong style={{ color: '#e53e3e' }}>Approval Error:</strong>
                      <div style={{ marginTop: '0.5rem', color: '#2d3748' }}>
                        {permit2Error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {permit2Response && (
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem', 
                  backgroundColor: '#f0fff4', 
                  border: '1px solid #38a169', 
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    <strong style={{ color: '#38a169' }}>Permit2 Approved!</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#2c5aa0' }}>
                    <strong>Transaction ID:</strong> {permit2Response.id}<br/>
                    <strong>Status:</strong> {permit2Response.state}<br/>
                    <strong>Token:</strong> {permit2Response.tokenAddress}<br/>
                    <strong>Approval:</strong> Unlimited (recommended for Permit2)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Permit Button */}
          <div style={{ 
            marginBottom: '2rem', 
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: formData.signature ? '#f0fff4' : '#f7fafc',
            border: `2px solid ${formData.signature ? '#38a169' : '#e2e8f0'}`,
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                {formData.signature ? '✅' : '🔐'}
              </span>
              <h3 style={{ 
                margin: 0, 
                color: formData.signature ? '#38a169' : '#4a5568'
              }}>
                Step 2: Generate & Sign Permit
              </h3>
            </div>
            
            {deliverType === 'taker' && formData.permitToken && !permit2Approved[formData.permitToken] && (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fffaf0',
                border: '1px solid #ed8936',
                borderRadius: '4px',
                fontSize: '0.9rem',
                color: '#8b5738'
              }}>
                ⚠️ Please approve Permit2 contract first (Step 1 above)
              </div>
            )}
            
            <button 
              type="button" 
              onClick={generateAndSignPermit}
              className="example-button"
              style={{ 
                backgroundColor: formData.signature ? '#38a169' : '#667eea', 
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                boxShadow: `0 2px 4px rgba(${formData.signature ? '56, 161, 105' : '102, 126, 234'}, 0.3)`,
                opacity: (deliverType === 'taker' && formData.permitToken && !permit2Approved[formData.permitToken]) ? 0.6 : 1
              }}
              title="Generate random nonce/deadline and sign permit"
              disabled={loading || !formData.permitToken || !formData.permitAmount || !formData.tradeIds ||
                (deliverType === 'taker' && formData.permitToken && !permit2Approved[formData.permitToken]) ||
                (signingMethod === 'circle' && (!state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
                (signingMethod === 'web3' && !formData.privateKey)}
            >
              {formData.signature ? '✅ Permit Ready' : (loading ? 'Signing...' : '🔐 Generate & Sign Permit')}
            </button>
            {((signingMethod === 'circle' && (!formData.permitToken || !formData.permitAmount || !state.walletApiKey || !state.entitySecret || !formData.walletId)) ||
             (signingMethod === 'web3' && (!formData.permitToken || !formData.permitAmount || !formData.privateKey))) && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096' }}>
                {!formData.permitToken || !formData.permitAmount ? 
                  'Select a token and enter an amount to enable permit generation' :
                  signingMethod === 'circle' ? 
                    'Configure Circle credentials in Settings to enable programmable wallet signing' :
                    'Enter a private key to enable Web3js signing'
                }
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="permitNonce">
                Nonce * 
                <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                  🔐 Auto-generated
                </span>
              </label>
              <input
                type="number"
                id="permitNonce"
                value={formData.permitNonce}
                onChange={(e) => handleInputChange('permitNonce', e.target.value)}
                placeholder="Unique nonce for this permit (click Generate & Sign Permit)"
                required
                min="0"
                step="1"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '0.95rem',
                  backgroundColor: formData.permitNonce ? '#f0f8ff' : 'white',
                  borderColor: formData.permitNonce ? '#667eea' : '#e2e8f0'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Unique number to prevent replay attacks
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="permitDeadline">
                Deadline * 
                <span style={{ fontSize: '0.8rem', color: '#667eea', marginLeft: '0.5rem' }}>
                  🔐 Auto-generated
                </span>
              </label>
              <input
                type="number"
                id="permitDeadline"
                value={formData.permitDeadline}
                onChange={(e) => handleInputChange('permitDeadline', e.target.value)}
                placeholder="Unix timestamp (click Generate & Sign Permit)"
                required
                min="0"
                step="1"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '0.95rem',
                  backgroundColor: formData.permitDeadline ? '#f0f8ff' : 'white',
                  borderColor: formData.permitDeadline ? '#667eea' : '#e2e8f0'
                }}
              />
              <small style={{ color: '#718096', fontSize: '0.85rem' }}>
                Expiration time for this permit
                {formData.permitDeadline && (
                  <span style={{ color: '#667eea', marginLeft: '0.5rem' }}>
                    (Expires: {new Date(parseInt(formData.permitDeadline) * 1000).toLocaleString()})
                  </span>
                )}
              </small>
            </div>
          </div>

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

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#e6fffa',
          border: '2px solid #319795',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🚀</span>
            <h3 style={{ margin: 0, color: '#319795' }}>
              Step 3: Execute {deliverType === 'taker' ? 'Taker' : 'Maker'} Deliver
            </h3>
          </div>
          
          {deliverType === 'taker' && (
            <div style={{ marginBottom: '1rem' }}>
              {!permit2Approved[formData.permitToken] && formData.permitToken && (
                <div style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fffaf0',
                  border: '1px solid #ed8936',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#8b5738'
                }}>
                  ⚠️ Approve Permit2 contract first
                </div>
              )}
              {!formData.signature && formData.permitToken && permit2Approved[formData.permitToken] && (
                <div style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#f0f8ff',
                  border: '1px solid #667eea',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#4a5568'
                }}>
                  🔐 Generate permit signature first
                </div>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || 
              (formData.permitToken && !permit2Approved[formData.permitToken]) ||
              !formData.signature
            }
            style={{ 
              width: '100%', 
              padding: '1rem 2rem', 
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backgroundColor: (formData.permitToken && !permit2Approved[formData.permitToken]) || 
                              !formData.signature ? '#a0aec0' : '#319795',
              borderColor: (formData.permitToken && !permit2Approved[formData.permitToken]) || 
                          !formData.signature ? '#a0aec0' : '#319795',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: (formData.permitToken && !permit2Approved[formData.permitToken]) || 
                     !formData.signature ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? `Executing ${deliverType} Deliver...` : `🚀 Execute ${deliverType === 'taker' ? 'Taker' : 'Maker'} Deliver`}
          </button>
        </div>
      </form>

      {/* Response Display */}
      {(response || error || loading) && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
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
                  marginTop: '0.5rem'
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
