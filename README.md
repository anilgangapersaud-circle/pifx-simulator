# StableFX Client

This is a client for testing and demonstrating StableFX APIs with Programmable Wallets Integration.

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- StableFX API key for the environment you want to test
- Local StableFX SDK (ask Anil)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd stablefx-client
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


If you have any troubles calling APIs, ensure the local StableFX SDK is installed
