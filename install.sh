
# --- PART 2: Advanced File Generation ---

echo "Continuing with the advanced file generation..."

# --- WALLETS ---
# --- FILE: src/pages/WalletsPage.js ---
cat > src/pages/WalletsPage.js << 'EOF'
import React from 'react';
import { useUI } from '../context/UI';
import Button from '../components/UI/Button';
import WalletList from '../components/Wallets/WalletList';
import styles from './WalletsPage.module.css';

const WalletsPage = () => {
  const { openModal } = useUI();

  return (
    <div>
      <div className={styles.header}>
        <h1>Wallets</h1>
        <Button onClick={() => openModal('CREATE_WALLET')}>+ Create Wallet</Button>
      </div>
      <WalletList />
    </div>
  );
};

export default WalletsPage;
EOF

# --- FILE: src/pages/WalletsPage.module.css ---
cat > src/pages/WalletsPage.module.css << 'EOF'
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
EOF

# --- FILE: src/components/Wallets/WalletList.js ---
cat > src/components/Wallets/WalletList.js << 'EOF'
import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import WalletCard from './WalletCard';
import styles from './WalletList.module.css';

const WalletList = () => {
  const { data: wallets, loading } = useFetch('/api/wallets');

  if (loading) return <div className={styles.grid}><Skeleton count={4} height={150} /></div>;

  return (
    <div className={styles.grid}>
      {wallets?.length > 0 ? (
        wallets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} />)
      ) : (
        <p className={styles.empty}>You have no wallets yet. Create one to get started!</p>
      )}
    </div>
  );
};

export default WalletList;
EOF

# --- FILE: src/components/Wallets/WalletList.module.css ---
cat > src/components/Wallets/WalletList.module.css << 'EOF'
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.empty { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-secondary); }
EOF

# --- FILE: src/components/Wallets/WalletCard.js ---
cat > src/components/Wallets/WalletCard.js << 'EOF'
import React from 'react';
import { useUI } from '../../context/UI';
import { formatCurrency, formatAddress } from '../../utils/formatters';
import styles from './WalletCard.module.css';

const WalletCard = ({ wallet }) => {
  const { openModal } = useUI();

  return (
    <div className={styles.card} onClick={() => openModal('WALLET_DETAILS', wallet)}>
      <div className={styles.header}>
        <h3>{wallet.name}</h3>
        <span className={styles.type}>{wallet.type}</span>
      </div>
      <p className={styles.address}>{formatAddress(wallet.address)}</p>
      <div className={styles.balance}>
        <span className={styles.label}>Balance</span>
        <span className={styles.value}>{formatCurrency(wallet.balance_usd, 'USD')}</span>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" size="small" onClick={(e) => { e.stopPropagation(); openModal('SEND_FUNDS', wallet); }}>Send</Button>
        <Button variant="secondary" size="small" onClick={(e) => { e.stopPropagation(); /* openModal('RECEIVE_FUNDS', wallet); */ }}>Receive</Button>
      </div>
    </div>
  );
};

export default WalletCard;
EOF

# --- FILE: src/components/Wallets/WalletCard.module.css ---
cat > src/components/Wallets/WalletCard.module.css << 'EOF'
.card { background-color: var(--color-bg-secondary); border: 1px solid var(--color-bg-tertiary); border-radius: var(--border-radius); padding: 1.5rem; cursor: pointer; transition: all 0.2s ease-in-out; }
.card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.card h3 { margin: 0; }
.type { font-size: 0.8rem; padding: 0.2rem 0.5rem; background-color: var(--color-bg-tertiary); border-radius: 12px; color: var(--color-text-secondary); }
.address { font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; color: var(--color-text-tertiary); margin-bottom: 1.5rem; }
.balance { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.label { color: var(--color-text-secondary); font-size: 0.9rem; }
.value { font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary); }
.actions { display: flex; gap: 0.5rem; }
.actions button { flex-grow: 1; }
EOF

# --- FILE: src/components/Wallets/CreateWalletModal.js ---
cat > src/components/Wallets/CreateWalletModal.js << 'EOF'
import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { useUI } from '../../context/UI';
import Button from '../UI/Button';
import styles from '../UI/Modal.module.css';

const CreateWalletModal = ({ onClose }) => {
  const { api } = useApi();
  const { openModal } = useUI();
  const [step, setStep] = useState(1);
  const [walletType, setWalletType] = useState('fiat');
  const [formData, setFormData] = useState({ name: '', currency: 'USD' });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/wallets', { ...formData, type: walletType });
      const newWallet = res.data;
      onClose();
      toast.success('Wallet created successfully!');
      openModal('WALLET_DETAILS', newWallet);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create wallet.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2>Create a New Wallet</h2>
            <div className={styles.modalBody}>
              <p>What type of wallet would you like to create?</p>
              <div className={styles.formGroup}>
                <label>
                  <input type="radio" value="fiat" checked={walletType === 'fiat'} onChange={() => setWalletType('fiat')} />
                  {' '}Fiat Wallet (USD, EUR, etc.)
                </label>
                <label>
                  <input type="radio" value="crypto" checked={walletType === 'crypto'} onChange={() => setWalletType('crypto')} />
                  {' '}Crypto Wallet (BTC, ETH, etc.)
                </label>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2>Wallet Details</h2>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Wallet Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., My Savings" />
              </div>
              <div className={styles.formGroup}>
                <label>Currency</label>
                <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2>Confirm & Create</h2>
            <div className={styles.modalBody}>
              <p>Please review your wallet details.</p>
              <ul>
                <li><strong>Name:</strong> {formData.name}</li>
                <li><strong>Type:</strong> {walletType}</li>
                <li><strong>Currency:</strong> {formData.currency}</li>
              </ul>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={handleBack}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Wallet'}</Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.stepIndicator}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepLabel}>Type</span>
        </div>
        <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepLabel}>Details</span>
        </div>
        <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepLabel}>Confirm</span>
        </div>
      </div>
      {renderStep()}
    </>
  );
};

export default CreateWalletModal;
EOF

# --- FILE: src/components/Wallets/WalletDetailsModal.js ---
cat > src/components/Wallets/WalletDetailsModal.js << 'EOF'
import React from 'react';
import { formatAddress, formatCurrency, formatDate } from '../../utils/formatters';
import styles from '../UI/Modal.module.css';

const WalletDetailsModal = ({ data: wallet, onClose }) => {
  if (!wallet) return null;

  return (
    <>
      <div className={styles.modalHeader}>
        <h2>{wallet.name}</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
      <div className={styles.modalBody}>
        <div className={styles.formGroup}>
          <label>Address</label>
          <input type="text" value={wallet.address} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Type</label>
          <input type="text" value={wallet.type} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Balance</label>
          <input type="text" value={formatCurrency(wallet.balance_usd, 'USD')} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Created At</label>
          <input type="text" value={formatDate(wallet.created_at)} readOnly />
        </div>
      </div>
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </>
  );
};

export default WalletDetailsModal;
EOF

# --- FILE: src/components/Wallets/SendFundsModal.js ---
cat > src/components/Wallets/SendFundsModal.js << 'EOF'
import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { useUI } from '../../context/UI';
import Button from '../UI/Button';
import styles from '../UI/Modal.module.css';

const SendFundsModal = ({ data: wallet, onClose }) => {
  const { api } = useApi();
  const [formData, setFormData] = useState({ recipient: '', amount: '', currency: 'USD' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/wallets/${wallet.id}/send`, formData);
      onClose();
      toast.success('Funds sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send funds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.modalHeader}>
        <h2>Send Funds from {wallet.name}</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Recipient Address</label>
            <input type="text" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} required />
          </div>
          <div className={styles.formGroup}>
            <label>Amount</label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          </div>
          <div className={styles.formGroup}>
            <label>Currency</label>
            <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>
        <div className={styles.modalActions}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Funds'}</Button>
        </div>
      </form>
    </>
  );
};

export default SendFundsModal;
EOF

# --- CARDS ---
# --- FILE: src/pages/CardsPage.js ---
cat > src/pages/CardsPage.js << 'EOF'
import React from 'react';
import { useUI } from '../context/UI';
import Button from '../components/UI/Button';
import CardList from '../components/Cards/CardList';
import styles from './CardsPage.module.css';

const CardsPage = () => {
  const { openModal } = useUI();

  return (
    <div>
      <div className={styles.header}>
        <h1>Cards</h1>
        <Button onClick={() => openModal('CREATE_CARD')}>+ Create Card</Button>
      </div>
      <CardList />
    </div>
  );
};

export default CardsPage;
EOF

# --- FILE: src/pages/CardsPage.module.css ---
cat > src/pages/CardsPage.module.css << 'EOF'
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
EOF

# --- FILE: src/components/Cards/CardList.js ---
cat > src/components/Cards/CardList.js << 'EOF'
import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import CardDisplay from './CardDisplay';
import styles from './CardList.module.css';

const CardList = () => {
  const { data: cards, loading } = useFetch('/api/cards');

  if (loading) return <div className={styles.list}><Skeleton count={3} height={200} /></div>;

  return (
    <div className={styles.list}>
      {cards?.length > 0 ? (
        cards.map(card => <CardDisplay key={card.id} card={card} />)
      ) : (
        <p className={styles.empty}>You have no cards yet. Create one to get started!</p>
      )}
    </div>
  );
};

export default CardList;
EOF

# --- FILE: src/components/Cards/CardList.module.css ---
cat > src/components/Cards/CardList.module.css << 'EOF'
.list { display: flex; flex-direction: column; gap: 1.5rem; }
.empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
EOF

# --- FILE: src/components/Cards/CardDisplay.js ---
cat > src/components/Cards/CardDisplay.js << 'EOF'
import React from 'react';
import { useUI } from '../../context/UI';
import styles from './CardDisplay.module.css';

const CardDisplay = ({ card }) => {
  const { openModal } = useUI();
  const cardStyle = card.type === 'virtual' ? styles.virtual : styles.physical;

  return (
    <div className={`${styles.card} ${cardStyle}`} onClick={() => openModal('CARD_DETAILS', card)}>
      <div className={styles.chip}></div>
      <div className={styles.number}>
        <span>•••• •••• ••••</span> {card.last_four}
      </div>
      <div className={styles.info}>
        <div>
          <p className={styles.holder}>{card.holder_name}</p>
          <p className={styles.expiry}>{card.expiry_month}/{card.expiry_year}</p>
        </div>
        <div className={styles.brand}>
          <span>{card.brand.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
EOF

# --- FILE: src/components/Cards/CardDisplay.module.css ---
cat > src/components/Cards/CardDisplay.module.css << 'EOF'
.card { width: 100%; max-width: 450px; height: 250px; border-radius: 16px; padding: 1.5rem; color: white; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s; font-family: 'Courier New', Courier, monospace; }
.card:hover { transform: scale(1.02); }
.physical { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.virtual { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.chip { width: 50px; height: 40px; background-color: #d4af37; border-radius: 8px; }
.number { font-size: 1.5rem; letter-spacing: 2px; margin-top: 1rem; }
.info { display: flex; justify-content: space-between; align-items: flex-end; }
.holder { margin: 0; font-size: 1rem; text-transform: uppercase; }
.expiry { margin: 0; font-size: 0.9rem; }
.brand { font-size: 1.5rem; font-weight: bold; font-family: sans-serif; }
EOF

# --- FILE: src/components/Cards/CreateCardModal.js ---
cat > src/components/Cards/CreateCardModal.js << 'EOF'
import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { useUI } from '../../context/UI';
import Button from '../UI/Button';
import styles from '../UI/Modal.module.css';

const CreateCardModal = ({ onClose }) => {
  const { api } = useApi();
  const [formData, setFormData] = useState({ type: 'virtual', holder_name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/cards', formData);
      onClose();
      toast.success('Card created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.modalHeader}>
        <h2>Create a New Card</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Card Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="virtual">Virtual</option>
              <option value="physical">Physical</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Cardholder Name</label>
            <input type="text" value={formData.holder_name} onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })} required />
          </div>
        </div>
        <div className={styles.modalActions}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Card'}</Button>
        </div>
      </form>
    </>
  );
};

export default CreateCardModal;
EOF

# --- FILE: src/components/Cards/CardDetailsModal.js ---
cat > src/components/Cards/CardDetailsModal.js << 'EOF'
import React from 'react';
import { formatDate } from '../../utils/formatters';
import Button from '../UI/Button';
import styles from '../UI/Modal.module.css';

const CardDetailsModal = ({ data: card, onClose }) => {
  if (!card) return null;

  return (
    <>
      <div className={styles.modalHeader}>
        <h2>Card Details</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
      <div className={styles.modalBody}>
        <div className={styles.formGroup}>
          <label>Card Number</label>
          <input type="text" value={`**** **** **** ${card.last_four}`} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Cardholder</label>
          <input type="text" value={card.holder_name} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Status</label>
          <input type="text" value={card.status} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Type</label>
          <input type="text" value={card.type} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Expiry</label>
          <input type="text" value={`${card.expiry_month}/${card.expiry_year}`} readOnly />
        </div>
        <div className={styles.formGroup}>
          <label>Created At</label>
          <input type="text" value={formatDate(card.created_at)} readOnly />
        </div>
      </div>
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="danger">Freeze Card</Button>
      </div>
    </>
  );
};

export default CardDetailsModal;
EOF

# --- TRANSACTIONS ---
# --- FILE: src/pages/TransactionsPage.js ---
cat > src/pages/TransactionsPage.js << 'EOF'
import React from 'react';
import TransactionList from '../components/Transactions/TransactionList';

const TransactionsPage = () => {
  return (
    <div>
      <h1>Transactions</h1>
      <TransactionList />
    </div>
  );
};

export default TransactionsPage;
EOF

# --- FILE: src/components/Transactions/TransactionList.js ---
cat > src/components/Transactions/TransactionList.js << 'EOF'
import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import TransactionItem from './TransactionItem';
import styles from './TransactionList.module.css';

const TransactionList = () => {
  const { data: transactions, loading } = useFetch('/api/transactions');

  if (loading) return <div className={styles.list}><Skeleton count={5} height={80} /></div>;

  return (
    <div className={styles.list}>
      {transactions?.length > 0 ? (
        transactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
      ) : (
        <p className={styles.empty}>No transactions found.</p>
      )}
    </div>
  );
};

export default TransactionList;
EOF

# --- FILE: src/components/Transactions/TransactionList.module.css ---
cat > src/components/Transactions/TransactionList.module.css << 'EOF'
.list { display: flex; flex-direction: column; gap: 0.75rem; }
.empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
EOF

# --- FILE: src/components/Transactions/TransactionItem.js ---
cat > src/components/Transactions/TransactionItem.js << 'EOF'
import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import styles from './TransactionItem.module.css';

const TransactionItem = ({ transaction }) => {
  const isSent = transaction.type === 'sent';
  return (
    <div className={styles.item}>
      <div className={styles.icon}>
        {isSent ? '↑' : '↓'}
      </div>
      <div className={styles.details}>
        <p className={styles.message}>{transaction.message}</p>
        <p className={styles.date}>{formatDate(transaction.created_at)}</p>
      </div>
      <p className={`${styles.amount} ${isSent ? styles.negative : styles.positive}`}>
        {isSent ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
      </p>
    </div>
  );
};

export default TransactionItem;
EOF

# --- FILE: src/components/Transactions/TransactionItem.module.css ---
cat > src/components/Transactions/TransactionItem.module.css << 'EOF'
.item { display: flex; align-items: center; background-color: var(--color-bg-secondary); padding: 1rem 1.5rem; border-radius: var(--border-radius); border: 1px solid var(--color-bg-tertiary); }
.icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; margin-right: 1rem; }
.item:nth-child(odd) .icon { background-color: rgba(239, 68, 68, 0.1); color: var(--color-danger); }
.item:nth-child(even) .icon { background-color: rgba(34, 197, 94, 0.1); color: var(--color-success); }
.details { flex-grow: 1; }
.message { margin: 0; font-weight: 500; }
.date { margin: 0; font-size: 0.8rem; color: var(--color-text-tertiary); }
.amount { margin: 0; font-size: 1.1rem; font-weight: 600; }
.positive { color: var(--color-success); }
.negative { color: var(--color-danger); }
EOF

# --- NFTs ---
# --- FILE: src/pages/NFTsPage.js ---
cat > src/pages/NFTsPage.js << 'EOF'
import React from 'react';
import NFTGrid from '../components/NFTs/NFTGrid';

const NFTsPage = () => {
  return (
    <div>
      <h1>My NFTs</h1>
      <NFTGrid />
    </div>
  );
};

export default NFTsPage;
EOF

# --- FILE: src/components/NFTs/NFTGrid.js ---
cat > src/components/NFTs/NFTGrid.js << 'EOF'
import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import NFTCard from './NFTCard';
import styles from './NFTGrid.module.css';

const NFTGrid = () => {
  const { data: nfts, loading } = useFetch('/api/nfts');

  if (loading) return <div className={styles.grid}><Skeleton count={8} height={250} /></div>;

  return (
    <div className={styles.grid}>
      {nfts?.length > 0 ? (
        nfts.map(nft => <NFTCard key={nft.id} nft={nft} />)
      ) : (
        <p className={styles.empty}>You don't own any NFTs yet.</p>
      )}
    </div>
  );
};

export default NFTGrid;
EOF

# --- FILE: src/components/NFTs/NFTGrid.module.css ---
cat > src/components/NFTs/NFTGrid.module.css << 'EOF'
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
.empty { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-text-secondary); }
EOF

# --- FILE: src/components/NFTs/NFTCard.js ---
cat > src/components/NFTs/NFTCard.js << 'EOF'
import React from 'react';
import styles from './NFTCard.module.css';

const NFTCard = ({ nft }) => {
  return (
    <div className={styles.card}>
      <img src={nft.image_url} alt={nft.name} className={styles.image} />
      <div className={styles.info}>
        <h3 className={styles.name}>{nft.name}</h3>
        <p className={styles.collection}>{nft.collection_name}</p>
      </div>
    </div>
  );
};

export default NFTCard;
EOF

# --- FILE: src/components/NFTs/NFTCard.module.css ---
cat > src/components/NFTs/NFTCard.module.css << 'EOF'
.card { background-color: var(--color-bg-secondary); border: 1px solid var(--color-bg-tertiary); border-radius: var(--border-radius); overflow: hidden; cursor: pointer; transition: transform 0.2s; }
.card:hover { transform: translateY(-5px); }
.image { width: 100%; height: 200px; object-fit: cover; }
.info { padding: 1rem; }
.name { margin: 0 0 0.25rem 0; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.collection { margin: 0; font-size: 0.8rem; color: var(--color-text-tertiary); }
EOF

# --- KYC ---
# --- FILE: src/pages/KYCPage.js ---
cat > src/pages/KYCPage.js << 'EOF'
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useApi } from '../context/ApiContext';
import Button from '../components/UI/Button';
import styles from './KYCPage.module.css';

const KYCPage = () => {
  const { data: kycData, loading } = useFetch('/api/kyc');
  const { api } = useApi();
  const [submitting, setSubmitting] = useState(false);

  const handleStartKYC = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/kyc/start');
      toast.success('KYC process started! Please check your email.');
    } catch (error) {
      toast.error('Failed to start KYC process.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton height={300} />;

  return (
    <div className={styles.container}>
      <h1>Identity Verification (KYC)</h1>
      <div className={styles.card}>
        <div className={styles.status}>
          <span className={`${styles.indicator} ${styles[kycData?.status || 'pending']}`}></span>
          <h2>Status: {kycData?.status?.toUpperCase() || 'NOT STARTED'}</h2>
        </div>
        <p className={styles.message}>
          {kycData?.message || 'To unlock all features, please complete our identity verification process.'}
        </p>
        {!kycData || kycData.status === 'pending' ? (
          <Button onClick={handleStartKYC} disabled={submitting}>
            {submitting ? 'Starting...' : 'Start Verification'}
          </Button>
        ) : (
          <p className={styles.info}>We will notify you once your verification is reviewed.</p>
        )}
      </div>
    </div>
  );
};

export default KYCPage;
EOF

# --- FILE: src/pages/KYCPage.module.css ---
cat > src/pages/KYCPage.module.css << 'EOF'
.container { max-width: 600px; }
.card { background-color: var(--color-bg-secondary); border: 1px solid var(--color-bg-tertiary); border-radius: var(--border-radius); padding: 2rem; margin-top: 2rem; }
.status { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.indicator { width: 20px; height: 20px; border-radius: 50%; }
.indicator.pending { background-color: var(--color-warning); }
.indicator.verified { background-color: var(--color-success); }
.indicator.rejected { background-color: var(--color-danger); }
.message { color: var(--color-text-secondary); margin-bottom: 2rem; }
.info { font-style: italic; color: var(--color-text-tertiary); }
EOF

# --- SETTINGS ---
# --- FILE: src/pages/SettingsPage.js ---
cat > src/pages/SettingsPage.js << 'EOF'
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <h1>Settings</h1>
      <div className={styles.card}>
        <h2>Profile</h2>
        <div className={styles.field}>
          <label>Name</label>
          <input type="text" value={user?.name || ''} readOnly />
        </div>
        <div className={styles.field}>
          <label>Email</label>
          <input type="email" value={user?.email || ''} readOnly />
        </div>
        <Button variant="secondary">Update Profile</Button>
      </div>
      <div className={styles.card}>
        <h2>Security</h2>
        <Button variant="secondary">Change Password</Button>
      </div>
      <div className={styles.card}>
        <h2>Danger Zone</h2>
        <Button variant="danger">Delete Account</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
EOF

# --- FILE: src/pages/SettingsPage.module.css ---
cat > src/pages/SettingsPage.module.css << 'EOF'
.container { max-width: 700px; }
.card { background-color: var(--color-bg-secondary); border: 1px solid var(--color-bg-tertiary); border-radius: var(--border-radius); padding: 1.5rem; margin-bottom: 1.5rem; }
.card h2 { margin-top: 0; margin-bottom: 1.5rem; color: var(--color-text-secondary); }
.field { margin-bottom: 1.5rem; }
.field label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--color-text-secondary); }
.field input { width: 100%; padding: 0.75rem; background-color: var(--color-bg-tertiary); border: 1px solid var(--color-bg-quaternary); border-radius: var(--border-radius); }
EOF

# --- FINAL SCRIPT SUMMARY ---
echo "✅ All advanced files have been generated successfully!"
echo "🚀 Your Fintech Pro React application is now fully structured."
echo ""
echo "📁 Next Steps:"
echo "1. Start the mock API server:"
echo "   npm run server"
echo "2. In a new terminal, start the React app:"
echo "   npm start"
echo ""
echo "🎉 The application will be available at http://localhost:3000."
echo "   - Login with 'user@example.com' and 'password'."
echo "   - Explore the dashboard, wallets, cards, and other features."
echo ""
echo "📦 For deployment, refer to the DEPLOYMENT.md file in your project root."
echo "   - It provides detailed instructions for Vercel, Netlify, and AWS."
