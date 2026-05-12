import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faSearch, faFilter, faArrowLeft, faHeart, faExternalLinkAlt, faTag, faClock, faFire, faGem } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

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

  const categories = ['all', 'art', 'gaming', 'music', 'photography', 'pfp', 'collectibles'];

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

  useEffect(() => {
    fetchExplore();
  }, [activeChain, sortBy, activeCategory, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (search !== undefined) fetchExplore(true);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleBuyNFT = async (listingId) => {
    setBuying(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please connect your wallet first');
        navigate('/app/connect');
        return;
      }

      const res = await axios.post(`${API_BASE}/nft/buy/${listingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { unsignedTransaction, transaction } = res.data;

      if (unsignedTransaction && window.ethereum) {
        try {
          // Send to MetaMask for signing
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [unsignedTransaction],
          });

          // Broadcast the signed transaction
          await axios.post(`${API_BASE}/nft/broadcast`, {
            transactionId: transaction.id,
            txHash,
          }, { headers: { Authorization: `Bearer ${token}` } });

          alert(`Transaction submitted! Hash: ${txHash}`);
          setShowBuyModal(false);
          setSelectedNFT(null);
          fetchExplore();
        } catch (metaMaskErr) {
          if (metaMaskErr.code === 4001) {
            alert('Transaction rejected by user');
          } else {
            alert(`MetaMask error: ${metaMaskErr.message}`);
          }
        }
      } else if (!window.ethereum) {
        alert('Please install MetaMask to buy NFTs');
      } else {
        alert('Purchase recorded! (Off-chain settlement)');
        setShowBuyModal(false);
        fetchExplore();
      }
    } catch (err) {
      console.error('Buy error:', err);
      alert(err.response?.data?.message || 'Error purchasing NFT');
    } finally {
      setBuying(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    const num = parseFloat(price);
    return num > 0.001 ? num.toFixed(4) : num.toExponential(2);
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
                {['all', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'].map(chain => (
                  <button
                    key={chain}
                    onClick={() => setActiveChain(chain)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      background: activeChain === chain ? '#d4af37' : 'rgba(255,255,255,0.1)',
                      color: activeChain === chain ? '#000' : '#ccc',
                      fontWeight: activeChain === chain ? 600 : 400,
                    }}
                  >
                    {chain === 'all' ? 'All' : SUPPORTED_CHAINS_LABELS[chain] || chain}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
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
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
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
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '0.75rem',
                cursor: 'pointer',
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
                  style={{
                    minWidth: '120px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', backgroundImage: `url(${col.image})`, backgroundSize: 'cover', backgroundPosition: 'center', margin: '0 auto 6px', border: '2px solid rgba(212, 175, 55, 0.5)' }}></div>
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
          <div className="text-center p-4" style={{ color: '#aaa' }}>Loading NFTs...</div>
        ) : nfts.length === 0 ? (
          <div className="text-center p-4" style={{ color: '#aaa' }}>
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
                      padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' 
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
                      {nft.price ? `${formatPrice(nft.price)} ${nft.currency || 'ETH'}` : 'Not Listed'}
                    </div>
                    {nft.price && (
                      <button 
                        className="btn-gold-sm" 
                        onClick={(e) => { e.stopPropagation(); handleBuyNFT(nft.id); }}
                        disabled={buying}
                      >
                        Buy
                      </button>
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
            <button 
              className="btn-gold-outline" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ color: '#aaa', alignSelf: 'center', fontSize: '0.85rem' }}>
              Page {page} of {pagination.pages}
            </span>
            <button 
              className="btn-gold-outline" 
              disabled={page === pagination.pages} 
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Buy Modal */}
      {showBuyModal && selectedNFT && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setShowBuyModal(false)}>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', padding: '20px', 
            width: '90%', maxWidth: '400px', border: '1px solid #333'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#d4af37' }}>Purchase NFT</h3>
              <button 
                onClick={() => setShowBuyModal(false)} 
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <img 
                src={selectedNFT.image || `https://picsum.photos/seed/${selectedNFT.id}/150/150`} 
                alt={selectedNFT.name} 
                style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} 
              />
              <div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>{selectedNFT.collectionName}</div>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedNFT.name}</div>
                {selectedNFT.price && (
                  <div style={{ color: '#d4af37', fontSize: '1.2rem', marginTop: '8px' }}>
                    {formatPrice(selectedNFT.price)} {selectedNFT.currency || 'ETH'}
                  </div>
                )}
              </div>
            </div>
            <button 
              className="btn-gold" 
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              onClick={() => handleBuyNFT(selectedNFT.id)}
              disabled={buying || !selectedNFT.price}
            >
              {buying ? 'Confirming in Wallet...' : (selectedNFT.price ? `Buy for ${formatPrice(selectedNFT.price)} ${selectedNFT.currency || 'ETH'}` : 'Not for sale')}
            </button>
            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
              🔐 Non-custodial: You will sign this transaction securely via MetaMask. We never hold your funds.
            </p>
          </div>
        </div>
      )}

      <nav className="bottom-nav-gold">
        <div className="nav-item-gold" onClick={() => navigate('/app')}>
          <span>Wallet</span>
        </div>
        <div className={`nav-item-gold active`} onClick={() => navigate('/app/nft-market')}>
          <span>NFTs</span>
        </div>
        <div className="nav-item-gold" onClick={() => navigate('/app/staking')}>
          <span>Stake</span>
        </div>
      </nav>
    </div>
  );
};

const SUPPORTED_CHAINS_LABELS = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BSC',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  base: 'Base',
};

export default NFTBrowsePage;
