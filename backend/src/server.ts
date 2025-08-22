import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

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

    // Validate the typedData can be stringified
    let dataString;
    try {
      dataString = JSON.stringify(requestBody.typedData);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
