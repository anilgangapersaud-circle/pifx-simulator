# PiFX Simulator

A modern React and Node.js application for testing Circle CPS (Circle Programmable Settlements) API endpoints with support for both Smokebox and Sandbox environments.

## Features

- **Environment Switching**: Toggle between Smokebox and Sandbox environments with a single click
- **API Key Management**: Secure API key input with password masking
- **Complete API Coverage**: Support for all Circle CPS endpoints:
  - POST `/v1/exchange/stablefx/quotes`
  - POST `/v1/exchange/stablefx/trades`
  - POST `/v1/exchange/stablefx/signatures`
  - GET `/v1/exchange/stablefx/trades`
  - GET `/v1/exchange/stablefx/trades/:tradeId`
  - GET `/v1/exchange/stablefx/signatures/presign/taker/:tradeId`
- **Dynamic Forms**: Custom forms for each endpoint with appropriate field validation
- **Query Parameters**: Support for filtering and pagination on GET requests
- **Response Display**: Beautiful JSON response viewer with error handling
- **Modern UI**: Responsive design with professional styling

## Project Structure

```
pifx-simulator/
├── backend/                 # Node.js Express server
│   ├── src/
│   │   └── server.ts       # Main server file with API proxy
│   ├── package.json
│   └── tsconfig.json
└── frontend/               # React TypeScript application
    ├── src/
    │   ├── components/     # React components
    │   │   ├── EnvironmentSwitcher.tsx
    │   │   ├── ApiKeyInput.tsx
    │   │   ├── QuotesForm.tsx
    │   │   ├── TradesForm.tsx
    │   │   ├── SignaturesForm.tsx
    │   │   ├── GetTradesForm.tsx
    │   │   ├── GetTradeByIdForm.tsx
    │   │   ├── GetSignaturesForm.tsx
    │   │   └── ResponseDisplay.tsx
    │   ├── App.tsx         # Main application component
    │   └── App.css         # Styling
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Valid Circle API key for the environment you want to test

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd pifx-simulator
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You'll need to run both the backend and frontend servers:

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **In a new terminal, start the frontend:**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## Usage

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Select Environment**: Choose between Sandbox or Smokebox by clicking the respective button

3. **Enter API Key**: Input your Circle API key in the password field

4. **Use the API Forms**:
   - **POST Quotes**: Enter amount, currencies, and settlement method to get a quote
   - **POST Trades**: Use a quote ID to create a trade with destination address
   - **POST Signatures**: Submit cryptographic signatures for trades
   - **GET Trades**: Retrieve trades with optional filtering by status, currency, etc.
   - **GET Trade by ID**: Get specific trade details using trade ID
   - **GET Signatures**: Get presign data for a specific trade

5. **View Responses**: All API responses are displayed in the response section with proper formatting

## API Endpoints

### Environment URLs
- **Sandbox**: `https://api-sandbox.circle.com`
- **Smokebox**: `https://api-smokebox.circle.com`

### Supported Endpoints
- `POST /v1/exchange/stablefx/quotes` - Get exchange quotes
- `POST /v1/exchange/stablefx/trades` - Create trades
- `POST /v1/exchange/stablefx/signatures` - Submit signatures
- `GET /v1/exchange/stablefx/trades` - List trades
- `GET /v1/exchange/stablefx/trades/:tradeId` - Get trade details
- `GET /v1/exchange/stablefx/signatures/presign/taker/:tradeId` - Get presign data

## Configuration

### Backend Configuration
The backend server acts as a proxy to handle CORS and add authentication headers. It runs on port 3001 by default.

### Frontend Configuration
The frontend connects to the backend at `http://localhost:3001`. All API calls go through the backend proxy.

## Security Notes

- API keys are handled securely and only transmitted to your local backend
- The backend adds proper authentication headers for Circle API calls
- Passwords are masked in the UI for security

## Customization

You can customize the forms by modifying the respective component files in `frontend/src/components/`. The form fields are based on typical Circle API requirements, but you may need to adjust them based on the actual API documentation you receive.

## Troubleshooting

1. **CORS Errors**: Make sure the backend is running and accessible
2. **API Errors**: Check that your API key is valid for the selected environment
3. **Network Issues**: Ensure both frontend (3000) and backend (3001) ports are available

## Development

- Backend uses TypeScript with Express and Axios
- Frontend uses React with TypeScript and functional components
- Styling uses modern CSS with responsive design
- Both servers support hot reloading during development

## Next Steps

When you receive the actual API documentation, you may need to update:
- Form fields in the POST components to match exact API requirements
- Query parameters in GET components
- Error handling for specific API response formats
- Add any additional endpoints that may be available
