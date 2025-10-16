# Quick Start - Authentication Setup

## 1. Environment Setup

Create `.env.local` in the frontend directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
```

## 2. Install a Starknet Wallet

Choose one:

- **ArgentX**: <https://www.argent.xyz/argent-x/>
- **Braavos**: <https://braavos.app/>

## 3. Start the Development Server

```bash
cd frontend
npm run dev
```

## 4. Test the Flow

1. Open <http://localhost:3000>
2. Click "Connect Wallet"
3. Approve connection in wallet
4. Sign the authentication message
5. Get redirected to dashboard
6. Select your role (Creator, Node, or Admin)

## 5. Verify Authentication

Open browser console and check:

```javascript
// Check stored tokens
localStorage.getItem("access_token");
localStorage.getItem("user_address");
localStorage.getItem("user_role");
```

## Common Issues

### "Wallet not found"

- Install ArgentX or Braavos extension
- Refresh the page

### "Authentication failed"

- Ensure backend is running on port 8000
- Check `.env.local` has correct API_URL
- Verify wallet is connected to Sepolia network

### "Network error"

- Start the backend API
- Check CORS settings in backend
- Verify API endpoint in browser network tab

## Next Steps

See `docs/AUTHENTICATION.md` for detailed documentation.
