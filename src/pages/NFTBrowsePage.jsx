import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import {
  faSearch, faFilter, faArrowLeft, faHeart, faExternalLinkAlt,
  faTag, faClock, faFire, faGem, faLock, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getWalletFromVault } from '../utils/Keymanager';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CHAIN_LABELS = {
  ethereum: 'Ethereum', polygon: 'Polygon', bsc: 'BSC',
  arbitrum: 'Arbitrum', optimism: 'Optimism', base: 'Base',
};

const NFTBrowsePage = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [trendingCollections, setTrendingCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeChain, setActiveChain] = useState('ethereum');
  const [sortBy, setSortBy] = useState('trending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [signError, setSignError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const categories = ['all', 'art', 'gaming', 'music', 'photography', 'pfp', 'collectibles'];

  // ── Fetch NFTs ──────────────────────────────────────
  const fetchExplore = useCallback(async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/nft/explore`, {
        params: {
          search: search || undefined,
          category: activeCategory !== 'all' ? activeCategory : undefined,
          chain: activeChain,
          sort: sortBy,
          page: currentPage,
          limit: 20,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setNfts(res.data.nfts || []);
      setCollections(res.data.collections || []);
      setTrendingCollections(res.data.trendingCollections || []);
      setPagination(res.data.pagination || { pages: 1, total: 0 });
    } catch (err) {
      console.error('Explore fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeChain, sortBy, page]);

  useEffect(() => { fetchExplore(); }, [activeChain, sortBy, activeCategory, page]);
  useEffect(() => {
    const delay = setTimeout(() => { if (search !== undefined) fetchExplore(true); }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  // ── Step 1: Request unsigned transaction from backend ──
  const requestBuyNFT = async (listingId) => {
    setBuying(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in first');
        navigate('/auth/login');
        return;
      }

      const res = await axios.post(`${API_BASE}/nft/buy/${listingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { unsignedTransaction, transaction } = res.data;

      if (unsignedTransaction) {
        setPendingAction({
          listingId,
          unsignedTransaction,
          transactionId: transaction.id,
        });
        setShowBuyModal(false);
        setShowPasswordModal(true);
        setVaultPassword('');
        setSignError('');
      } else {
        alert('Purchase recorded! (Off-chain settlement)');
        setShowBuyModal(false);
        fetchExplore();
      }
    } catch (err) {
      console.error('Buy request error:', err);
      alert(err.response?.data?.message || 'Error preparing purchase');
    } finally {
      setBuying(false);
    }
  };

  // ── Step 2: Decrypt vault & sign transaction locally ────
  const handleSignAndBroadcast = async () => {
    if (!vaultPassword || !pendingAction) return;
    setSignError('');
    setBuying(true);

    try {
      const { unsignedTransaction, transactionId } = pendingAction;

      const token = localStorage.getItem('authToken');
      const walletRes = await axios.get(`${API_BASE}/wallets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const primaryWallet = walletRes.data.wallets?.find(w => w.blockchain === 'ethereum') || walletRes.data.wallets?.[0];
      if (!primaryWallet) throw new Error('No wallet found');

      let wallet;
      try {
        wallet = await getWalletFromVault(primaryWallet.address, vaultPassword);
      } catch (vaultErr) {
        throw new Error('Incorrect password. Please try again.');
      }

      const rpcUrl = process.env.REACT_APP_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const connectedWallet = wallet.connect(provider);

      const tx = await connectedWallet.sendTransaction({
        to: unsignedTransaction.to,
        value: unsignedTransaction.value,
        data: unsignedTransaction.data || '0x',
        gasLimit: unsignedTransaction.gasLimit || undefined,
        gasPrice: unsignedTransaction.gasPrice || undefined,
        nonce: unsignedTransaction.nonce || undefined,
        chainId: unsignedTransaction.chainId || 1,
      });

      await axios.post(`${API_BASE}/nft/broadcast`, {
        transactionId,
        txHash: tx.hash,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowPasswordModal(false);
      setPendingAction(null);
      setVaultPassword('');
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      fetchExplore();

    } catch (err) {
      console.error('Sign/broadcast error:', err);
      setSignError(err.message || 'Failed to sign transaction');
    } finally {
      setBuying(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    const num = parseFloat(price);
    return num > 0.001 ? num.toFixed(4) : num.toExponential(2);
  };

  // ── Handle modal action based on NFT type ────────────
  const handleModalAction = () => {
    if (!selectedNFT) return;

    if (selectedNFT.canBuy) {
      // Marketplace listing — initiate buy flow
      requestBuyNFT(selectedNFT.id);
    } else if (selectedNFT.openSeaUrl) {
      // External NFT — open on OpenSea
      window.open(selectedNFT.openSeaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> <span>Back</span>
        </div>
        <div className="header-center">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Explore NFTs</h2>
        </div>
        <div className="header-right" onClick={() => setShowFilters(!showFilters)} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faFilter} />
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ paddingBottom: '80px' }}>
        {/* Search Bar */}
        <div className="search-bar-gold" style={{ margin: '12px 16px' }}>
          <FontAwesomeIcon icon={faSearch} style={{ color: '#888', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search collections, NFTs..."
            className="input-gold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', flex: 1, color: '#fff' }}
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ margin: '0 16px 12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Blockchain</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'].map(chain => (
                  <button
                    key={chain}
                    onClick={() => setActiveChain(chain)}
                    style={{
                      padding: '4px 10px', borderRadius: '16px', border: 'none',
                      fontSize: '0.7rem', cursor: 'pointer',
                      background: activeChain === chain ? '#d4af37' : 'rgba(255,255,255,0.1)',
                      color: activeChain === chain ? '#000' : '#ccc',
                      fontWeight: activeChain === chain ? 600 : 400,
                    }}
                  >
                    {CHAIN_LABELS[chain] || chain}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Sort By</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'trending', label: '🔥 Trending' },
                  { key: 'createdAt', label: '🕐 Latest' },
                  { key: 'price_low', label: '💰 Price Low' },
                  { key: 'price_high', label: '💎 Price High' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    style={{
                      padding: '4px 10px', borderRadius: '16px', border: 'none',
                      fontSize: '0.7rem', cursor: 'pointer',
                      background: sortBy === s.key ? '#d4af37' : 'rgba(255,255,255,0.1)',
                      color: sortBy === s.key ? '#000' : '#ccc',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', padding: '0 16px', marginBottom: '12px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                fontSize: '0.75rem', cursor: 'pointer',
                background: activeCategory === cat ? '#d4af37' : 'rgba(255,255,255,0.08)',
                color: activeCategory === cat ? '#000' : '#aaa',
                fontWeight: activeCategory === cat ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trending Collections */}
        {trendingCollections.length > 0 && !search && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', margin: '0 16px 8px', color: '#d4af37' }}>
              <FontAwesomeIcon icon={faFire} /> Trending Collections
            </h3>
            <div style={{ display: 'flex', gap: '10px', padding: '0 16px', overflowX: 'auto' }}>
              {trendingCollections.map((col, i) => (
                <div
                  key={col.address || i}
                  onClick={() => setSearch(col.name)}
                  style={{ minWidth: '120px', textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    backgroundImage: `url(${col.image})`, backgroundSize: 'cover',
                    backgroundPosition: 'center', margin: '0 auto 6px',
                    border: '2px solid rgba(212, 175, 55, 0.5)',
                  }}></div>
                  <div style={{ fontSize: '0.7rem', color: '#eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NFT Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>Loading NFTs...</div>
        ) : nfts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            No NFTs found. Try adjusting your filters.
          </div>
        ) : (
          <div className="nft-grid-gold">
            {nfts.map((nft) => (
              <div
                className="nft-card-gold"
                key={nft.id}
                onClick={() => { setSelectedNFT(nft); setShowBuyModal(true); }}
              >
                <div
                  className="nft-img-gold"
                  style={{ backgroundImage: `url(${nft.image || `https://picsum.photos/seed/${nft.id}/200/200`})` }}
                >
                  {nft.source === 'alchemy' && (
                    <span style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: '#d4af37', color: '#000', fontSize: '0.6rem',
                      padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold',
                    }}>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="nft-info-gold">
                  <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '2px' }}>
                    {nft.collectionName || 'Unknown Collection'}
                  </div>
                  <div className="nft-title-gold">{nft.name || `#${nft.tokenId}`}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div className="nft-price-gold">
                      {nft.price ? (
                        <>
                          {nft.listingType === 'floor' && (
                            <span style={{ fontSize: '0.6rem', color: '#888', marginRight: '3px' }}>Floor</span>
                          )}
                          {formatPrice(nft.price)} {nft.currency || 'ETH'}
                        </>
                      ) : (
                        <span style={{ color: '#666', fontSize: '0.75rem' }}>Not Listed</span>
                      )}
                    </div>
                    {/* ── Action button based on NFT type ── */}
                    {nft.canBuy && nft.price && (
                      <button
                        className="btn-gold-sm"
                        onClick={(e) => { e.stopPropagation(); requestBuyNFT(nft.id); }}
                        disabled={buying}
                      >
                        Buy
                      </button>
                    )}
                    {!nft.canBuy && nft.openSeaUrl && (
                      <a
                        href={nft.openSeaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn-gold-sm"
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                        }}
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '0.6rem' }} />
                        OpenSea
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '0 16px' }}>
            <button className="btn-gold-outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </button>
            <span style={{ color: '#aaa', alignSelf: 'center', fontSize: '0.85rem' }}>
              Page {page} of {pagination.pages}
            </span>
            <button className="btn-gold-outline" disabled={page === pagination.pages} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}>
              Next
            </button>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          BUY / VIEW MODAL — Handles both marketplace & external
          ═══════════════════════════════════════════════════════ */}
      {showBuyModal && selectedNFT && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }} onClick={() => setShowBuyModal(false)}>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', padding: '20px',
            width: '90%', maxWidth: '400px', border: '1px solid #333',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#d4af37' }}>
                {selectedNFT.canBuy ? 'Purchase NFT' : 'NFT Details'}
              </h3>
              <button onClick={() => setShowBuyModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            {/* NFT Info */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <img
                src={selectedNFT.image || `https://picsum.photos/seed/${selectedNFT.id}/150/150`}
                alt={selectedNFT.name}
                style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>{selectedNFT.collectionName}</div>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px', wordBreak: 'break-word' }}>
                  {selectedNFT.name}
                </div>
                {selectedNFT.price && (
                  <div style={{ color: '#d4af37', fontSize: '1.2rem', fontWeight: 600 }}>
                    {selectedNFT.listingType === 'floor' && (
                      <span style={{ fontSize: '0.7rem', color: '#888', marginRight: '4px' }}>Floor</span>
                    )}
                    {formatPrice(selectedNFT.price)} {selectedNFT.currency || 'ETH'}
                  </div>
                )}
              </div>
            </div>

            {/* Source badge */}
            <div style={{
              background: selectedNFT.canBuy
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(56,189,248,0.1)',
              border: `1px solid ${selectedNFT.canBuy ? 'rgba(34,197,94,0.2)' : 'rgba(56,189,248,0.2)'}`,
              borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
            }}>
              <p style={{
                color: selectedNFT.canBuy ? '#4ade80' : '#38bdf8',
                fontSize: '0.75rem', margin: 0, lineHeight: 1.5,
              }}>
                {selectedNFT.canBuy ? (
                  <>✅ Listed on BlockVault Marketplace — You can purchase this NFT directly.</>
                ) : selectedNFT.openSeaUrl ? (
                  <>🔗 Sourced from blockchain — This NFT can be purchased on OpenSea.</>
                ) : (
                  <>📋 This NFT is not currently listed for sale on any marketplace.</>
                )}
              </p>
            </div>

            {/* Attributes (if any) */}
            {selectedNFT.attributes?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Attributes</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedNFT.attributes.slice(0, 6).map((attr, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px', padding: '4px 8px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.55rem', color: '#888' }}>{attr.trait_type || attr.type || '?'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ddd' }}>{attr.value || '?'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              className="btn-gold"
              style={{
                width: '100%', padding: '12px', fontSize: '1rem',
                // Override gradient for OpenSea button
                ...(selectedNFT.openSeaUrl && !selectedNFT.canBuy ? {
                  background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                } : {}),
              }}
              onClick={handleModalAction}
              disabled={buying || (!selectedNFT.canBuy && !selectedNFT.openSeaUrl)}
            >
              {selectedNFT.canBuy
                ? (buying ? 'Preparing...' : `Buy for ${formatPrice(selectedNFT.price)} ${selectedNFT.currency || 'ETH'}`)
                : selectedNFT.openSeaUrl
                  ? (<><FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginRight: '6px' }} />View on OpenSea</>)
                  : 'Not for sale'
              }
            </button>
            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
              {selectedNFT.canBuy
                ? '🔐 Non-custodial: Signed locally with your BlockVault key.'
                : 'Purchases on OpenSea are handled by their smart contracts.'
              }
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PASSWORD MODAL — Only for marketplace purchases
          ═══════════════════════════════════════════════════════ */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001,
        }}>
          <div style={{
            background: '#111', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '380px', border: '1px solid #d4af37',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(212,175,55,0.15)', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesomeIcon icon={faLock} style={{ color: '#d4af37', fontSize: 22 }} />
              </div>
              <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: 18 }}>Sign Transaction</h3>
              <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                Enter your wallet password to sign securely
              </p>
            </div>

            {pendingAction && (
              <div style={{
                background: '#1a1a1a', borderRadius: 10, padding: 14,
                marginBottom: 16, border: '1px solid #333',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#888', fontSize: 12 }}>Network</span>
                  <span style={{ color: '#fff', fontSize: 12 }}>Ethereum Mainnet</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#888', fontSize: 12 }}>Type</span>
                  <span style={{ color: '#d4af37', fontSize: 12 }}>NFT Purchase</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: 12 }}>To</span>
                  <span style={{ color: '#fff', fontSize: 12, fontFamily: 'monospace' }}>
                    {pendingAction.unsignedTransaction?.to?.slice(0, 10)}...
                  </span>
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 8, padding: '10px 12px', marginBottom: 16,
            }}>
              <p style={{ color: '#4ade80', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                <FontAwesomeIcon icon={faLock} style={{ marginRight: 6 }} />
                Your private key is decrypted locally and never leaves this device.
              </p>
            </div>

            {signError && (
              <div style={{
                background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 12,
              }}>
                <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                  {signError}
                </p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                Wallet Password
              </label>
              <input
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Enter your BlockVault password"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSignAndBroadcast(); }}
                style={{
                  width: '100%', padding: '14px 16px', background: '#1a1a1a',
                  border: '1px solid #333', borderRadius: 10, color: '#fff',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingAction(null);
                  setVaultPassword('');
                  setSignError('');
                }}
                style={{
                  flex: 1, padding: 14, background: 'transparent',
                  border: '1px solid #444', borderRadius: 10,
                  color: '#aaa', cursor: 'pointer', fontSize: 14,
                }}
              >
                Reject
              </button>
              <button
                onClick={handleSignAndBroadcast}
                disabled={buying || !vaultPassword}
                style={{
                  flex: 1, padding: 14, background: (buying || !vaultPassword) ? '#555' : '#d4af37',
                  border: 'none', borderRadius: 10,
                  color: (buying || !vaultPassword) ? '#999' : '#000',
                  cursor: (buying || !vaultPassword) ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {buying ? 'Signing...' : 'Sign & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav-gold">
        <div className="nav-item-gold" onClick={() => navigate('/app')}>
          <span>Wallet</span>
        </div>
        <div className="nav-item-gold active" onClick={() => navigate('/app/nft-market')}>
          <span>NFTs</span>
        </div>
        <div className="nav-item-gold" onClick={() => navigate('/app/staking')}>
          <span>Stake</span>
        </div>
      </nav>
    </div>
  );
};

export default NFTBrowsePage;
