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

    // Validate typedData structure
    const { typedData } = requestBody;
    if (!typedData.types || !typedData.primaryType || !typedData.domain || !typedData.message) {
      return res.status(400).json({
        error: 'typedData must include types, primaryType, domain, and message fields'
      });
    }

    // Log the request for debugging (remove in production)
    console.log('Sign Typed Data Request:', {
      walletId: requestBody.walletId,
      primaryType: typedData.primaryType,
      domain: typedData.domain,
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
    if (typedDataForCircle.types && typedDataForCircle.types.EIP712Domain) {
      console.log('🔧 Removing EIP712Domain from types for Circle SDK compatibility');
      const { EIP712Domain, ...cleanTypes } = typedDataForCircle.types;
      typedDataForCircle = {
        ...typedDataForCircle,
        types: cleanTypes
      };
    }

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
    if (makerDetails.fee === undefined || makerDetails.nonce === undefined || 
        makerDetails.deadline === undefined) {
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

    // Convert string numbers to integers for contract execution
    const parseToInt = (value: any) => {
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return typeof value === 'number' ? value : parseInt(String(value), 10);
    };

    // Prepare the ABI parameters array with proper integer conversion
    const abiParameters = [
      taker, // address taker
      [ // TakerDetails struct
        [ // Consideration struct
          takerDetails.consideration.quoteId, // bytes32 (keep as string/hex)
          takerDetails.consideration.base, // address (keep as string)
          takerDetails.consideration.quote, // address (keep as string)
          parseToInt(takerDetails.consideration.baseAmount), // uint256 -> integer
          parseToInt(takerDetails.consideration.quoteAmount), // uint256 -> integer
          parseToInt(takerDetails.consideration.maturity) // uint256 -> integer
        ],
        takerDetails.recipient, // address (keep as string)
        parseToInt(takerDetails.fee), // uint256 -> integer
        parseToInt(takerDetails.nonce), // uint256 -> integer
        parseToInt(takerDetails.deadline) // uint256 -> integer
      ],
      takerSignature, // bytes (keep as string/hex)
      maker, // address maker (keep as string)
      [ // MakerDetails struct
        parseToInt(makerDetails.fee), // uint256 -> integer
        parseToInt(makerDetails.nonce), // uint256 -> integer
        parseToInt(makerDetails.deadline) // uint256 -> integer
      ],
      makerSignature // bytes (keep as string/hex)
    ];

    console.log('=== Contract Execution Parameters ===');
    console.log('Function Signature:', abiFunctionSignature);
    console.log('Parameter Types:');
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

    // Validate EIP-712 structure
    if (!typedData.domain || !typedData.types || !typedData.message) {
      return res.status(400).json({
        success: false,
        error: 'Invalid EIP-712 typed data structure. Must have domain, types, and message fields.'
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
      // Use provided private key or generate one
      const providedPrivateKey = req.body.privateKey;
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
      } else {
        // Generate wallet if no private key provided
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
    
    // Prepare types for ethers.js (remove EIP712Domain as it's handled automatically)
    const { EIP712Domain, ...typesForSigning } = typedData.types;
    
    console.log('📝 Signing with:', {
      domain: typedData.domain,
      typesCount: Object.keys(typesForSigning).length,
      primaryType: typedData.primaryType || 'auto-detected',
      hasMessage: !!typedData.message
    });
    
    const signature = await ethersWallet.signTypedData(
      typedData.domain,
      typesForSigning,
      typedData.message
    );

    console.log('✅ Signature generated successfully');

    // Parse signature into components (similar to Circle SDK format)
    const sigComponents = ethers.Signature.from(signature);

    res.json({
      success: true,
      data: {
        signature,
        wallet: walletInfo,
        signatureComponents: {
          r: sigComponents.r,
          s: sigComponents.s,
          v: sigComponents.v
        },
        typedData: {
          original: typedData,
          usedForSigning: {
            domain: typedData.domain,
            types: typesForSigning,
            message: typedData.message
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
      verifyingContract: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8'
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
        contractAddress: '0xF7029EE5108069bBf7927e75C6B8dBd99e6c6572', // FxEscrow contract
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
