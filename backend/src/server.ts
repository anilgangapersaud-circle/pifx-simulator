import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import * as forge from 'node-forge';
import { v4 as uuidv4 } from 'uuid';
import { Environment, initializeStableFXClient, Type, FundingMode, FundRequest } from '@circle-fin/stablefx-sdk';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Permit2 contract address (Universal Router)
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

app.post('/api/quotes', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    
    const client = initializeStableFXClient({ 
      apiKey, 
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox 
    });
    
    const response = await client.createQuote({ quoteRequest: requestBody });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.post('/api/trades', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    
    const client = initializeStableFXClient({ 
      apiKey, 
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox 
    });
    
    const response = await client.createTrade({ tradeRequest: requestBody });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.post('/api/signatures', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    
    const client = initializeStableFXClient({ 
      apiKey, 
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox 
    });
    
    const response = await client.registerTradeSignature({
      registerTradeSignatureRequest: requestBody
    });
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.post('/api/signatures/funding/presign', async (req, res) => {
  try {
    const { apiKey, environment, contractTradeIds, traderType, fundingMode } = req.body;
    
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
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const type: Type = traderType === 'taker' ? Type.taker : Type.maker;
    const mode: FundingMode = fundingMode === 'gross' ? FundingMode.gross : FundingMode.net;

    const response = await client.getFundingPresignData({
      fundingPresignRequest: {
      contractTradeIds,
        type,
        fundingMode: mode
      }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('StableFX Funding Presign Error:', error);
    
    let errorMessage = 'Failed to get funding presign data';
    let statusCode = 500;
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.message || error.response.data?.error || error.message;
    } else if (error.request) {
      errorMessage = 'No response from StableFX API. Please check your network connection.';
    } else {
      errorMessage = error.message || 'Request failed to send';
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data || null
    });
  }
});

app.get('/api/trades', async (req, res) => {
  try {
    const { apiKey, environment, type, status, pageSize, from, to } = req.query;
    
    const client = initializeStableFXClient({
      apiKey: apiKey as string,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const traderType: Type = (type as string)?.toLowerCase() === 'taker' ? Type.taker : Type.maker;
    
    // Build request parameters
    const requestParams: any = {
      type: traderType
    };

    if (status) requestParams.status = status;
    if (pageSize) requestParams.pageSize = parseInt(pageSize as string);
    if (from) requestParams.from = from;
    if (to) requestParams.to = to;
    
    const response = await client.listTrades(requestParams);
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.get('/api/trades/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { apiKey, environment, type } = req.query;
    
    const client = initializeStableFXClient({
      apiKey: apiKey as string,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const tradeType: Type = (type as string)?.toLowerCase() === 'taker' ? Type.taker : Type.maker;
    
    const response = await client.getTradeById({
      tradeId,
      type: tradeType
    });
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.get('/api/signatures/presign/:type/:tradeId', async (req, res) => {
  try {
    const { type, tradeId } = req.params;
    const { environment, apiKey, ...queryParams } = req.query;
    
    const client = initializeStableFXClient({ 
      apiKey: apiKey as string, 
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox 
    });
    
    const traderType: Type = type === 'taker' ? Type.taker : Type.maker;
    
    const response = await client.getTradePresignData({
      traderType: traderType,
      tradeId: tradeId,
      ...queryParams
    });

    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null
    });
  }
});

app.post('/api/wallet/sign/typedData', async (req, res) => {
  try {
    const { walletApiKey, entitySecret, publicKeyPem, environment, ...requestBody } = req.body;
    
    if (!walletApiKey || !entitySecret || !publicKeyPem) {
      return res.status(400).json({
        error: 'walletApiKey, entitySecret, and publicKeyPem are required'
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

    const { typedData } = requestBody;
    if (!typedData.types || !typedData.primaryType || !typedData.message) {
      return res.status(400).json({
        error: 'typedData must include types, primaryType, and message fields'
      });
    }

    let typedDataForCircle = { ...requestBody.typedData };
  
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

    const circleRequest = {
      walletId: requestBody.walletId,
      data: dataString
    };

    const response = await callCircleWalletAPI(
      '/v1/w3s/developer/sign/typedData',
      'POST',
      walletApiKey,
      entitySecret,
      circleRequest,
      undefined,
      undefined,
      publicKeyPem,
      environment
    );
    
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

// Generic fund endpoint
app.post('/api/fund', async (req, res) => {
  try {
    const { apiKey, environment, type, permit2, signature, fundingMode } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        error: 'apiKey is required'
      });
    }
    
    if (!type) {
      return res.status(400).json({
        error: 'type is required (TAKER or MAKER)'
      });
    }
    
    if (!permit2) {
      return res.status(400).json({
        error: 'permit2 is required'
      });
    }
    
    if (!signature) {
      return res.status(400).json({
        error: 'signature is required'
      });
    }

    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const tradeType: Type = type.toLowerCase() === 'taker' ? Type.taker : Type.maker;
    
    const fundRequest: FundRequest = {
      type: tradeType,
      signature,
      permit2
    };

    // Add fundingMode if provided (for maker trades)
    if (fundingMode) {
      const mode: FundingMode = fundingMode.toLowerCase() === 'gross' ? FundingMode.gross : FundingMode.net;
      fundRequest.fundingMode = mode;
    }

    console.log('💰 Funding trade request:', {
      type: tradeType,
      fundingMode: fundRequest.fundingMode,
      hasSignature: !!signature,
      hasPermit2: !!permit2
    });

    const response = await client.fundTrade({ fundRequest });

    console.log('✅ Fund trade successful:', response.data);
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ StableFX Fund Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to fund trade';
    let errorDetails = null;

    if (error.response) {
      console.error('❌ Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('❌ Status:', error.response.status);
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

// Taker deliver (single trade)
app.post('/api/takerDeliver', async (req, res) => {
  try {
    const { apiKey, environment, permit2, signature } = req.body;
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const fundRequest: FundRequest = {
      type: Type.taker,
      signature,
      permit2,
      fundingMode: FundingMode.gross
    };

    console.log('💰 Taker Deliver (single):', { hasSignature: !!signature, hasPermit2: !!permit2 });
    const response = await client.fundTrade({ fundRequest });
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Taker Deliver Error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// Taker batch deliver
app.post('/api/takerBatchDeliver', async (req, res) => {
  try {
    const { apiKey, environment, permit2, signature } = req.body;
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const fundRequest: FundRequest = {
      type: Type.taker,
      signature,
      permit2,
      fundingMode: FundingMode.gross
    };

    console.log('💰 Taker Batch Deliver:', { hasSignature: !!signature, hasPermit2: !!permit2 });
    const response = await client.fundTrade({ fundRequest });
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Taker Batch Deliver Error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// Maker deliver (single trade, gross)
app.post('/api/makerDeliver', async (req, res) => {
  try {
    const { apiKey, environment, permit2, signature } = req.body;
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const fundRequest: FundRequest = {
      type: Type.maker,
      signature,
      permit2,
      fundingMode: FundingMode.gross
    };

    console.log('💰 Maker Deliver (single, gross):', { hasSignature: !!signature, hasPermit2: !!permit2 });
    const response = await client.fundTrade({ fundRequest });
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Maker Deliver Error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// Maker batch deliver (gross)
app.post('/api/makerBatchDeliver', async (req, res) => {
  try {
    const { apiKey, environment, permit2, signature } = req.body;
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const fundRequest: FundRequest = {
      type: Type.maker,
      signature,
      permit2,
      fundingMode: FundingMode.gross
    };

    console.log('💰 Maker Batch Deliver (gross):', { hasSignature: !!signature, hasPermit2: !!permit2 });
    const response = await client.fundTrade({ fundRequest });
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Maker Batch Deliver Error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// Maker net deliver
app.post('/api/makerNetDeliver', async (req, res) => {
  try {
    const { apiKey, environment, permit2, signature } = req.body;
    
    const client = initializeStableFXClient({
      apiKey,
      environment: environment === 'sandbox' ? Environment.Sandbox : Environment.Smokebox
    });

    const fundRequest: FundRequest = {
      type: Type.maker,
      signature,
      permit2,
      fundingMode: FundingMode.net
    };

    console.log('💰 Maker Net Deliver:', { hasSignature: !!signature, hasPermit2: !!permit2 });
    const response = await client.fundTrade({ fundRequest });
    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Maker Net Deliver Error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

app.post('/api/approvePermit2', async (req, res) => {
  try {
    const { walletApiKey, entitySecret, publicKeyPem, environment, walletId, typedData, amount, refId } = req.body;

    if (!walletApiKey || !entitySecret || !publicKeyPem || !walletId) {
      return res.status(400).json({
        error: 'walletApiKey, entitySecret, publicKeyPem, and walletId are required'
      });
    }

    if (!typedData) {
      return res.status(400).json({
        error: 'typedData is required to extract token and spender addresses'
      });
    }

    // Parse typed data if it's a string
    let typedDataObj;
    try {
      typedDataObj = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid typedData format - must be valid JSON'
      });
    }

    // Extract token address and spender address from typed data
    const permitData = typedDataObj?.message;
    if (!permitData) {
      return res.status(400).json({
        error: 'typedData must contain a message field'
      });
    }

    // Extract token address from permitted field
    let tokenAddress = '';
    if (permitData.permitted) {
      if (Array.isArray(permitData.permitted)) {
        // Batch mode - use first token
        tokenAddress = permitData.permitted[0]?.token || '';
      } else {
        // Single mode
        tokenAddress = permitData.permitted?.token || '';
      }
    }

    if (!tokenAddress) {
      return res.status(400).json({
        error: 'No token address found in typedData.message.permitted'
      });
    }

    // Use the official Permit2 contract address as spender
    const spenderAddress = PERMIT2_ADDRESS;
    
    // Optional: Validate against typed data if spender is provided
    if (permitData.spender && permitData.spender.toLowerCase() !== PERMIT2_ADDRESS.toLowerCase()) {
      console.warn('⚠️  Spender in typed data does not match Permit2 address:', {
        typedDataSpender: permitData.spender,
        permit2Address: PERMIT2_ADDRESS
      });
    }

    const approvalAmount = amount || '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // Max uint256 if no amount specified

    console.log('🔐 Approving Permit2:', {
      tokenAddress,
      spenderAddress,
      walletId,
      amount: approvalAmount
    });

    // Generate idempotency key for the request - must be UUID v4 format
    const idempotencyKey = uuidv4();

    // Create contract execution request for ERC20 approve
    // Circle's API expects abiParameters as an array of values
    const contractExecutionRequest: any = {
      walletId,
      contractAddress: tokenAddress,
      idempotencyKey,
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [
        spenderAddress,
        approvalAmount
      ],
      feeLevel: 'MEDIUM'
    };

    // Optional refId for reference
    if (refId) {
      contractExecutionRequest.refId = refId;
    }

    console.log('📤 Sending contract execution request:', JSON.stringify(contractExecutionRequest, null, 2));
    console.log('🔑 Idempotency Key (UUID v4):', idempotencyKey);
    console.log('✅ Spender address being used:', spenderAddress);
    console.log('✅ Permit2 constant:', PERMIT2_ADDRESS);
    console.log('✅ Are they equal?', spenderAddress === PERMIT2_ADDRESS);

    const response = await callCircleWalletAPI(
      '/v1/w3s/developer/transactions/contractExecution',
      'POST',
      walletApiKey,
      entitySecret,
      contractExecutionRequest,
      undefined,
      idempotencyKey,
      publicKeyPem,
      environment
    );

    res.json(response.data);

  } catch (error: any) {
    console.error('❌ Approve Permit2 Error:', error);
    
    if (error.response) {
      console.error('❌ Circle API Error Response:', JSON.stringify(error.response.data, null, 2));
      console.error('❌ Status:', error.response.status);
      console.error('❌ Headers:', error.response.headers);
      return res.status(error.response.status || 500).json({
        error: error.response.data?.message || error.response.data?.error || error.message || 'Circle API request failed',
        details: error.response.data || null,
        method: 'Circle API approvePermit2',
        statusCode: error.response.status
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to approve Permit2',
      method: 'Circle API approvePermit2'
    });
  }
});

app.post('/api/getTokenBalance', async (req, res) => {
  try {
    const { walletApiKey, walletId, environment } = req.body;

    if (!walletApiKey || !walletId) {
      return res.status(400).json({
        error: 'Both walletApiKey and walletId are required'
      });
    }

    const [walletResponse, tokenBalanceResponse] = await Promise.all([
      callCircleWalletAPI(
        '/v1/w3s/wallets/{id}',
        'GET',
        walletApiKey,
        undefined,
        undefined,
        walletId,
        undefined,
        undefined,
        environment
      ),
      callCircleWalletAPI(
        '/v1/w3s/wallets/{id}/balances',
        'GET',
        walletApiKey,
        undefined,
        undefined,
        walletId,
        undefined,
        undefined,
        environment
      )
    ]);

    const wallet = walletResponse.data as any;
    const tokenBalances = tokenBalanceResponse.data as any;

    const response = {
      success: true,
      wallet: {
        id: wallet.data?.wallet?.id || wallet.id,
        address: wallet.data?.wallet?.address || wallet.address,
        blockchain: wallet.data?.wallet?.blockchain || wallet.blockchain,
        accountType: wallet.data?.wallet?.accountType || wallet.accountType,
        state: wallet.data?.wallet?.state || wallet.state
      },
      tokens: tokenBalances.data?.tokenBalances || tokenBalances.tokenBalances || [],
      totalTokens: tokenBalances.data?.tokenBalances?.length || tokenBalances.tokenBalances?.length || 0,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    console.error('Get Token Balance Error:', error);
    
    if (error.response) {
      console.error('Circle API Error Response:', error.response.data);
      return res.status(error.response.status || 500).json({
        error: error.response.data?.message || error.message || 'Circle API request failed',
        details: error.response.data || null,
        method: 'Circle API getTokenBalance'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to get token balance',
      method: 'Circle API getTokenBalance'
    });
  }
});

// Endpoint to generate entity secret ciphertext (for testing/verification)
app.post('/api/generateEntitySecretCiphertext', async (req, res) => {
  try {
    const { entitySecret, publicKeyPem } = req.body;

    if (!entitySecret || !publicKeyPem) {
      return res.status(400).json({
        error: 'Both entitySecret and publicKeyPem are required'
      });
    }

    const ciphertext = await generateEntitySecretCiphertextManually('', entitySecret, publicKeyPem);
    
    res.json({ 
      ciphertext,
      length: ciphertext.length
    });
  } catch (error: any) {
    console.error('❌ Error generating entity secret ciphertext:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate entity secret ciphertext',
      details: error.toString()
    });
  }
});

async function generateEntitySecretCiphertextManually(apiKey: string, entitySecret: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔄 Generating entity secret ciphertext with RSA-OAEP encryption...');
    
    const entitySecretBytes = forge.util.hexToBytes(entitySecret);
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    const encryptedData = publicKey.encrypt(entitySecretBytes, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    
    const ciphertext = forge.util.encode64(encryptedData);
    console.log('✅ Generated entity secret ciphertext (length:', ciphertext.length, 'chars)');
    
    return ciphertext;
  } catch (error: any) {
    console.error('❌ Error generating entity secret ciphertext manually:', error.message);
    throw error;
  }
}

const callCircleWalletAPI = async (endpoint: string, method: 'GET' | 'POST', apiKey: string, entitySecret?: string, data?: any, walletId?: string, idempotencyKey?: string, publicKeyPem?: string, environment?: string) => {
  // Use api.circle.com for sandbox, api-staging.circle.com for smokebox (default)
  const baseUrl = environment === 'sandbox' ? 'https://api.circle.com' : 'https://api-staging.circle.com';
  const url = walletId ? `${baseUrl}${endpoint.replace('{id}', walletId)}` : `${baseUrl}${endpoint}`;
  
  const headers: any = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const config: any = {
    method,
    url,
    headers
  };

  if (method === 'POST' && data) {
    if (entitySecret && publicKeyPem) {
      data.entitySecretCiphertext = await generateEntitySecretCiphertextManually(apiKey, entitySecret, publicKeyPem);
    }
    config.data = data;
  }

  return await axios(config);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
