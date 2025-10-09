import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import * as forge from 'node-forge';
import { Environment, initializeStableFXClient, Type, FundingMode, FundRequest } from '@circle-fin/stablefx-sdk';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

app.post('/api/quotes', async (req, res) => {
  try {
    const { environment, apiKey, ...requestBody } = req.body;
    
    const client = initializeStableFXClient({ 
      apiKey, 
      environment: Environment.Smokebox 
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
      environment: Environment.Smokebox 
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
      environment: Environment.Smokebox 
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
    const { apiKey, contractTradeIds, traderType, fundingMode } = req.body;
    
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
      environment: Environment.Smokebox
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
    const { apiKey, type, status, pageSize, from, to } = req.query;
    
    const client = initializeStableFXClient({
      apiKey: apiKey as string,
      environment: Environment.Smokebox
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
    const { apiKey, type } = req.query;
    
    const client = initializeStableFXClient({
      apiKey: apiKey as string,
      environment: Environment.Smokebox
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
      environment: Environment.Smokebox 
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
      circleRequest
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

app.post('/api/fund', async (req, res) => {
  try {
    const { apiKey, type, permit2, signature, fundingMode } = req.body;
    
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
      environment: Environment.Smokebox
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

    const response = await client.fundTrade({ fundRequest });

    res.json(response.data);

  } catch (error: any) {
    console.error('StableFX Fund Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to fund trade';
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

app.post('/api/getTokenBalance', async (req, res) => {
  try {
    const { walletApiKey, walletId } = req.body;

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
        walletId
      ),
      callCircleWalletAPI(
        '/v1/w3s/wallets/{id}/balances',
        'GET',
        walletApiKey,
        undefined,
        undefined,
        walletId
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

async function generateEntitySecretCiphertextManually(apiKey: string, entitySecret: string): Promise<string> {
  try {
    console.log('🔄 Generating entity secret ciphertext with RSA-OAEP encryption...');
    
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAyV7p/zStlMgMSol1cLhc
eQv+tCXljEOFN34r484vAMrah8mXRLBXoAwMJEWgGKP2utMdhaEPRi3KoreAw7xS
XF0e1v+I90zgBcSvxd8TX3d4XPjPxFI2Ko5t2Tc0HeEas57xyrAGFdDWhgJVgBvA
SIrhsswhP1pnj3kAHtS9pNcWFVO1ymYbWypjHpX8niDIziw1DkA2b7tD1N8I5k9s
gKdDsrNlWWscZxzpRmGICmW6G/rP+pLl2bGigJlKW3hDxVFXDsQbzD2L/qzWbc74
iyX9UcdGCFh5/Wfplo+pvdn74vJAqBt5DXJ10wdBX8DNaFTLMd+C1Y1/hb0coRtB
WklJuckrQAJ3mMoh4uYc7J5bL0gf5a1TGo9dBCibTsj1SA6hSb/TIYuaDW8QGZpU
4/FJHRgHjd/tdhXwyrGeRypxNtOQsu3fvD0mlSyBWZi4mvCkiVT9peUVVcyQGa9W
9rF6EVkx7icIoPvciiOUO79mr/6UB7U99uX22U1ksGQIplxCcoGbVK87FqeM+bBu
Ls/YDuUNbYCcQGU5fVAjItKFIxxa5RunSlV/gfzz7Vtqu931vMDsRyrJ05HzDZ/J
snULX2cSoBqlLeD03YpMiFZ5wPPU7rbbMwWq3WhDjJL1IlGB4n6F7Ultu2VgASo4
LoOYfEiKkkueIix1Kdwvuu0CAwEAAQ==
-----END PUBLIC KEY-----`;
    
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

const callCircleWalletAPI = async (endpoint: string, method: 'GET' | 'POST', apiKey: string, entitySecret?: string, data?: any, walletId?: string) => {
  const baseUrl = 'https://api-staging.circle.com';
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
    if (entitySecret) {
      data.entitySecretCiphertext = await generateEntitySecretCiphertextManually(apiKey, entitySecret);
    }
    config.data = data;
  }

  return await axios(config);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
