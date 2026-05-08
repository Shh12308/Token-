import { useGetBalancesQuery } from '../store/services/walletApi';

const Wallet = () => {
  const [view, setView] = useState('quick');

  const { data, isLoading, error } = useGetBalancesQuery();

  const balances = data || {};

  const renderView = () => {
    switch (view) {
      case 'send':
        return <SendView setView={setView} />;
      case 'receive':
        return <ReceiveView setView={setView} />;
      case 'swap':
        return <SwapView setView={setView} />;
      default:
        return <QuickActionsView setView={setView} />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4">CryptoBean Wallet</Typography>

      {/* BALANCE DISPLAY */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {isLoading && <p>Loading balances...</p>}
        {error && <p style={{ color: 'red' }}>Failed to load balances</p>}

        {!isLoading && !error && (
          <div>
            <p>ETH: {balances.eth || 0}</p>
            <p>USDC: {balances.usdc || 0}</p>
          </div>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 2 }}>
        {renderView()}
      </Paper>
    </Box>
  );
};
