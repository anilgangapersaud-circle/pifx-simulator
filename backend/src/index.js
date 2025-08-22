const { Web3 } = require('web3');
const { ethers } = require('ethers'); // For EIP-712 signing
​
// Initialize web3 connection
const web3 = new Web3('https://ethereum-sepolia-rpc.publicnode.com'); // Replace with your RPC endpoint
​
// Contract ABI for FxEscrow.recordTrade function
const FX_ESCROW_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "taker",
        "type": "address"
      },
      {
        "components": [
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "quoteId",
                "type": "bytes32"
              },
              {
                "internalType": "address",
                "name": "base",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "quote",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "baseAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "quoteAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "maturity",
                "type": "uint256"
              }
            ],
            "internalType": "struct Consideration",
            "name": "consideration",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "internalType": "struct TakerDetails",
        "name": "takerDetails",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "takerSignature",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "maker",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "internalType": "struct MakerDetails",
        "name": "makerDetails",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "makerSignature",
        "type": "bytes"
      }
    ],
    "name": "recordTrade",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
​
// Contract configuration
const FX_ESCROW_ADDRESS = '0xF7029EE5108069bBf7927e75C6B8dBd99e6c6572'; // Replace with actual FxEscrow contract address
const CHAIN_ID = 11155111; // Replace with your chain ID (1 for Mainnet, 11155111 for Sepolia, etc.)
​
// Sample addresses (replace with actual addresses)
const ADDRESSES = {
  TAKER: '0x8D1E401EfD6187a6f97860C956d7F684EAa43691',
  MAKER: '0x1D1735aBC6AFF3B7786A924929A509A049a2bc38',
  RECIPIENT: '0x3234567890123456789012345678901234567890',
  EURC: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4', // EURC token address
  USDC: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC token address
  RELAYER: '0x0d4524a9FE506aaC2A58aA98d27eb0d4D1Ff5Fa2'
};
​
// Private keys for signing (in practice, use secure key management)
const TAKER_PRIVATE_KEY = '0x123---'; // Taker's private key
const MAKER_PRIVATE_KEY = '0x123...'; // Maker's private key
const RELAYER_PRIVATE_KEY = '0x123...'; // Relayer's private key (must have relayer permission)
​
// EIP-712 Domain
const EIP712_DOMAIN = {
  name: 'FxEscrow',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: '0x51F8418D9c64E67c243DCb8f10771bA83bcd9Aa8'
};
​
// EIP-712 Types
const EIP712_TAKER_TYPES = {
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
​
const EIP712_MAKER_TYPES = {
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
​
// Sample test data based on FxEscrowTest.sol
function getSampleTradeData() {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  const consideration = {
    quoteId: web3.utils.keccak256('1'),
    base: ADDRESSES.EURC,
    quote: ADDRESSES.USDC,
    baseAmount: 200000000, // 200 EURC (6 decimals)
    quoteAmount: 250000000, // 250 USDC (6 decimals)
    maturity: (currentTimestamp + 100000).toString()
  };
​
  const takerDetails = {
    consideration: consideration,
    recipient: ADDRESSES.RECIPIENT,
    fee: 10000000, // 10 EURC fee (6 decimals)
    nonce: 1,
    deadline: (currentTimestamp + 1000).toString()
  };
​
  const makerDetails = {
    fee: 5000000, // 5 USDC fee (6 decimals)
    nonce: 1,
    deadline: (currentTimestamp + 1000).toString()
  };
​
  return {
    consideration,
    takerDetails,
    makerDetails
  };
}
​
// Function to create EIP-712 signature
async function signEIP712(privateKey, domain, types, primaryType, message) {
  const wallet = new ethers.Wallet(privateKey);
  
  const signature = await wallet.signTypedData(domain, types, message);
  
  return signature;
}
​
// Function to sign taker details
async function signTakerDetails(takerDetails) {
  return await signEIP712(
    TAKER_PRIVATE_KEY,
    EIP712_DOMAIN,
    EIP712_TAKER_TYPES,
    'TakerDetails',
    takerDetails
  );
}
​
// Function to sign maker details
async function signMakerDetails(makerDetails, consideration) {
  const makerDetailsWithConsideration = {
    ...makerDetails,
    consideration: consideration
  };
  
  return await signEIP712(
    MAKER_PRIVATE_KEY,
    EIP712_DOMAIN,
    EIP712_MAKER_TYPES,
    'MakerDetails',
    makerDetailsWithConsideration
  );
}
​
// Main function to record a trade
async function recordTrade() {
  try {
    console.log('Setting up FxEscrow contract...');
    
    // Create contract instance
    const fxEscrowContract = new web3.eth.Contract(FX_ESCROW_ABI, FX_ESCROW_ADDRESS);
    
    // Add relayer account to web3
    web3.eth.accounts.wallet.add(RELAYER_PRIVATE_KEY);
    const relayerAccount = web3.eth.accounts.privateKeyToAccount(RELAYER_PRIVATE_KEY);
    
    console.log('Getting sample trade data...');
    
    // Get sample trade data
    const { takerDetails, makerDetails, consideration } = getSampleTradeData();
    
    console.log('Trade Data:');
    console.log('- Base Token (EURC):', consideration.base);
    console.log('- Quote Token (USDC):', consideration.quote);
    console.log('- Base Amount:', web3.utils.fromWei(consideration.baseAmount, 'mwei'), 'EURC');
    console.log('- Quote Amount:', web3.utils.fromWei(consideration.quoteAmount, 'mwei'), 'USDC');
    console.log('- Taker Fee:', web3.utils.fromWei(takerDetails.fee, 'mwei'), 'EURC');
    console.log('- Maker Fee:', web3.utils.fromWei(makerDetails.fee, 'mwei'), 'USDC');
    
    console.log('\nSigning taker details...');
    const takerSignature = await signTakerDetails(takerDetails);
    console.log('Taker signature:', takerSignature);
    
    console.log('\nSigning maker details...');
    const makerSignature = await signMakerDetails(makerDetails, consideration);
    console.log('Maker signature:', makerSignature);
    
    console.log('\nEstimating gas for recordTrade...');
    
    // Estimate gas
    const gasEstimate = await fxEscrowContract.methods.recordTrade(
      ADDRESSES.TAKER,
      takerDetails,
      takerSignature,
      ADDRESSES.MAKER,
      makerDetails,
      makerSignature
    ).estimateGas({
      from: relayerAccount.address
    });
    
    console.log('Estimated gas:', gasEstimate);
    
    // Get current gas price
    const gasPrice = await web3.eth.getGasPrice();
    console.log('Current gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
    
    console.log('\nSending recordTrade transaction...');
    
    // Send the transaction
    const tx = await fxEscrowContract.methods.recordTrade(
      ADDRESSES.TAKER,
      takerDetails,
      takerSignature,
      ADDRESSES.MAKER,
      makerDetails,
      makerSignature
    ).send({
      from: relayerAccount.address
    });
    
    console.log('Transaction successful!');
    console.log('Transaction hash:', tx.transactionHash);
    console.log('Block number:', tx.blockNumber);
    console.log('Gas used:', tx.gasUsed);
    
    // Extract trade ID from events
    const tradeRecordedEvent = tx.events.TradeRecorded;
    if (tradeRecordedEvent) {
      const tradeId = tradeRecordedEvent.returnValues.id;
      const quoteId = tradeRecordedEvent.returnValues.quoteId;
      console.log('Trade recorded with ID:', tradeId);
      console.log('Quote ID:', quoteId);
    }
    
    return tx;
    
  } catch (error) {
    console.error('Error recording trade:', error);
    throw error;
  }
}
​
// Function to check if an address has relayer permission
async function checkRelayerPermission(address) {
  try {
    const fxEscrowContract = new web3.eth.Contract([
      {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "relayers",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ], FX_ESCROW_ADDRESS);
    
    const isRelayer = await fxEscrowContract.methods.relayers(address).call();
    console.log(`Address ${address} is relayer:`, isRelayer);
    return isRelayer;
  } catch (error) {
    console.error('Error checking relayer permission:', error);
    return false;
  }
}
​
// Function to get trade details by ID
async function getTradeDetails(tradeId) {
  try {
    const fxEscrowContract = new web3.eth.Contract([
      {
        "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
        "name": "getTradeDetails",
        "outputs": [
          {
            "components": [
              {"internalType": "contract ERC20", "name": "base", "type": "address"},
              {"internalType": "contract ERC20", "name": "quote", "type": "address"},
              {"internalType": "address", "name": "taker", "type": "address"},
              {"internalType": "address", "name": "maker", "type": "address"},
              {"internalType": "address", "name": "recipient", "type": "address"},
              {"internalType": "uint256", "name": "baseAmount", "type": "uint256"},
              {"internalType": "uint256", "name": "quoteAmount", "type": "uint256"},
              {"internalType": "uint256", "name": "takerFee", "type": "uint256"},
              {"internalType": "uint256", "name": "makerFee", "type": "uint256"},
              {"internalType": "uint256", "name": "maturity", "type": "uint256"},
              {"internalType": "uint8", "name": "status", "type": "uint8"},
              {"internalType": "uint8", "name": "takerFundingStatus", "type": "uint8"},
              {"internalType": "uint8", "name": "makerFundingStatus", "type": "uint8"}
            ],
            "internalType": "struct TradeDetails",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ], FX_ESCROW_ADDRESS);
    
    const tradeDetails = await fxEscrowContract.methods.getTradeDetails(tradeId).call();
    console.log('Trade Details for ID', tradeId, ':', tradeDetails);
    return tradeDetails;
  } catch (error) {
    console.error('Error getting trade details:', error);
    return null;
  }
}
​
// Example usage
async function main() {
  console.log('=== FxEscrow Record Trade Example ===\n');
  
  // First check if the relayer has permission
  console.log('Checking relayer permission...');
  await checkRelayerPermission(ADDRESSES.RELAYER);
  
  console.log('\n=== Recording Trade ===');
  
  // Record the trade
  const result = await recordTrade();
  
  // If successful, fetch the trade details
  if (result && result.events && result.events.TradeRecorded) {
    const tradeId = result.events.TradeRecorded.returnValues.id;
    
    console.log('\n=== Fetching Trade Details ===');
    await getTradeDetails(tradeId);
  }
  
  console.log('\n=== Complete ===');
}
​
// Export functions for use in other modules
module.exports = {
  recordTrade,
  getSampleTradeData,
  signTakerDetails,
  signMakerDetails,
  checkRelayerPermission,
  getTradeDetails,
  FX_ESCROW_ABI,
  EIP712_DOMAIN,
  EIP712_TAKER_TYPES,
  EIP712_MAKER_TYPES
};
​
// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}








