import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { Web3 } from 'web3';
import { ethers } from 'ethers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment URLs
const ENVIRONMENTS = {
  smokebox: 'https://api-smokebox.circle.com',
  sandbox: 'https://api-sandbox.circle.com'
};

// Helper function to get base URL
const getBaseUrl = (env: string): string => {
  return ENVIRONMENTS[env as keyof typeof ENVIRONMENTS] || ENVIRONMENTS.smokebox;
};

// POST /v1/exchange/cps/quotes
app.post('/api/quotes', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    const baseUrl = getBaseUrl(environment);
    
    const response = await axios.post(
      `${baseUrl}/v1/exchange/cps/quotes`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /v1/exchange/cps/trades
app.post('/api/trades', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    const baseUrl = getBaseUrl(environment);
    
    const response = await axios.post(
      `${baseUrl}/v1/exchange/cps/trades`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /v1/exchange/cps/signatures
app.post('/api/signatures', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    const baseUrl = getBaseUrl(environment);
    
    const response = await axios.post(
      `${baseUrl}/v1/exchange/cps/signatures`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /v1/exchange/signatures/funding/presign - Get typed data for Permit2
app.post('/api/signatures/funding/presign', async (req, res) => {
  try {
    const { environment, apiKey, contractTradeIds, traderType, fundingMode } = req.body;
    
    // Validate required fields
    if (!apiKey) {
      return res.status(400).json({
        error: 'apiKey is required'
      });
    }
    
    if (!contractTradeIds || !Array.isArray(contractTradeIds) || contractTradeIds.length === 0) {
      return res.status(400).json({
        error: 'contractTradeIds must be a non-empty array'
      });
    }
    
    if (!traderType || !['taker', 'maker'].includes(traderType)) {
      return res.status(400).json({
        error: 'traderType must be either "taker" or "maker"'
      });
    }
    
    if (!fundingMode || !['gross', 'net'].includes(fundingMode)) {
      return res.status(400).json({
        error: 'fundingMode must be either "gross" or "net"'
      });
    }
    
    console.log('=== Circle Presign API Request ===');
    console.log('Environment:', environment);
    console.log('Contract Trade IDs:', contractTradeIds);
    console.log('Trader Type:', traderType);
    console.log('Funding Mode:', fundingMode);
    console.log('==================================');
    
    const baseUrl = getBaseUrl(environment);
    
    const requestBody = {
      contractTradeIds,
      traderType,
      fundingMode
    };
    
    const response = await axios.post(
      `${baseUrl}/v1/exchange/cps/signatures/funding/presign`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('=== Circle Presign API Response ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('===================================');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Circle Presign API Error:', error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || error.response.data?.error || error.message;
    } else if (error.request) {
      errorMessage = 'No response from Circle API. Please check your network connection.';
    } else {
      errorMessage = error.message || 'Request failed to send';
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data || null
    });
  }
});

// GET /v1/exchange/cps/trades
app.get('/api/trades', async (req, res) => {
  try {
    const { environment, apiKey, ...queryParams } = req.query;
    const baseUrl = getBaseUrl(environment as string);
    
    const response = await axios.get(
      `${baseUrl}/v1/exchange/cps/trades`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: queryParams
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// GET /v1/exchange/cps/trades/:tradeId
app.get('/api/trades/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { environment, apiKey, ...queryParams } = req.query;
    const baseUrl = getBaseUrl(environment as string);
    
    const response = await axios.get(
      `${baseUrl}/v1/exchange/cps/trades/${tradeId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: queryParams
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// GET /v1/exchange/cps/signatures/presign/:selector/:tradeId
app.get('/api/signatures/presign/:selector/:tradeId', async (req, res) => {
  try {
    const { selector, tradeId } = req.params;
    const { environment, apiKey, ...queryParams } = req.query;
    const baseUrl = getBaseUrl(environment as string);
    
    // Validate selector
    if (selector !== 'taker' && selector !== 'maker') {
      return res.status(400).json({
        error: 'Invalid selector. Must be either "taker" or "maker"'
      });
    }
    
    const response = await axios.get(
      `${baseUrl}/v1/exchange/cps/signatures/presign/${selector}/${tradeId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: queryParams
      }
    );
    

    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /v1/w3s/developer/sign/typedData
app.post('/api/wallet/sign/typedData', async (req, res) => {
  try {
    const { walletApiKey, entitySecret, ...requestBody } = req.body;
    
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required'
      });
    }

    if (!requestBody.walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!requestBody.typedData) {
      return res.status(400).json({
        error: 'typedData is required'
      });
    }

    // Validate typedData structure (domain is optional for simplified signing)
    const { typedData } = requestBody;
    if (!typedData.types || !typedData.primaryType || !typedData.message) {
      return res.status(400).json({
        error: 'typedData must include types, primaryType, and message fields'
      });
    }

    // Log the request for debugging (remove in production)
    console.log('Sign Typed Data Request:', {
      walletId: requestBody.walletId,
      primaryType: typedData.primaryType,
      hasDomain: !!typedData.domain,
      domain: typedData.domain || 'none provided',
      typesKeys: Object.keys(typedData.types),
      messageKeys: Object.keys(typedData.message)
    });

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Enhanced request body logging
    console.log('=== Sign Typed Data Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', requestBody.walletId);
    console.log('Primary Type:', requestBody.typedData?.primaryType);
    console.log('Domain:', JSON.stringify(requestBody.typedData?.domain, null, 2));
    console.log('Types Keys:', Object.keys(requestBody.typedData?.types || {}));
    console.log('Message Keys:', Object.keys(requestBody.typedData?.message || {}));
    console.log('Full Request Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('================================');

    // Prepare typedData for Circle SDK (remove EIP712Domain if present)
    let typedDataForCircle = { ...requestBody.typedData };
  

    // Validate the typedData can be stringified
    let dataString;
    try {
      dataString = JSON.stringify(typedDataForCircle);
      if (!dataString || dataString === 'null' || dataString === '{}') {
        throw new Error('Invalid typed data structure');
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to serialize typed data to JSON string',
        details: error instanceof Error ? error.message : 'Unknown serialization error'
      });
    }

    // Transform the request to match Circle's expected format
    const circleRequest = {
      walletId: requestBody.walletId,
      data: dataString
    };

    // Log the transformed request
    console.log('=== Transformed Circle Request ===');
    console.log('Wallet ID:', circleRequest.walletId);
    console.log('Original types:', Object.keys(requestBody.typedData.types || {}));
    console.log('Clean types:', Object.keys(typedDataForCircle.types || {}));
    console.log('Data (stringified):', circleRequest.data);
    console.log('Data length:', circleRequest.data.length);
    console.log('Full request:', JSON.stringify(circleRequest, null, 2));
    console.log('==================================');

    // Call the signTypedData method with the transformed request
    // The Circle SDK should handle entitySecretCiphertext generation automatically
    const response = await circleClient.signTypedData(circleRequest);
    
    // Log the successful response
    console.log('=== Circle SDK Response ===');
    console.log('Response Status:', response.status || 'Unknown');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('===========================');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Sign Typed Data Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error occurred while signing typed data';
    let errorDetails = null;

    if (error.response) {
      // Circle API error
      statusCode = error.response.status;
      errorDetails = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key and entity secret.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request data. Please check your wallet ID and typed data format.';
      } else if (error.response.status === 404) {
        errorMessage = 'Wallet not found. Please verify the wallet ID is correct.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions and entity secret.';
      } else {
        errorMessage = error.response.data?.message || `Circle API error: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Circle API. Please check your internet connection.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      errorMessage = 'Invalid API key format or missing authentication credentials.';
    } else if (error.message.includes('entity secret')) {
      statusCode = 401;
      errorMessage = 'Invalid entity secret. Please check your entity secret configuration.';
    } else {
      errorMessage = error.message || 'Unknown error occurred';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/exchange/cps/signatures
app.post('/api/signatures/register', async (req, res) => {
  try {
    const { tradeId, type, address, details, signature } = req.body;
    const { environment, apiKey } = req.query;
    const baseUrl = getBaseUrl(environment as string);
    
    if (!tradeId) {
      return res.status(400).json({
        error: 'Trade ID is required'
      });
    }
    
    if (!type) {
      return res.status(400).json({
        error: 'Type is required'
      });
    }
    
    if (!address) {
      return res.status(400).json({
        error: 'Address is required'
      });
    }
    
    if (!details) {
      return res.status(400).json({
        error: 'Details are required'
      });
    }
    
    if (!signature) {
      return res.status(400).json({
        error: 'Signature is required'
      });
    }
    
    // Log the registration request for debugging
    console.log('=== Signature Registration Request ===');
    console.log('Trade ID:', tradeId);
    console.log('Type:', type);
    console.log('Address:', address);
    console.log('Details:', JSON.stringify(details, null, 2));
    console.log('Signature:', signature);
    console.log('Environment:', environment);
    console.log('=====================================');
    
    const requestBody = {
      tradeId,
      type,
      address,
      details,
      signature
    };
    
    const response = await axios.post(
      `${baseUrl}/v1/exchange/cps/signatures`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('=== Signature Registration Response ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('======================================');
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Signature Registration Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /api/recordTrade - Record trade on FxEscrow contract using Circle SDK
app.post('/api/recordTrade', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      taker,
      takerDetails,
      takerSignature,
      maker,
      makerDetails,
      makerSignature
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (!taker || !takerDetails || !takerSignature) {
      return res.status(400).json({
        error: 'taker, takerDetails, and takerSignature are required'
      });
    }

    if (!maker || !makerDetails || !makerSignature) {
      return res.status(400).json({
        error: 'maker, makerDetails, and makerSignature are required'
      });
    }

    // Validate takerDetails structure
    if (!takerDetails.consideration || !takerDetails.recipient || 
        takerDetails.fee === undefined || takerDetails.nonce === undefined || 
        takerDetails.deadline === undefined) {
      return res.status(400).json({
        error: 'Invalid takerDetails structure. Must include consideration, recipient, fee, nonce, and deadline'
      });
    }

    // Validate makerDetails structure
    if (makerDetails.fee === undefined || makerDetails.nonce === undefined || makerDetails.deadline === undefined) {
      return res.status(400).json({
        error: 'Invalid makerDetails structure. Must include fee, nonce, and deadline'
      });
    }

    console.log('=== Circle SDK Contract Execution Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Taker:', taker);
    console.log('Maker:', maker);
    console.log('Taker Details:', JSON.stringify(takerDetails, null, 2));
    console.log('Maker Details:', JSON.stringify(makerDetails, null, 2));
    console.log('=============================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for recordTrade
    const abiFunctionSignature = "recordTrade(address,((bytes32,address,address,uint256,uint256,uint256),address,uint256,uint256,uint256),bytes,address,(uint256,uint256,uint256),bytes)";

    // Convert values to strings for Circle SDK (it expects string representation of large numbers)
    const ensureString = (value: any) => {
      if (typeof value === 'string') {
        return value;
      }
      return String(value);
    };

    // Prepare the ABI parameters array with proper string conversion for Circle SDK
    const abiParameters = [
      taker, // address taker
      [ // TakerDetails struct
        [ // Consideration struct
          takerDetails.consideration.quoteId, // bytes32 (keep as string/hex)
          takerDetails.consideration.base, // address (keep as string)
          takerDetails.consideration.quote, // address (keep as string)
          ensureString(takerDetails.consideration.baseAmount), // uint256 -> string
          ensureString(takerDetails.consideration.quoteAmount), // uint256 -> string
          ensureString(takerDetails.consideration.maturity) // uint256 -> string
        ],
        takerDetails.recipient, // address (keep as string)
        ensureString(takerDetails.fee), // uint256 -> string
        takerDetails.nonce, // uint256 -> keep as-is (nonces seem to work as integers)
        ensureString(takerDetails.deadline) // uint256 -> string
      ],
      takerSignature, // bytes (keep as string/hex)
      maker, // address maker (keep as string)
      [ // MakerDetails struct
        ensureString(makerDetails.fee), // uint256 -> string
        makerDetails.nonce, // uint256 -> keep as-is (nonces seem to work as integers)
        ensureString(makerDetails.deadline) // uint256 -> string
      ],
      makerSignature // bytes (keep as string/hex)
    ];

    console.log('=== Contract Execution Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Parameter Types (Circle SDK expects strings for uint256):');
    console.log('- baseAmount:', typeof abiParameters[1][0][3], '(value:', abiParameters[1][0][3], ')');
    console.log('- quoteAmount:', typeof abiParameters[1][0][4], '(value:', abiParameters[1][0][4], ')');
    console.log('- maturity:', typeof abiParameters[1][0][5], '(value:', abiParameters[1][0][5], ')');
    console.log('- takerFee:', typeof abiParameters[1][1], '(value:', abiParameters[1][1], ')');
    console.log('- takerNonce:', typeof abiParameters[1][2], '(value:', abiParameters[1][2], ')');
    console.log('- takerDeadline:', typeof abiParameters[1][3], '(value:', abiParameters[1][3], ')');
    console.log('- makerFee:', typeof abiParameters[3][0], '(value:', abiParameters[3][0], ')');
    console.log('- makerNonce:', typeof abiParameters[3][1], '(value:', abiParameters[3][1], ')');
    console.log('- makerDeadline:', typeof abiParameters[3][2], '(value:', abiParameters[3][2], ')');
    console.log('Full Parameters:', JSON.stringify(abiParameters, null, 2));
    console.log('=====================================');

    // Create the contract execution request
    const contractExecutionRequest = {
      contractAddress: contractAddress,
      walletId: walletId,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      fee: {
        config: {
          feeLevel: 'MEDIUM' as const
        },
        type: 'level' as const
      },
      ...(refId && { refId: refId }) // Only include refId if provided
    };

    console.log('=== Final Contract Execution Request ===');
    console.log('Request payload:', JSON.stringify(contractExecutionRequest, null, 2));
    console.log('RefId included:', !!refId);
    console.log('========================================');
    
    console.log('Executing contract function via Circle SDK...');

    // Execute the contract function using Circle SDK
    const response = await circleClient.createContractExecutionTransaction(contractExecutionRequest);

    console.log('=== Circle SDK Response ===');
    console.log('Response Status:', response.status || 'Unknown');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('===========================');

    // Return the Circle SDK response
    res.json(response.data);

  } catch (error: any) {
    console.error('Circle SDK Contract Execution Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error occurred while executing contract function';
    let errorDetails = null;

    if (error.response) {
      // Circle API error
      statusCode = error.response.status;
      errorDetails = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key and entity secret.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request data. Please check your parameters.';
      } else if (error.response.status === 404) {
        errorMessage = 'Wallet not found. Please verify the wallet ID is correct.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions and entity secret.';
      } else {
        errorMessage = error.response.data?.message || `Circle API error: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Circle API. Please check your internet connection.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      errorMessage = 'Invalid API key format or missing authentication credentials.';
    } else if (error.message.includes('entity secret')) {
      statusCode = 401;
      errorMessage = 'Invalid entity secret. Please check your entity secret configuration.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during contract execution';
      errorDetails = error.stack;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      method: 'Circle SDK createContractExecution'
    });
  }
});

/**
 * Generate a wallet and sign typed data using Web3.js/ethers.js
 * Alternative to Circle SDK for signing
 */
app.post('/api/wallet/generateAndSign', async (req, res) => {
  try {
    const { typedData, generateWallet = false } = req.body;
    
    console.log('🧪 Web3.js wallet signing request:', { generateWallet, hasTypedData: !!typedData });

    if (!typedData) {
      return res.status(400).json({
        success: false,
        error: 'typedData is required'
      });
    }

    // Validate EIP-712 structure (domain is optional for simplified signing)
    if (!typedData.types || !typedData.message) {
      return res.status(400).json({
        success: false,
        error: 'Invalid EIP-712 typed data structure. Must have types and message fields.'
      });
    }

    // Validate primaryType if provided (it's part of EIP-712 spec)
    if (typedData.primaryType && !typedData.types[typedData.primaryType]) {
      return res.status(400).json({
        success: false,
        error: `Primary type '${typedData.primaryType}' not found in types definition.`
      });
    }

    const web3 = new Web3();
    let walletInfo = null;
    let privateKey = null;

    if (generateWallet) {
      // Generate a new wallet
      const wallet = web3.eth.accounts.create();
      walletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      privateKey = wallet.privateKey;
      console.log('📱 Generated new wallet:', wallet.address);
    } else {
      // Use provided private key, wallet address, or generate one
      const providedPrivateKey = req.body.privateKey;
      const providedWalletAddress = req.body.walletAddress;
      
      if (providedPrivateKey) {
        try {
          const wallet = web3.eth.accounts.privateKeyToAccount(providedPrivateKey);
          walletInfo = {
            address: wallet.address,
            privateKey: providedPrivateKey
          };
          privateKey = providedPrivateKey;
          console.log('🔑 Using provided private key for wallet:', wallet.address);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid private key provided'
          });
        }
      } else if (providedWalletAddress) {
        // Generate a deterministic private key from the wallet address for signing
        // This is for testing purposes - in production you'd need the actual private key
        const crypto = require('crypto');
        const addressHash = crypto.createHash('sha256').update(providedWalletAddress.toLowerCase()).digest('hex');
        const deterministicPrivateKey = '0x' + addressHash;
        
        try {
          const wallet = web3.eth.accounts.privateKeyToAccount(deterministicPrivateKey);
          walletInfo = {
            address: wallet.address,
            privateKey: deterministicPrivateKey,
            originalRequestedAddress: providedWalletAddress
          };
          privateKey = deterministicPrivateKey;
          console.log('🎯 Generated deterministic wallet for address:', providedWalletAddress);
          console.log('📍 Actual signing wallet:', wallet.address);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Failed to generate wallet from provided address'
          });
        }
      } else {
        // Generate wallet if no private key or address provided
        const wallet = web3.eth.accounts.create();
        walletInfo = {
          address: wallet.address,
          privateKey: wallet.privateKey
        };
        privateKey = wallet.privateKey;
        console.log('📱 Generated new wallet (no key provided):', wallet.address);
      }
    }

    // Sign with ethers for EIP-712
    const ethersWallet = new ethers.Wallet(privateKey);
    console.log('✍️  Signing typed data with ethers...');
    
    // Remove EIP712Domain from types if present (ethers.js handles domain separately)
    const { EIP712Domain, ...cleanTypes } = typedData.types;
    if (EIP712Domain) {
      console.log('🧹 Removed EIP712Domain from types object (ethers.js handles this separately)');
    }
    
    // Validate that all remaining types are actually used in the type chain
    const validateTypes = (types: any, primaryType: string): any => {
      const usedTypes = new Set([primaryType]);
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
      const definedTypes = Object.keys(types);
      const unusedTypes = definedTypes.filter(t => !usedTypes.has(t));
      
      if (unusedTypes.length > 0) {
        console.warn('⚠️ Removing unused types:', unusedTypes);
        const filteredTypes: any = {};
        usedTypes.forEach(typeName => {
          if (types[typeName]) {
            filteredTypes[typeName] = types[typeName];
          }
        });
        return filteredTypes;
      }
      
      return types;
    };
    
    // Clean up unused types to avoid ethers.js validation errors
    const finalTypes = validateTypes(cleanTypes, typedData.primaryType);
    
    console.log('📝 Signing with:', {
      domain: typedData.domain,
      typesCount: Object.keys(finalTypes).length,
      primaryType: typedData.primaryType || 'auto-detected',
      hasMessage: !!typedData.message,
      removedEIP712Domain: !!EIP712Domain,
      finalTypeNames: Object.keys(finalTypes)
    });
    
    const signature = await ethersWallet.signTypedData(
      typedData.domain,
      finalTypes,
      typedData.message
    );

    console.log('✅ Signature generated successfully');

    console.log('Signature:', signature);

    // Parse signature into components (similar to Circle SDK format)

    res.json({
      success: true,
      data: {
        signature,
        wallet: walletInfo,
        typedData: {
          original: typedData,
          usedForSigning: {
            domain: typedData.domain,
            types: finalTypes,
            message: typedData.message
          },
          cleanedTypes: {
            removedEIP712Domain: !!EIP712Domain,
            originalTypeCount: Object.keys(typedData.types).length,
            finalTypeCount: Object.keys(finalTypes).length,
            removedTypes: Object.keys(typedData.types).filter(t => !finalTypes[t])
          }
        },
        metadata: {
          primaryType: typedData.primaryType,
          chainId: typedData.domain.chainId,
          verifyingContract: typedData.domain.verifyingContract,
          messageKeys: Object.keys(typedData.message)
        },
        method: 'web3js-ethers'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in Web3.js signing:', error);
    
    // Provide more specific error messages for common issues
    let errorMessage = error.message;
    let errorDetails = error.stack;
    
    if (error.message?.includes('invalid type')) {
      errorMessage = 'Invalid EIP-712 type definition. Check that all types in the message match the types schema.';
    } else if (error.message?.includes('missing type')) {
      errorMessage = 'Missing type definition in EIP-712 types. Ensure all referenced types are defined.';
    } else if (error.message?.includes('domain')) {
      errorMessage = 'Invalid domain configuration. Check chainId, verifyingContract, name, and version.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      originalError: error.message,
      details: errorDetails,
      debugInfo: {
        hasTypedData: !!req.body.typedData,
        typedDataStructure: req.body.typedData ? {
          hasDomain: !!req.body.typedData.domain,
          hasTypes: !!req.body.typedData.types,
          hasMessage: !!req.body.typedData.message,
          primaryType: req.body.typedData.primaryType,
          typeNames: req.body.typedData.types ? Object.keys(req.body.typedData.types) : []
        } : null
      }
    });
  }
});

/**
 * Generate test wallets and signed mock data for contract execution testing
 */
// POST /api/breachTrade - Breach trade on FxEscrow contract using Circle SDK
app.post('/api/breachTrade', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      tradeId
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (tradeId === undefined || tradeId === null) {
      return res.status(400).json({
        error: 'tradeId is required'
      });
    }

    // Validate tradeId is a positive integer
    const tradeIdNumber = parseInt(tradeId);
    if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
      return res.status(400).json({
        error: 'tradeId must be a valid non-negative integer'
      });
    }

    console.log('=== Circle SDK Breach Trade Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Trade ID:', tradeIdNumber);
    console.log('========================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for breach
    const abiFunctionSignature = "breach(uint256)";

    // Prepare the ABI parameters array
    const abiParameters = [
      tradeIdNumber // uint256 tradeId
    ];

    console.log('=== Breach Function Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Trade ID Type:', typeof abiParameters[0], '(value:', abiParameters[0], ')');
    console.log('Full Parameters:', JSON.stringify(abiParameters, null, 2));
    console.log('==================================');

    // Create the contract execution request
    const contractExecutionRequest = {
      contractAddress: contractAddress,
      walletId: walletId,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      fee: {
        config: {
          feeLevel: 'MEDIUM' as const
        },
        type: 'level' as const
      },
      ...(refId && { refId: refId }) // Only include refId if provided
    };

    console.log('=== Final Breach Contract Execution Request ===');
    console.log('Request payload:', JSON.stringify(contractExecutionRequest, null, 2));
    console.log('RefId included:', !!refId);
    console.log('===============================================');
    
    console.log('Executing breach function via Circle SDK...');

    // Execute the contract function using Circle SDK
    const response = await circleClient.createContractExecutionTransaction(contractExecutionRequest);

    console.log('=== Circle SDK Breach Response ===');
    console.log('Response Status:', response.status || 'Unknown');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('==================================');

    // Return the Circle SDK response
    res.json(response.data);

  } catch (error: any) {
    console.error('Circle SDK Breach Function Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error occurred while executing breach function';
    let errorDetails = null;

    if (error.response) {
      // Circle API error
      statusCode = error.response.status;
      errorDetails = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key and entity secret.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request data. Please check your parameters.';
      } else if (error.response.status === 404) {
        errorMessage = 'Wallet not found. Please verify the wallet ID is correct.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions and entity secret.';
      } else {
        errorMessage = error.response.data?.message || `Circle API error: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Circle API. Please check your internet connection.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      errorMessage = 'Invalid API key format or missing authentication credentials.';
    } else if (error.message.includes('entity secret')) {
      statusCode = 401;
      errorMessage = 'Invalid entity secret. Please check your entity secret configuration.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during breach function execution';
      errorDetails = error.stack;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      method: 'Circle SDK createContractExecution - breach'
    });
  }
});

// POST /api/approvePermit2 - Approve Permit2 contract to spend tokens using Circle SDK
app.post('/api/approvePermit2', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      tokenAddress,
      refId
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!tokenAddress) {
      return res.status(400).json({
        error: 'tokenAddress is required'
      });
    }

    const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'; // Permit2 contract address

    console.log('=== Circle SDK Permit2 Approval Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Token Address:', tokenAddress);
    console.log('Permit2 Address:', permit2Address);
    console.log('Wallet ID:', walletId);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('NOTE: Permit2 approvals do not require token ownership');
    console.log('============================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for ERC20 approve
    const abiFunctionSignature = "approve(address,uint256)";

    // Use max uint256 for unlimited approval (common pattern)
    const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    
    // Prepare the ABI parameters array for approve function
    const abiParameters = [
      permit2Address, // address spender (Permit2 contract)
      maxUint256 // uint256 amount (max approval)
    ];

    console.log('=== Permit2 Approval Function Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Parameters:');
    console.log('- spender (Permit2):', abiParameters[0]);
    console.log('- amount (max uint256):', abiParameters[1]);
    console.log('=============================================');

    // Create the contract execution transaction
    const response = await circleClient.createContractExecutionTransaction({
      walletId: walletId,
      contractAddress: tokenAddress,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      fee: {
        config: {
          feeLevel: 'MEDIUM' as const
        },
        type: 'level' as const
      },
      ...(refId && { refId })
    });

    console.log('✅ Permit2 Approval Transaction Created Successfully');
    console.log('Transaction ID:', response.data?.id);
    console.log('Transaction State:', response.data?.state);

    // Return the response
    res.json({
      ...response.data,
      method: 'Circle SDK Permit2 Approval',
      tokenAddress,
      permit2Address,
      approvedAmount: 'unlimited'
    });

  } catch (error: any) {
    console.error('❌ Permit2 Approval Error:', error);

    // Handle specific Circle SDK errors
    if (error.response) {
      console.error('Circle SDK Error Response:', error.response.data);
      
      // Log detailed error information for asset amount issues
      const errorMessage = error.response.data?.message || error.response.data?.error || '';
      if (errorMessage.toLowerCase().includes('asset') || 
          errorMessage.toLowerCase().includes('insufficient') || 
          errorMessage.toLowerCase().includes('balance')) {
        console.error('🔍 ASSET AMOUNT ERROR DETAILS:');
        console.error('- Error Message:', errorMessage);
        console.error('- Full Error Data:', JSON.stringify(error.response.data, null, 2));
        console.error('- This error occurs during permit2 approval which should not require token ownership');
        console.error('- Consider checking Circle SDK configuration or token contract implementation');
      }
      
      return res.status(error.response.status || 500).json({
        error: errorMessage || 'Circle SDK request failed',
        details: error.response.data,
        method: 'Circle SDK Permit2 Approval'
      });
    }

    res.status(500).json({
      error: error.message || 'An unknown error occurred during Permit2 approval',
      method: 'Circle SDK Permit2 Approval'
    });
  }
});

// POST /api/web3/approvePermit2 - Approve Permit2 contract to spend tokens using Web3js/ethers
app.post('/api/web3/approvePermit2', async (req, res) => {
  try {
    const {
      privateKey,
      tokenAddress,
      rpcUrl,
      gasLimit,
      gasPrice
    } = req.body;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required for ethers wallet approval'
      });
    }

    if (!tokenAddress) {
      return res.status(400).json({
        error: 'tokenAddress is required'
      });
    }

    const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3'; // Permit2 contract address

    console.log('=== Ethers Wallet Permit2 Approval Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Token Address:', tokenAddress);
    console.log('Permit2 Address:', permit2Address);
    console.log('===============================================');

    // Use provided RPC URL or default to Sepolia
    const rpcEndpoint = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    
    // Initialize Web3
    const web3 = new Web3(rpcEndpoint);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // ERC20 ABI for approve function
    const ERC20_ABI = [
      {
        "inputs": [
          {"internalType": "address", "name": "spender", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Create token contract instance
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
    
    // Use max uint256 for unlimited approval (common pattern)
    // Note: Permit2 approvals don't require owning tokens - just setting allowance
    const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

    console.log('=== Permit2 Approval Transaction Parameters ===');
    console.log('From Address:', account.address);
    console.log('Token Contract:', tokenAddress);
    console.log('Spender (Permit2):', permit2Address);
    console.log('Amount (max uint256):', maxUint256);
    console.log('================================================');

    // Check if the token contract exists and is valid
    try {
      const tokenCode = await web3.eth.getCode(tokenAddress);
      if (tokenCode === '0x') {
        return res.status(400).json({
          error: 'Invalid token address - no contract found at this address',
          tokenAddress: tokenAddress
        });
      }
      console.log('✅ Token contract verified at address:', tokenAddress);
    } catch (error) {
      console.error('Failed to verify token contract:', error);
      return res.status(400).json({
        error: 'Failed to verify token contract',
        details: error
      });
    }

    // Check account balance
    try {
      const balance = await web3.eth.getBalance(account.address);
      console.log('Account ETH Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
      
      if (balance === 0n || balance.toString() === '0') {
        console.warn('⚠️  Account has 0 ETH balance - transaction may fail');
      }
    } catch (error) {
      console.warn('Could not check account balance:', error);
    }

    // Check current allowance
    try {
      const currentAllowance = await tokenContract.methods.allowance(account.address, permit2Address).call();
      console.log('Current Permit2 Allowance:', currentAllowance);
      
      if (currentAllowance && currentAllowance.toString() !== '0') {
        console.log('ℹ️  Token already has some allowance for Permit2. Proceeding with max approval.');
      }
    } catch (error) {
      console.warn('Could not check current allowance (contract may not be ERC20):', error);
    }

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await tokenContract.methods.approve(permit2Address, maxUint256)
          .estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        
        // Enhanced error reporting
        let errorDetails = {
          message: gasError.message,
          code: gasError.code,
          reason: gasError.reason || 'Unknown',
          data: gasError.data
        };
        
        // Common error scenarios
        if (gasError.message.includes('insufficient funds')) {
          errorDetails.reason = 'Insufficient ETH balance for gas fees';
        } else if (gasError.message.includes('execution reverted')) {
          errorDetails.reason = 'Smart contract execution reverted - check token contract validity';
        } else if (gasError.message.includes('invalid address')) {
          errorDetails.reason = 'Invalid token or spender address';
        }
        
        return res.status(400).json({
          error: 'Failed to estimate gas for approval transaction',
          details: errorDetails,
          suggestions: [
            'Verify the token contract address is correct',
            'Ensure account has sufficient ETH for gas fees',
            'Check if token is a valid ERC20 contract',
            'Try with a different RPC endpoint'
          ]
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the approval transaction
    const txData = tokenContract.methods.approve(permit2Address, maxUint256);

    const tx = {
      from: account.address,
      to: tokenAddress,
      data: txData.encodeABI(),
      gas: estimatedGas,
      gasPrice: txGasPrice
    };

    console.log('🚀 Sending approval transaction...');
    const receipt = await web3.eth.sendTransaction(tx);
    
    console.log('✅ Permit2 Approval Transaction Successful!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed);

    // Return the response (convert BigInt values to strings for JSON serialization)
    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      tokenAddress,
      permit2Address,
      approvedAmount: 'unlimited',
      method: 'Web3js Permit2 Approval'
    });

  } catch (error: any) {
    console.error('❌ Web3.js Permit2 Approval Error:', error);

    // Log detailed error information for asset amount issues
    if (error.message && (
        error.message.toLowerCase().includes('asset') || 
        error.message.toLowerCase().includes('insufficient') || 
        error.message.toLowerCase().includes('balance'))) {
      console.error('🔍 ASSET AMOUNT ERROR DETAILS:');
      console.error('- Error Message:', error.message);
      console.error('- Error Details:', error.toString());
      console.error('- This error occurs during permit2 approval which should not require token ownership');
      console.error('- Consider checking token contract implementation or RPC provider');
    }

    res.status(500).json({
      error: error.message || 'An unknown error occurred during Permit2 approval',
      method: 'Web3js Permit2 Approval',
      details: error.toString()
    });
  }
});

// POST /api/takerDeliver - Execute takerDeliver function on FxEscrow contract using Circle SDK
app.post('/api/takerDeliver', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      tradeId,
      permit,
      signature
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (tradeId === undefined || tradeId === null) {
      return res.status(400).json({
        error: 'tradeId is required'
      });
    }

    // Validate tradeId is a positive integer
    const tradeIdNumber = parseInt(tradeId);
    if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
      return res.status(400).json({
        error: 'tradeId must be a valid non-negative integer'
      });
    }

    // Validate permit structure
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!permit.permitted.token || !permit.permitted.amount) {
      return res.status(400).json({
        error: 'permit.permitted must include token and amount fields'
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Circle SDK TakerDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('======================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for takerDeliver with PermitTransferFrom (4 fields)
    const abiFunctionSignature = "takerDeliver(uint256,((address,uint256),uint256,uint256),bytes)";

    // Convert values to strings for Circle SDK (it expects string representation of large numbers)
    const ensureString = (value: any) => {
      if (typeof value === 'string') {
        return value;
      }
      return String(value);
    };

    // Prepare the ABI parameters array with PermitTransferFrom struct (without witness)
    const abiParameters = [
      tradeIdNumber, // uint256 tradeId
      [ // PermitTransferFrom struct (4 fields only)
        [ // TokenPermissions (permitted)
          permit.permitted.token, // address token
          permit.permitted.amount // uint256 amount
        ],
        permit.nonce, // uint256 nonce
        permit.deadline // uint256 deadline (no witness in contract ABI)
      ],
      signature // bytes signature
    ];

    console.log('=== TakerDeliver Function Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Parameter Types:');
    console.log('- tradeId:', typeof abiParameters[0], '(value:', abiParameters[0], ')');
    console.log('- permit.permitted.token:', typeof abiParameters[1][0][0], '(value:', abiParameters[1][0][0], ')');
    console.log('- permit.permitted.amount:', typeof abiParameters[1][0][1], '(value:', abiParameters[1][0][1], ')');
    console.log('- permit.spender:', typeof abiParameters[1][1], '(value:', abiParameters[1][1], ')');
    console.log('- permit.nonce:', typeof abiParameters[1][2], '(value:', abiParameters[1][2], ')');
    console.log('- permit.deadline:', typeof abiParameters[1][3], '(value:', abiParameters[1][3], ')');
    console.log('- signature:', typeof abiParameters[2], '(length:', abiParameters[2].length, ')');
    console.log('Full Parameters:', JSON.stringify(abiParameters, null, 2));
    console.log('Note: Frontend signs PermitWitnessTransferFrom but contract expects PermitTransferFrom');
    console.log('=======================================');

    // Create the contract execution request
    const contractExecutionRequest = {
      contractAddress: "0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1",
      walletId: walletId,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      fee: {
        config: {
          feeLevel: 'MEDIUM' as const
        },
        type: 'level' as const
      },
      ...(refId && { refId: refId }) // Only include refId if provided
    };

    console.log('=== Final TakerDeliver Contract Execution Request ===');
    console.log('Request payload:', JSON.stringify(contractExecutionRequest, null, 2));
    console.log('RefId included:', !!refId);
    console.log('===================================================');
    
    console.log('Executing takerDeliver function via Circle SDK...');

    // Execute the contract function using Circle SDK
    const response = await circleClient.createContractExecutionTransaction(contractExecutionRequest);

    console.log('=== Circle SDK TakerDeliver Response ===');
    console.log('Response Status:', response.status || 'Unknown');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('=======================================');

    // Return the Circle SDK response
    res.json(response.data);

  } catch (error: any) {
    console.error('Circle SDK TakerDeliver Function Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error occurred while executing takerDeliver function';
    let errorDetails = null;

    if (error.response) {
      // Circle API error
      statusCode = error.response.status;
      errorDetails = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key and entity secret.';
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request data. Please check your parameters.';
      } else if (error.response.status === 404) {
        errorMessage = 'Wallet not found. Please verify the wallet ID is correct.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions and entity secret.';
      } else {
        errorMessage = error.response.data?.message || `Circle API error: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Circle API. Please check your internet connection.';
    } else if (error.message.includes('API key')) {
      statusCode = 401;
      errorMessage = 'Invalid API key format or missing authentication credentials.';
    } else if (error.message.includes('entity secret')) {
      statusCode = 401;
      errorMessage = 'Invalid entity secret. Please check your entity secret configuration.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during takerDeliver function execution';
      errorDetails = error.stack;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      method: 'Circle SDK createContractExecution - takerDeliver'
    });
  }
});

// GET /api/wallet/info - Get wallet address and balance
app.get('/api/wallet/info/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { walletApiKey, entitySecret } = req.query;

    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'walletApiKey and entitySecret are required as query parameters'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    console.log('=== Wallet Info Request ===');
    console.log('Wallet ID:', walletId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('==========================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey as string,
      entitySecret: entitySecret as string
    });

    // Get wallet details
    const walletResponse = await circleClient.getWallet({ id: walletId });
    
    console.log('=== Wallet Details ===');
    console.log('Response:', JSON.stringify(walletResponse.data, null, 2));
    console.log('=====================');

    res.json({
      success: true,
      wallet: walletResponse.data,
      fundingInstructions: {
        network: 'Check the wallet address and send ETH to it',
        testnetFaucets: [
          'https://sepoliafaucet.com/',
          'https://faucet.quicknode.com/ethereum/sepolia',
          'https://www.alchemy.com/faucets/ethereum-sepolia'
        ],
        minimumRequired: '0.001 ETH (approximately) for gas fees'
      }
    });

  } catch (error: any) {
    console.error('Wallet Info Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to get wallet information';
    let errorDetails = null;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      errorDetails = error.response.data;
    } else {
      errorMessage = error.message || errorMessage;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      originalError: error.message
    });
  }
});

// GET /api/wallet/balance - Check wallet ETH and token balances
app.get('/api/wallet/balance/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { walletApiKey, entitySecret, tokenAddress } = req.query;

    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'walletApiKey and entitySecret are required as query parameters'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    console.log('=== Wallet Balance Check ===');
    console.log('Wallet ID:', walletId);
    console.log('Token Address:', tokenAddress || 'ETH only');
    console.log('Timestamp:', new Date().toISOString());
    console.log('============================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey as string,
      entitySecret: entitySecret as string
    });

    // Get wallet details to get the address
    const walletResponse = await circleClient.getWallet({ id: walletId });
    const walletAddress = (walletResponse.data as any)?.address;

    if (!walletAddress) {
      return res.status(404).json({
        error: 'Wallet address not found'
      });
    }

    console.log('Wallet Address:', walletAddress);

    // Initialize Web3 for balance checking
    const web3 = new Web3(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');

    // Check ETH balance
    const ethBalance = await web3.eth.getBalance(walletAddress);
    const ethBalanceEther = web3.utils.fromWei(ethBalance, 'ether');

    const result: any = {
      success: true,
      walletId,
      walletAddress,
      ethBalance: {
        wei: ethBalance.toString(),
        ether: ethBalanceEther,
        formatted: `${parseFloat(ethBalanceEther).toFixed(6)} ETH`
      },
      hasSufficientGas: parseFloat(ethBalanceEther) > 0.001 // Minimum for gas fees
    };

    // If token address is provided, check token balance
    if (tokenAddress) {
      try {
        // ERC20 ABI for balanceOf function
        const erc20Abi = [
          {
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function"
          }
        ];

        const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress as string);
        
        // Get token balance, decimals, and symbol
        const [tokenBalance, decimals, symbol] = await Promise.all([
          tokenContract.methods.balanceOf(walletAddress).call(),
          tokenContract.methods.decimals().call().catch(() => 18), // Default to 18 if not available
          tokenContract.methods.symbol().call().catch(() => 'TOKEN') // Default symbol
        ]);

        const tokenBalanceFormatted = (Number(tokenBalance) / Math.pow(10, Number(decimals))).toFixed(6);

        result.tokenBalance = {
          raw: tokenBalance ? tokenBalance.toString() : '0',
          formatted: `${tokenBalanceFormatted} ${symbol ? symbol.toString() : 'TOKEN'}`,
          decimals: Number(decimals),
          symbol: symbol ? symbol.toString() : 'TOKEN',
          hasBalance: tokenBalance ? Number(tokenBalance) > 0 : false
        };

        console.log(`Token Balance (${symbol}):`, tokenBalanceFormatted);
      } catch (tokenError) {
        console.warn('Failed to get token balance:', tokenError);
        result.tokenBalance = {
          error: 'Failed to get token balance',
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
        };
      }
    }

    console.log('ETH Balance:', ethBalanceEther, 'ETH');
    console.log('Has sufficient gas:', result.hasSufficientGas);

    res.json(result);

  } catch (error: any) {
    console.error('Balance Check Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to check wallet balance';
    let errorDetails = null;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      errorDetails = error.response.data;
    } else {
      errorMessage = error.message || errorMessage;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      originalError: error.message
    });
  }
});

// POST /api/wallet/balance/web3 - Check Web3.js wallet ETH and token balances using private key
app.post('/api/wallet/balance/web3', async (req, res) => {
  try {
    const { privateKey, tokenAddress } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required in the request body'
      });
    }

    console.log('=== Web3.js Wallet Balance Check ===');
    console.log('Token Address:', tokenAddress || 'ETH only');
    console.log('Timestamp:', new Date().toISOString());
    console.log('=====================================');

    // Initialize Web3 for balance checking
    const web3 = new Web3(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');

    // Create account from private key to get the address
    let walletAddress: string;
    try {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      walletAddress = account.address;
    } catch (keyError) {
      return res.status(400).json({
        error: 'Invalid private key format',
        details: 'Private key must be a valid 64-character hex string (with or without 0x prefix)'
      });
    }

    console.log('Wallet Address:', walletAddress);

    // Check ETH balance
    const ethBalance = await web3.eth.getBalance(walletAddress);
    const ethBalanceEther = web3.utils.fromWei(ethBalance, 'ether');

    const result: any = {
      success: true,
      walletAddress,
      ethBalance: {
        wei: ethBalance.toString(),
        ether: ethBalanceEther,
        formatted: `${parseFloat(ethBalanceEther).toFixed(6)} ETH`
      },
      hasSufficientGas: parseFloat(ethBalanceEther) > 0.001 // Minimum for gas fees
    };

    // If token address is provided, check token balance
    if (tokenAddress) {
      try {
        // ERC20 ABI for balanceOf function
        const erc20Abi = [
          {
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{"name": "", "type": "string"}],
            "type": "function"
          }
        ];

        const tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
        
        // Get token balance, decimals, and symbol
        const [tokenBalance, decimals, symbol] = await Promise.all([
          tokenContract.methods.balanceOf(walletAddress).call(),
          tokenContract.methods.decimals().call().catch(() => 18), // Default to 18 if not available
          tokenContract.methods.symbol().call().catch(() => 'TOKEN') // Default symbol
        ]);

        const tokenBalanceFormatted = (Number(tokenBalance) / Math.pow(10, Number(decimals))).toFixed(6);

        result.tokenBalance = {
          raw: tokenBalance ? tokenBalance.toString() : '0',
          formatted: `${tokenBalanceFormatted} ${symbol ? symbol.toString() : 'TOKEN'}`,
          decimals: Number(decimals),
          symbol: symbol ? symbol.toString() : 'TOKEN',
          hasBalance: tokenBalance ? Number(tokenBalance) > 0 : false
        };

        console.log(`Token Balance (${symbol}):`, tokenBalanceFormatted);
      } catch (tokenError) {
        console.warn('Failed to get token balance:', tokenError);
        result.tokenBalance = {
          error: 'Failed to get token balance',
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
        };
      }
    }

    console.log('ETH Balance:', ethBalanceEther, 'ETH');
    console.log('Has sufficient gas:', result.hasSufficientGas);

    res.json(result);

  } catch (error: any) {
    console.error('Web3.js Balance Check Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to check Web3.js wallet balance';
    let errorDetails = null;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      errorDetails = error.response.data;
    } else {
      errorMessage = error.message || errorMessage;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      originalError: error.message
    });
  }
});

app.post('/api/generateTestData', async (req, res) => {
  try {
    console.log('🧪 Generating test wallets and mock data...');

    // Initialize Web3 (no need for actual connection for wallet generation)
    const web3 = new Web3();
    
    // Generate two random wallets
    const takerWallet = web3.eth.accounts.create();
    const makerWallet = web3.eth.accounts.create();
    
    console.log('📱 Generated wallets:');
    console.log('  Taker:', takerWallet.address);
    console.log('  Maker:', makerWallet.address);

    // EIP-712 Domain (based on index.js)
    const EIP712_DOMAIN = {
      name: 'FxEscrow',
      version: '1',
      chainId: 11155111, // Sepolia
              verifyingContract: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8' // FxEscrow proxy address
    };

    // EIP-712 Types (based on index.js)
    const EIP712_TAKER_TYPES = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Consideration: [
        { name: 'quoteId', type: 'bytes32' },
        { name: 'base', type: 'address' },
        { name: 'quote', type: 'address' },
        { name: 'baseAmount', type: 'uint256' },
        { name: 'quoteAmount', type: 'uint256' },
        { name: 'maturity', type: 'uint256' }
      ],
      TakerDetails: [
        { name: 'consideration', type: 'Consideration' },
        { name: 'recipient', type: 'address' },
        { name: 'fee', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const EIP712_MAKER_TYPES = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Consideration: [
        { name: 'quoteId', type: 'bytes32' },
        { name: 'base', type: 'address' },
        { name: 'quote', type: 'address' },
        { name: 'baseAmount', type: 'uint256' },
        { name: 'quoteAmount', type: 'uint256' },
        { name: 'maturity', type: 'uint256' }
      ],
      MakerDetails: [
        { name: 'consideration', type: 'Consideration' },
        { name: 'fee', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    // Generate mock trade data (based on index.js sample data)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const consideration = {
      quoteId: '0x00000000000000000000000000000000da28cf847f6b4fff9f0b054e644b6250',
      base: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4', // EURC on Sepolia
      quote: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC on Sepolia
      baseAmount: 1370080000, // 1370.08 EURC (6 decimals)
      quoteAmount: 1500300000, // 1500.30 USDC (6 decimals)
      maturity: (currentTimestamp + 86400 * 30) // 30 days from now
    };

    const takerDetails = {
      consideration: consideration,
      recipient: takerWallet.address,
      fee: 300000, // 0.3 EURC fee
      nonce: Math.floor(Math.random() * 1000000),
      deadline: (currentTimestamp + 3600) // 1 hour from now
    };

    const makerDetails = {
      consideration: consideration,
      fee: 137008, // 0.137008 USDC fee  
      nonce: Math.floor(Math.random() * 1000000),
      deadline: (currentTimestamp + 3600) // 1 hour from now
    };

    console.log('📝 Generated mock trade data');
    
    // Create ethers wallets for signing
    const takerEthersWallet = new ethers.Wallet(takerWallet.privateKey);
    const makerEthersWallet = new ethers.Wallet(makerWallet.privateKey);

    // Sign taker details
    console.log('✍️  Signing taker details...');
    // Remove EIP712Domain for ethers.js (it handles domain automatically)
    const { EIP712Domain: takerDomain, ...takerTypesForSigning } = EIP712_TAKER_TYPES;
    const takerSignature = await takerEthersWallet.signTypedData(
      EIP712_DOMAIN,
      takerTypesForSigning,
      takerDetails
    );

    // Sign maker details  
    console.log('✍️  Signing maker details...');
    // Remove EIP712Domain for ethers.js (it handles domain automatically)
    const { EIP712Domain: makerDomain, ...makerTypesForSigning } = EIP712_MAKER_TYPES;
    const makerSignature = await makerEthersWallet.signTypedData(
      EIP712_DOMAIN,
      makerTypesForSigning,
      makerDetails
    );

    console.log('✅ Test data generation complete!');

    // Return all the data needed to prefill the form
    const testData = {
      // Wallet info
      wallets: {
        taker: {
          address: takerWallet.address,
          privateKey: takerWallet.privateKey
        },
        maker: {
          address: makerWallet.address,
          privateKey: makerWallet.privateKey
        }
      },
      
      // Form data structure matching ContractExecutionForm
      formData: {
        contractAddress: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8', // FxEscrow proxy contract
        walletId: '', // Will be filled from user settings
        taker: takerWallet.address,
        maker: makerWallet.address,
        consideration: {
          quoteId: consideration.quoteId,
          base: consideration.base,
          quote: consideration.quote,
          baseAmount: consideration.baseAmount,
          quoteAmount: consideration.quoteAmount,
          maturity: consideration.maturity
        },
        takerRecipient: takerDetails.recipient,
        takerFee: takerDetails.fee.toString(),
        takerNonce: takerDetails.nonce.toString(),
        takerDeadline: takerDetails.deadline,
        takerSignature: takerSignature,
        makerFee: makerDetails.fee.toString(),
        makerNonce: makerDetails.nonce.toString(), 
        makerDeadline: makerDetails.deadline,
        makerSignature: makerSignature
      },

      // Additional info for display
      metadata: {
        timestamp: new Date().toISOString(),
        chainId: EIP712_DOMAIN.chainId,
        domain: EIP712_DOMAIN,
        takerDetails,
        makerDetails
      }
    };

    res.json({
      success: true,
      message: 'Test data generated successfully',
      data: testData
    });

  } catch (error: any) {
    console.error('❌ Error generating test data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST /api/makerDeliver - Execute makerDeliver function on FxEscrow contract using Circle SDK
app.post('/api/makerDeliver', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      tradeId,
      permit,
      signature
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    // Validate trade data
    if (tradeId === undefined || tradeId === null) {
      return res.status(400).json({
        error: 'tradeId is required'
      });
    }

    // Validate tradeId is a positive integer
    const tradeIdNumber = parseInt(tradeId);
    if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
      return res.status(400).json({
        error: 'tradeId must be a valid non-negative integer'
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Circle SDK MakerDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('======================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for makerDeliver with PermitTransferFrom (same as takerDeliver)
    const abiFunctionSignature = "makerDeliver(uint256,((address,uint256),uint256,uint256),bytes)";

    // Convert values to strings for Circle SDK (it expects string representation of large numbers)
    const ensureString = (value: any) => {
      if (typeof value === 'string') {
        return value;
      }
      return String(value);
    };

    // Prepare the ABI parameters array with PermitTransferFrom struct (same as takerDeliver)
    const abiParameters = [
      tradeIdNumber, // uint256 tradeId
      [ // PermitTransferFrom struct
        [ // TokenPermissions (permitted)
          permit.permitted.token, // address token
          permit.permitted.amount // uint256 amount
        ],
        ensureString(permit.nonce), // uint256 nonce
        ensureString(permit.deadline) // uint256 deadline
      ],
      signature // bytes signature
    ];

    const contractExecutionRequest = {
      contractAddress: "0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1",
      walletId: walletId,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      fee: {
        config: {
          feeLevel: 'MEDIUM' as const
        },
        type: 'level' as const
      },
      ...(refId && { refId: refId }) // Only include refId if provided
    };

    // Execute the makerDeliver function
    const response = await circleClient.createContractExecutionTransaction(contractExecutionRequest);

    console.log('=== Circle SDK MakerDeliver Response ===');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('========================================');

    res.json(response.data);
  } catch (error: any) {
    console.error('=== Circle SDK MakerDeliver Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('====================================');

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// FxEscrow Contract ABI (extracted from full ABI)
const FXESCROW_ABI = [
  {
    "type": "function",
    "name": "takerDeliver",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "permit",
        "type": "tuple",
        "internalType": "struct IPermit2.PermitTransferFrom",
        "components": [
          {
            "name": "permitted",
            "type": "tuple",
            "internalType": "struct IPermit2.TokenPermissions",
            "components": [
              {
                "name": "token",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "makerDeliver",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "permit",
        "type": "tuple",
        "internalType": "struct IPermit2.PermitTransferFrom",
        "components": [
          {
            "name": "permitted",
            "type": "tuple",
            "internalType": "struct IPermit2.TokenPermissions",
            "components": [
              {
                "name": "token",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "takerBatchDeliver",
    "inputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "permit",
        "type": "tuple",
        "internalType": "struct IPermit2.PermitBatchTransferFrom",
        "components": [
          {
            "name": "permitted",
            "type": "tuple[]",
            "internalType": "struct IPermit2.TokenPermissions[]",
            "components": [
              {
                "name": "token",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "makerBatchDeliver",
    "inputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "permit",
        "type": "tuple",
        "internalType": "struct IPermit2.PermitBatchTransferFrom",
        "components": [
          {
            "name": "permitted",
            "type": "tuple[]",
            "internalType": "struct IPermit2.TokenPermissions[]",
            "components": [
              {
                "name": "token",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "nonce",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];

// POST /api/web3/takerDeliver - Execute takerDeliver function using Web3js
app.post('/api/web3/takerDeliver', async (req, res) => {
  try {
    const {
      privateKey,
      contractAddress,
      rpcUrl,
      tradeId,
      permit,
      signature,
      gasLimit,
      gasPrice
    } = req.body;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required for Web3js transaction'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (tradeId === undefined || tradeId === null) {
      return res.status(400).json({
        error: 'tradeId is required'
      });
    }

    // Validate tradeId is a positive integer
    const tradeIdNumber = parseInt(tradeId);
    if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
      return res.status(400).json({
        error: 'tradeId must be a valid non-negative integer'
      });
    }

    // Validate permit structure
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!permit.permitted.token || !permit.permitted.amount) {
      return res.status(400).json({
        error: 'permit.permitted must include token and amount fields'
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Web3js TakerDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Contract Address:', contractAddress);
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('=====================================');

    // Use provided RPC URL or default to Sepolia
    const rpcEndpoint = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    
    // Initialize Web3
    const web3 = new Web3(rpcEndpoint);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Create contract instance
    const contract = new web3.eth.Contract(FXESCROW_ABI, contractAddress);
    
    // Prepare function call data
    const permitStruct = [
      [permit.permitted.token, permit.permitted.amount.toString()], // TokenPermissions
      permit.nonce.toString(),
      permit.deadline.toString()
    ];

    console.log('=== Web3js Transaction Parameters ===');
    console.log('From Address:', account.address);
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit Struct:', permitStruct);
    console.log('Signature:', signature);
    console.log('=====================================');

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await contract.methods.takerDeliver(
          tradeIdNumber,
          permitStruct,
          signature
        ).estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        return res.status(400).json({
          error: 'Failed to estimate gas for transaction',
          details: gasError.message
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the transaction
    const txData = contract.methods.takerDeliver(
      tradeIdNumber,
      permitStruct,
      signature
    );

    const tx = {
      from: account.address,
      to: contractAddress,
      data: txData.encodeABI(),
      gas: estimatedGas,
      gasPrice: txGasPrice
    };

    console.log('=== Sending Transaction ===');
    console.log('Transaction:', tx);

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

    console.log('✅ Transaction successful!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed);

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      to: contractAddress,
      method: 'takerDeliver',
      parameters: {
        tradeId: tradeIdNumber,
        permit: permit,
        signature: signature
      },
      receipt: receipt
    });

  } catch (err: any) {
    console.error('❌ Web3js TakerDeliver Error:', err);
    
    let errorMessage = 'Transaction failed';
    if (err.message) {
      errorMessage = err.message;
    }
    
    // Handle common Web3 errors
    if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Transaction reverted - check contract conditions';
    } else if (err.message?.includes('nonce too low')) {
      errorMessage = 'Transaction nonce too low - transaction may have already been processed';
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      method: 'web3.takerDeliver'
    });
  }
});

// POST /api/web3/makerDeliver - Execute makerDeliver function using Web3js
app.post('/api/web3/makerDeliver', async (req, res) => {
  try {
    const {
      privateKey,
      contractAddress,
      rpcUrl,
      tradeId,
      permit,
      signature,
      gasLimit,
      gasPrice
    } = req.body;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required for Web3js transaction'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (tradeId === undefined || tradeId === null) {
      return res.status(400).json({
        error: 'tradeId is required'
      });
    }

    // Validate tradeId is a positive integer
    const tradeIdNumber = parseInt(tradeId);
    if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
      return res.status(400).json({
        error: 'tradeId must be a valid non-negative integer'
      });
    }

    // Validate permit structure (required for makerDeliver too based on ABI)
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!permit.permitted.token || !permit.permitted.amount) {
      return res.status(400).json({
        error: 'permit.permitted must include token and amount fields'
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Web3js MakerDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Contract Address:', contractAddress);
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('====================================');

    // Use provided RPC URL or default to Sepolia
    const rpcEndpoint = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    
    // Initialize Web3
    const web3 = new Web3(rpcEndpoint);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Create contract instance
    const contract = new web3.eth.Contract(FXESCROW_ABI, contractAddress);
    
    // Prepare function call data
    const permitStruct = [
      [permit.permitted.token, permit.permitted.amount.toString()], // TokenPermissions
      permit.nonce.toString(),
      permit.deadline.toString()
    ];

    console.log('=== Web3js Transaction Parameters ===');
    console.log('From Address:', account.address);
    console.log('Trade ID:', tradeIdNumber);
    console.log('Permit Struct:', permitStruct);
    console.log('Signature:', signature);
    console.log('=====================================');

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await contract.methods.makerDeliver(
          tradeIdNumber,
          permitStruct,
          signature
        ).estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        return res.status(400).json({
          error: 'Failed to estimate gas for transaction',
          details: gasError.message
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the transaction
    const txData = contract.methods.makerDeliver(
      tradeIdNumber,
      permitStruct,
      signature
    );

    const tx = {
      from: account.address,
      to: contractAddress,
      data: txData.encodeABI(),
      gas: estimatedGas,
      gasPrice: txGasPrice
    };

    console.log('=== Sending Transaction ===');
    console.log('Transaction:', tx);

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

    console.log('✅ Transaction successful!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed);

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      to: contractAddress,
      method: 'makerDeliver',
      parameters: {
        tradeId: tradeIdNumber,
        permit: permit,
        signature: signature
      },
      receipt: receipt
    });

  } catch (err: any) {
    console.error('❌ Web3js MakerDeliver Error:', err);
    
    let errorMessage = 'Transaction failed';
    if (err.message) {
      errorMessage = err.message;
    }
    
    // Handle common Web3 errors
    if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Transaction reverted - check contract conditions';
    } else if (err.message?.includes('nonce too low')) {
      errorMessage = 'Transaction nonce too low - transaction may have already been processed';
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      method: 'web3.makerDeliver'
    });
  }
});

// POST /api/takerBatchDeliver - Execute takerBatchDeliver function on FxEscrow contract using Circle SDK
app.post('/api/takerBatchDeliver', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      tradeIds,
      permit,
      signature
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds array is required and must not be empty'
      });
    }

    // Validate each trade ID
    const tradeIdNumbers = tradeIds.map((id, index) => {
      const tradeIdNumber = parseInt(id);
      if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
        throw new Error(`tradeIds[${index}] must be a valid non-negative integer`);
      }
      return tradeIdNumber;
    });

    // Validate batch permit structure
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!Array.isArray(permit.permitted) || permit.permitted.length === 0) {
      return res.status(400).json({
        error: 'permit.permitted must be an array of TokenPermissions for batch operations'
      });
    }

    // Validate each TokenPermissions in the batch
    permit.permitted.forEach((tokenPermission: any, index: number) => {
      if (!tokenPermission.token || !tokenPermission.amount) {
        throw new Error(`permit.permitted[${index}] must include token and amount fields`);
      }
    });

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Circle SDK TakerBatchDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('===========================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for takerBatchDeliver
    const abiFunctionSignature = "takerBatchDeliver(uint256[],((address,uint256)[],uint256,uint256),bytes)";

    // Prepare the ABI parameters array with PermitBatchTransferFrom struct
    const abiParameters = [
      tradeIdNumbers, // uint256[] ids
      [ // PermitBatchTransferFrom struct
        permit.permitted.map((p: any) => [p.token, p.amount]), // TokenPermissions[] permitted
        permit.nonce, // uint256 nonce
        permit.deadline // uint256 deadline
      ],
      signature // bytes signature
    ];

    console.log('=== TakerBatchDeliver Function Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permitted Tokens:', permit.permitted);
    console.log('Nonce:', permit.nonce);
    console.log('Deadline:', permit.deadline);
    console.log('Signature:', signature);
    console.log('============================================');

    // Execute the contract function using Circle SDK
    const result = await circleClient.createContractExecutionTransaction({
      walletId: walletId,
      contractAddress: contractAddress,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      refId: refId,
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM'
        }
      }
    });

    console.log('✅ TakerBatchDeliver transaction created successfully!');
    console.log('Transaction ID:', result.data?.id);
    console.log('Transaction State:', result.data?.state);

    res.json(result.data);

  } catch (err: any) {
    console.error('❌ Circle SDK TakerBatchDeliver Error:', err);
    
    let errorMessage = 'TakerBatchDeliver transaction failed';
    if (err.response) {
      console.error('Server response:', err.response.data);
      errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: err.response?.data || err.message,
      method: 'circle.takerBatchDeliver'
    });
  }
});

// POST /api/makerBatchDeliver - Execute makerBatchDeliver function on FxEscrow contract using Circle SDK
app.post('/api/makerBatchDeliver', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      refId,
      tradeIds,
      permit,
      signature
    } = req.body;

    // Validate required Circle SDK fields
    if (!walletApiKey || !entitySecret) {
      return res.status(400).json({
        error: 'Both walletApiKey and entitySecret are required for Circle SDK'
      });
    }

    if (!walletId) {
      return res.status(400).json({
        error: 'walletId is required'
      });
    }

    // Validate trade data
    if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds array is required and must not be empty'
      });
    }

    // Validate each trade ID
    const tradeIdNumbers = tradeIds.map((id, index) => {
      const tradeIdNumber = parseInt(id);
      if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
        throw new Error(`tradeIds[${index}] must be a valid non-negative integer`);
      }
      return tradeIdNumber;
    });

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Circle SDK MakerBatchDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Reference ID:', refId || 'Not provided');
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('===========================================');

    // Initialize the Circle SDK client
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for takerBatchDeliver
    const abiFunctionSignature = "makerBatchDeliver(uint256[],((address,uint256)[],uint256,uint256),bytes)";

    // Prepare the ABI parameters array with PermitBatchTransferFrom struct
    const abiParameters = [
      tradeIdNumbers, // uint256[] ids
      [ // PermitBatchTransferFrom struct
        permit.permitted.map((p: any) => [p.token, p.amount]), // TokenPermissions[] permitted
        permit.nonce, // uint256 nonce
        permit.deadline // uint256 deadline
      ],
      signature // bytes signature
    ];

    console.log('=== MakerBatchDeliver Function Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permitted Tokens:', permit.permitted);
    console.log('Nonce:', permit.nonce);
    console.log('Deadline:', permit.deadline);
    console.log('Signature:', signature);
    console.log('============================================');

    // Execute the contract function using Circle SDK
    const result = await circleClient.createContractExecutionTransaction({
      walletId: walletId,
      contractAddress: contractAddress,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      refId: refId,
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM'
        }
      }
    });

    console.log('✅ MakerBatchDeliver transaction created successfully!');
    console.log('Transaction ID:', result.data?.id);
    console.log('Transaction State:', result.data?.state);

    res.json(result.data);

  } catch (err: any) {
    console.error('❌ Circle SDK MakerBatchDeliver Error:', err);
    
    let errorMessage = 'MakerBatchDeliver transaction failed';
    if (err.response) {
      console.error('Server response:', err.response.data);
      errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: err.response?.data || err.message,
      method: 'circle.makerBatchDeliver'
    });
  }
});

// POST /api/web3/takerBatchDeliver - Execute takerBatchDeliver function using Web3js
app.post('/api/web3/takerBatchDeliver', async (req, res) => {
  try {
    const {
      privateKey,
      contractAddress,
      rpcUrl,
      tradeIds,
      permit,
      signature,
      gasLimit,
      gasPrice
    } = req.body;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required for Web3js transaction'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds array is required and must not be empty'
      });
    }

    // Validate each trade ID
    const tradeIdNumbers = tradeIds.map((id, index) => {
      const tradeIdNumber = parseInt(id);
      if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
        throw new Error(`tradeIds[${index}] must be a valid non-negative integer`);
      }
      return tradeIdNumber;
    });

    // Validate batch permit structure
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!Array.isArray(permit.permitted) || permit.permitted.length === 0) {
      return res.status(400).json({
        error: 'permit.permitted must be an array of TokenPermissions for batch operations'
      });
    }

    // Validate each TokenPermissions in the batch
    permit.permitted.forEach((tokenPermission: any, index: number) => {
      if (!tokenPermission.token || !tokenPermission.amount) {
        throw new Error(`permit.permitted[${index}] must include token and amount fields`);
      }
    });

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Web3js TakerBatchDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Contract Address:', contractAddress);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('======================================');

    // Use provided RPC URL or default to Sepolia
    const rpcEndpoint = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    
    // Initialize Web3
    const web3 = new Web3(rpcEndpoint);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Create contract instance
    const contract = new web3.eth.Contract(FXESCROW_ABI, contractAddress);
    
    // Prepare function call data for batch permit
    const permitStruct = [
      permit.permitted.map((p: any) => [p.token, p.amount.toString()]), // TokenPermissions[]
      permit.nonce.toString(),
      permit.deadline.toString()
    ];

    console.log('=== Web3js Transaction Parameters ===');
    console.log('From Address:', account.address);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit Struct:', permitStruct);
    console.log('Signature:', signature);
    console.log('=====================================');

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await contract.methods.takerBatchDeliver(
          tradeIdNumbers,
          permitStruct,
          signature
        ).estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        return res.status(400).json({
          error: 'Failed to estimate gas for batch transaction',
          details: gasError.message
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the transaction
    const txData = contract.methods.takerBatchDeliver(
      tradeIdNumbers,
      permitStruct,
      signature
    );

    const tx = {
      from: account.address,
      to: contractAddress,
      data: txData.encodeABI(),
      gas: estimatedGas,
      gasPrice: txGasPrice
    };

    console.log('=== Sending Batch Transaction ===');
    console.log('Transaction:', tx);

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

    console.log('✅ Batch transaction successful!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed);

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      to: contractAddress,
      method: 'takerBatchDeliver',
      parameters: {
        tradeIds: tradeIdNumbers,
        permit: permit,
        signature: signature
      },
      receipt: receipt
    });

  } catch (err: any) {
    console.error('❌ Web3js TakerBatchDeliver Error:', err);
    
    let errorMessage = 'Batch transaction failed';
    if (err.message) {
      errorMessage = err.message;
    }
    
    // Handle common Web3 errors
    if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Batch transaction reverted - check contract conditions';
    } else if (err.message?.includes('nonce too low')) {
      errorMessage = 'Transaction nonce too low - transaction may have already been processed';
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      method: 'web3.takerBatchDeliver'
    });
  }
});

// POST /api/web3/makerBatchDeliver - Execute makerBatchDeliver function using Web3js
app.post('/api/web3/makerBatchDeliver', async (req, res) => {
  try {
    const {
      privateKey,
      contractAddress,
      rpcUrl,
      tradeIds,
      permit,
      signature,
      gasLimit,
      gasPrice
    } = req.body;

    // Validate required fields
    if (!privateKey) {
      return res.status(400).json({
        error: 'privateKey is required for Web3js transaction'
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: 'contractAddress is required'
      });
    }

    // Validate trade data
    if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds array is required and must not be empty'
      });
    }

    // Validate each trade ID
    const tradeIdNumbers = tradeIds.map((id, index) => {
      const tradeIdNumber = parseInt(id);
      if (isNaN(tradeIdNumber) || tradeIdNumber < 0) {
        throw new Error(`tradeIds[${index}] must be a valid non-negative integer`);
      }
      return tradeIdNumber;
    });

    // Validate batch permit structure
    if (!permit || !permit.permitted || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted, nonce, and deadline fields'
      });
    }

    if (!Array.isArray(permit.permitted) || permit.permitted.length === 0) {
      return res.status(400).json({
        error: 'permit.permitted must be an array of TokenPermissions for batch operations'
      });
    }

    // Validate each TokenPermissions in the batch
    permit.permitted.forEach((tokenPermission: any, index: number) => {
      if (!tokenPermission.token || !tokenPermission.amount) {
        throw new Error(`permit.permitted[${index}] must include token and amount fields`);
      }
    });

    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    console.log('=== Web3js MakerBatchDeliver Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Contract Address:', contractAddress);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('======================================');

    // Use provided RPC URL or default to Sepolia
    const rpcEndpoint = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    
    // Initialize Web3
    const web3 = new Web3(rpcEndpoint);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // Create contract instance
    const contract = new web3.eth.Contract(FXESCROW_ABI, contractAddress);
    
    // Prepare function call data for batch permit
    const permitStruct = [
      permit.permitted.map((p: any) => [p.token, p.amount.toString()]), // TokenPermissions[]
      permit.nonce.toString(),
      permit.deadline.toString()
    ];

    console.log('=== Web3js Transaction Parameters ===');
    console.log('From Address:', account.address);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit Struct:', permitStruct);
    console.log('Signature:', signature);
    console.log('=====================================');

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await contract.methods.makerBatchDeliver(
          tradeIdNumbers,
          permitStruct,
          signature
        ).estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        return res.status(400).json({
          error: 'Failed to estimate gas for batch transaction',
          details: gasError.message
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the transaction
    const txData = contract.methods.makerBatchDeliver(
      tradeIdNumbers,
      permitStruct,
      signature
    );

    const tx = {
      from: account.address,
      to: contractAddress,
      data: txData.encodeABI(),
      gas: estimatedGas,
      gasPrice: txGasPrice
    };

    console.log('=== Sending Batch Transaction ===');
    console.log('Transaction:', tx);

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

    console.log('✅ Batch transaction successful!');
    console.log('Transaction Hash:', receipt.transactionHash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed);

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      to: contractAddress,
      method: 'makerBatchDeliver',
      parameters: {
        tradeIds: tradeIdNumbers,
        permit: permit,
        signature: signature
      },
      receipt: receipt
    });

  } catch (err: any) {
    console.error('❌ Web3js MakerBatchDeliver Error:', err);
    
    let errorMessage = 'Batch transaction failed';
    if (err.message) {
      errorMessage = err.message;
    }
    
    // Handle common Web3 errors
    if (err.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (err.message?.includes('execution reverted')) {
      errorMessage = 'Batch transaction reverted - check contract conditions';
    } else if (err.message?.includes('nonce too low')) {
      errorMessage = 'Transaction nonce too low - transaction may have already been processed';
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      method: 'web3.makerBatchDeliver'
    });
  }
});

// POST /api/makerNetDeliver - Execute makerNetDeliver function on FxEscrow contract using Circle SDK
app.post('/api/makerNetDeliver', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      refId,
      contractAddress,
      tradeIds,
      permit,
      signature
    } = req.body;

    // Validate required fields
    if (!walletApiKey || !entitySecret || !walletId || !contractAddress || !tradeIds || !permit || !signature) {
      return res.status(400).json({
        error: 'walletApiKey, entitySecret, walletId, contractAddress, tradeIds, permit, and signature are required'
      });
    }

    // Validate tradeIds is an array
    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds must be a non-empty array of trade IDs'
      });
    }

    // Convert trade IDs to numbers and validate
    const tradeIdNumbers = tradeIds.map((id: any) => {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      if (isNaN(numId) || numId < 0) {
        throw new Error(`Invalid trade ID: ${id}`);
      }
      return numId;
    });

    // Validate permit structure (required for makerNetDeliver)
    if (!permit.permitted || !Array.isArray(permit.permitted) || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted (array), nonce, and deadline fields'
      });
    }


    // Validate each permitted token
    for (let i = 0; i < permit.permitted.length; i++) {
      const p = permit.permitted[i];
      if (!p.token || !p.amount) {
        return res.status(400).json({
          error: `permit.permitted[${i}] must include token and amount fields`
        });
      }
    }

    // Validate nonce and deadline can be parsed as integers
    const parsedNonce = parseInt(permit.nonce);
    const parsedDeadline = parseInt(permit.deadline);
    if (isNaN(parsedNonce) || isNaN(parsedDeadline)) {
      return res.status(400).json({
        error: 'permit nonce and deadline must be valid integers'
      });
    }

    console.log('=== Circle SDK MakerNetDeliver Request ===');
    console.log('Wallet ID:', walletId);
    console.log('Contract Address:', contractAddress);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('TokenPermissions count:', permit.permitted.length);
    console.log('Permitted tokens:');
    permit.permitted.forEach((p: any, i: number) => {
      console.log(`  [${i}] Token: ${p.token}, Amount: ${p.amount}`);
    });
    console.log('Permit nonce:', permit.nonce);
    console.log('Permit deadline:', permit.deadline);
    console.log('Signature:', signature);
    console.log('==========================================');

    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: entitySecret
    });

    // Prepare the ABI function signature for makerNetDeliver
    const abiFunctionSignature = "makerNetDeliver(uint256[],((address,uint256)[],uint256,uint256),bytes)";

    // Prepare the ABI parameters array with PermitBatchTransferFrom struct
    const abiParameters = [
      tradeIdNumbers, // uint256[] ids
      [ // PermitBatchTransferFrom struct
        permit.permitted.map((p: any) => [p.token, p.amount]), // TokenPermissions[] permitted
        permit.nonce, // uint256 nonce
        permit.deadline // uint256 deadline
      ],
      signature // bytes signature
    ];

    console.log('ABI Function Signature:', abiFunctionSignature);
    try {
      console.log('ABI Parameters:', JSON.stringify(abiParameters, null, 2));
    } catch (jsonError) {
      console.log('ABI Parameters (could not stringify):');
      console.log('- Trade IDs:', abiParameters[0]);
      console.log('- Permit structure length:', abiParameters[1]?.length);
      console.log('- Signature length:', abiParameters[2]?.length);
    }

    const contractExecutionRequest = {
      walletId: walletId,
      contractAddress: contractAddress,
      abiFunctionSignature: abiFunctionSignature,
      abiParameters: abiParameters,
      ...(refId && { refId: refId }), // Only include refId if provided
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM'
        }
      }
    };

    console.log('=== Contract Execution Request ===');
    try {
      console.log('Request:', JSON.stringify(contractExecutionRequest, null, 2));
    } catch (jsonError) {
      console.log('Request (could not stringify, showing properties):');
      console.log('- walletId:', contractExecutionRequest.walletId);
      console.log('- contractAddress:', contractExecutionRequest.contractAddress);
      console.log('- abiFunctionSignature:', contractExecutionRequest.abiFunctionSignature);
      console.log('- abiParameters length:', contractExecutionRequest.abiParameters?.length);
      console.log('- refId:', contractExecutionRequest.refId);
      console.log('- fee:', contractExecutionRequest.fee);
    }
    console.log('==================================');

    // Execute the makerNetDeliver function
    console.log('About to call Circle SDK createContractExecutionTransaction...');
    let response;
    try {
      response = await circleClient.createContractExecutionTransaction(contractExecutionRequest);
      console.log('Circle SDK call completed successfully');
    } catch (sdkError: any) {
      console.error('Circle SDK call failed:', sdkError.message);
      console.error('SDK Error stack:', sdkError.stack);
      console.error('SDK Error name:', sdkError.name);
      console.error('SDK Error message:', sdkError.message);
      if (sdkError.response) {
        console.error('SDK Error response status:', sdkError.response.status);
        console.error('SDK Error response data:', sdkError.response.data);
      }
      throw sdkError; // Re-throw to be caught by outer catch
    }

    console.log('=== Circle SDK MakerNetDeliver Response ===');
    console.log('Response status:', response?.status);
    console.log('Response data exists:', !!response?.data);
    if (response?.data) {
      try {
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
      } catch (jsonError) {
        console.log('Response Data (could not stringify):', response.data);
      }
    } else {
      console.log('Response Data: undefined');
    }
    console.log('===========================================');

    // Check if response and response.data exist before accessing
    if (!response) {
      throw new Error('No response received from Circle SDK');
    }
    
    if (!response.data) {
      throw new Error('Response data is undefined from Circle SDK');
    }

    res.json(response.data);

  } catch (error: any) {
    console.error('Circle SDK MakerNetDeliver Error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Log error properties safely without circular references
    const errorInfo = {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    };
    console.error('Error details:', JSON.stringify(errorInfo, null, 2));
    
    let errorMessage = 'Unknown error occurred';
    if (error.response) {
      console.error('Error response data:', error.response.data);
      errorMessage = error.response.data?.message || error.response.data?.error || `HTTP ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from Circle API. Please check your network connection.';
    } else {
      errorMessage = error.message || 'Request failed to send';
    }

    res.status(500).json({
      error: errorMessage,
      details: error.response?.data || error.message,
      method: 'circle.makerNetDeliver'
    });
  }
});

// POST /api/web3/makerNetDeliver - Execute makerNetDeliver function using Web3js
app.post('/api/web3/makerNetDeliver', async (req, res) => {
  try {
    const {
      privateKey,
      contractAddress,
      rpcUrl,
      gasLimit,
      gasPrice,
      tradeIds,
      permit,
      signature
    } = req.body;

    // Validate required fields
    if (!privateKey || !contractAddress || !tradeIds || !permit || !signature) {
      return res.status(400).json({
        error: 'privateKey, contractAddress, tradeIds, permit, and signature are required'
      });
    }

    // Validate tradeIds is an array
    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        error: 'tradeIds must be a non-empty array of trade IDs'
      });
    }

    // Convert trade IDs to numbers and validate
    const tradeIdNumbers = tradeIds.map((id: any) => {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      if (isNaN(numId) || numId < 0) {
        throw new Error(`Invalid trade ID: ${id}`);
      }
      return numId;
    });

    // Validate permit structure (required for makerNetDeliver)
    if (!permit.permitted || !Array.isArray(permit.permitted) || !permit.nonce || !permit.deadline) {
      return res.status(400).json({
        error: 'permit must include permitted (array), nonce, and deadline fields'
      });
    }

    console.log('=== Web3js MakerNetDeliver Request ===');
    console.log('Contract Address:', contractAddress);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('Permit:', JSON.stringify(permit, null, 2));
    console.log('Signature:', signature);
    console.log('======================================');

    // Initialize Web3 with the provided or default RPC URL
    const web3RpcUrl = rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    const web3 = new Web3(web3RpcUrl);
    console.log('Using RPC URL:', web3RpcUrl);

    // Create account from private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('Using wallet address:', account.address);

    // Contract ABI - just the makerNetDeliver function
    const contractABI = [
      {
        "type": "function",
        "name": "makerNetDeliver",
        "inputs": [
          {
            "name": "ids",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "permit",
            "type": "tuple",
            "internalType": "struct IPermit2.PermitBatchTransferFrom",
            "components": [
              {
                "name": "permitted",
                "type": "tuple[]",
                "internalType": "struct IPermit2.TokenPermissions[]",
                "components": [
                  {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                  },
                  {
                    "name": "amount",
                    "type": "uint256",
                    "internalType": "uint256"
                  }
                ]
              },
              {
                "name": "nonce",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "deadline",
                "type": "uint256",
                "internalType": "uint256"
              }
            ]
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      }
    ];

    // Create contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Prepare permit struct for the contract call
    const permitStruct = {
      permitted: permit.permitted.map((p: any) => ({
        token: p.token,
        amount: p.amount.toString()
      })),
      nonce: permit.nonce.toString(),
      deadline: permit.deadline.toString()
    };

    console.log('Permit struct for contract:', JSON.stringify(permitStruct, null, 2));

    // Estimate gas if not provided
    let estimatedGas = gasLimit;
    if (!estimatedGas) {
      try {
        estimatedGas = await contract.methods.makerNetDeliver(
          tradeIdNumbers,
          permitStruct,
          signature
        ).estimateGas({ from: account.address });
        console.log('Estimated Gas:', estimatedGas);
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        return res.status(400).json({
          error: 'Gas estimation failed. The transaction may revert.',
          details: gasError.message
        });
      }
    }

    // Get gas price if not provided
    let txGasPrice = gasPrice;
    if (!txGasPrice) {
      txGasPrice = await web3.eth.getGasPrice();
      console.log('Current Gas Price:', web3.utils.fromWei(txGasPrice, 'gwei'), 'gwei');
    }

    // Execute the transaction
    const txData = contract.methods.makerNetDeliver(
      tradeIdNumbers,
      permitStruct,
      signature
    );

    const tx = {
      from: account.address,
      to: contractAddress,
      data: txData.encodeABI(),
      gas: estimatedGas.toString(),
      gasPrice: txGasPrice.toString()
    };

    console.log('Transaction object:', tx);

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);

    console.log('=== Web3js MakerNetDeliver Response ===');
    console.log('Transaction Receipt:', receipt);
    console.log('======================================');

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: account.address,
      to: contractAddress,
      method: 'makerNetDeliver',
      parameters: {
        tradeIds: tradeIdNumbers,
        permit: permit,
        signature: signature
      },
      receipt: receipt
    });

  } catch (err: any) {
    console.error('Web3js MakerNetDeliver Error:', err);
    
    let errorMessage = 'An unknown error occurred';
    if (err.message) {
      if (err.message.includes('revert')) {
        errorMessage = 'Transaction reverted. Please check your parameters and contract state.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else {
        errorMessage = err.message;
      }
    }

    res.status(500).json({
      error: errorMessage,
      details: err.message,
      method: 'web3.makerNetDeliver'
    });
  }
});

// POST /api/getTokenBalance - Get token balances for a wallet using Circle SDK
app.post('/api/getTokenBalance', async (req, res) => {
  try {
    const { walletApiKey, walletId, environment } = req.body;

    // Validate required fields
    if (!walletApiKey || !walletId) {
      return res.status(400).json({
        error: 'Both walletApiKey and walletId are required'
      });
    }

    console.log('=== Get Token Balance Request ===');
    console.log('Wallet ID:', walletId);
    console.log('Environment:', environment);
    console.log('================================');

    // Initialize the Circle SDK client (entitySecret not required for read operations)
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: walletApiKey,
      entitySecret: '' // Empty for read-only operations
    });

    // Get wallet details and token balances
    const [walletResponse, tokenBalanceResponse] = await Promise.all([
      circleClient.getWallet({ id: walletId }),
      circleClient.getWalletTokenBalance({ id: walletId })
    ]);

    console.log('=== Wallet Details ===');
    console.log('Wallet:', JSON.stringify(walletResponse.data, null, 2));
    console.log('=== Token Balances ===');
    console.log('Token Balances:', JSON.stringify(tokenBalanceResponse.data, null, 2));
    console.log('=====================');

    const wallet = walletResponse.data as any;
    const tokenBalances = tokenBalanceResponse.data as any;

    // Format the response with actual token balances
    const response = {
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        blockchain: wallet.blockchain,
        accountType: wallet.accountType,
        state: wallet.state
      },
      tokens: tokenBalances.tokenBalances || [],
      totalTokens: tokenBalances.tokenBalances?.length || 0,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    console.error('Get Token Balance Error:', error);
    
    // Handle specific Circle SDK errors
    if (error.response) {
      console.error('Circle SDK Error Response:', error.response.data);
      return res.status(error.response.status || 500).json({
        error: error.response.data?.message || error.message || 'Circle SDK request failed',
        details: error.response.data || null,
        method: 'Circle SDK getTokenBalance'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to get token balance',
      method: 'Circle SDK getTokenBalance'
    });
  }
});

// POST /api/getMakerNetBalances - Get maker net balances using Circle SDK
app.post('/api/getMakerNetBalances', async (req, res) => {
  try {
    const {
      walletApiKey,
      entitySecret,
      walletId,
      contractAddress,
      tradeIds
    } = req.body;

    // Validate required fields
    if (!contractAddress || !tradeIds) {
      return res.status(400).json({
        error: 'contractAddress and tradeIds are required'
      });
    }

    // Validate and parse trade IDs
    const tradeIdNumbers = tradeIds.map((id: any) => {
      const numId = parseInt(id);
      if (isNaN(numId) || numId < 0) {
        throw new Error(`Invalid trade ID: ${id}`);
      }
      return numId;
    });

    console.log('=== Web3js GetMakerNetBalances Request ===');
    console.log('Contract Address:', contractAddress);
    console.log('Trade IDs:', tradeIdNumbers);
    console.log('===========================================');

    // Initialize Web3
    const web3 = new Web3(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');

    // Contract ABI - just the getMakerNetBalances function
    const contractABI = [
      {
        "type": "function",
        "name": "getMakerNetBalances",
        "inputs": [
          {
            "name": "ids",
            "type": "uint256[]",
            "internalType": "uint256[]"
          }
        ],
        "outputs": [
          {
            "name": "balances",
            "type": "tuple[]",
            "internalType": "struct Balance[]",
            "components": [
              {
                "name": "token",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "amount",
                "type": "int256",
                "internalType": "int256"
              }
            ]
          }
        ],
        "stateMutability": "view"
      }
    ];

    // Create contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    console.log('Calling getMakerNetBalances with trade IDs:', tradeIdNumbers);

    // Call the view function
    let balances;
    try {
      balances = await contract.methods.getMakerNetBalances(tradeIdNumbers).call();
      console.log('Contract call completed successfully');
    } catch (contractError: any) {
      console.error('Contract call failed:', contractError);
      throw new Error(`Contract call failed: ${contractError.message}`);
    }

    console.log('=== Web3js GetMakerNetBalances Response ===');
    console.log('Raw balances:', balances);
    console.log('Number of balance entries:', balances?.length || 0);

    // Format the response to match the expected structure
    const formattedBalances = Array.isArray(balances) ? balances.map((balance: any, index: number) => {
      console.log(`Balance ${index}:`, {
        token: balance.token,
        amount: balance.amount.toString()
      });
      return {
        token: balance.token,
        amount: balance.amount.toString() // Convert BigInt to string for JSON serialization
      };
    }) : [];

    console.log('===============================================');

    const responseData = {
      success: true,
      contractAddress: contractAddress,
      tradeIds: tradeIdNumbers,
      balances: formattedBalances,
      method: 'web3.getMakerNetBalances'
    };

    res.json(responseData);

  } catch (error: any) {
    console.error('Web3js GetMakerNetBalances Error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Log error properties safely without circular references
    const errorInfo = {
      name: error.name,
      message: error.message,
      code: error.code,
      reason: error.reason,
      data: error.data
    };
    console.error('Error details:', JSON.stringify(errorInfo, null, 2));
    
    let errorMessage = 'Unknown error occurred';
    if (error.reason) {
      errorMessage = `Contract call failed: ${error.reason}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message,
      method: 'web3.getMakerNetBalances'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
