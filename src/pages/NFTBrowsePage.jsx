import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import {
  faSearch, faFilter, faArrowLeft, faHeart, faExternalLinkAlt,
  faTag, faClock, faFire, faGem, faLock, faExclamationTriangle,
  faPlus, faTimes, faImage, faCamera, faLayerGroup, faWandMagicSparkles,
  faChevronDown, faChevronUp, faCheck, faUpload, faSpinner, faCube,
  faPalette, faMusic, faGamepad, faCameraRetro, faUser, faPercent,
  faLink, faFileAlt, faCopy, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getWalletFromVault } from '../utils/Keymanager';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CHAIN_LABELS = {
  ethereum: 'Ethereum', polygon: 'Polygon', bsc: 'BSC',
  arbitrum: 'Arbitrum', optimism: 'Optimism', base: 'Base',
};

const CHAIN_ICONS = {
  ethereum: '⟠', polygon: '⬡', bsc: '🔶', arbitrum: '🔵', optimism: '🔴', base: '⬛',
};

const CHAIN_COLORS = {
  ethereum: '#627EEA', polygon: '#8247E5', bsc: '#F3BA2F',
  arbitrum: '#28A0F0', optimism: '#FF0420', base: '#0052FF',
};

const CATEGORIES = [
  { id: 'art', label: 'Art', icon: faPalette },
  { id: 'gaming', label: 'Gaming', icon: faGamepad },
  { id: 'music', label: 'Music', icon: faMusic },
  { id: 'photography', label: 'Photography', icon: faCameraRetro },
  { id: 'pfp', label: 'PFP', icon: faUser },
  { id: 'collectibles', label: 'Collectibles', icon: faGem },
];

// ── Attribute Row Component ──────────────────────────────
const AttributeRow = ({ attr, index, onUpdate, onRemove }) => (
  <div style={{
    display: 'flex', gap: '8px', alignItems: 'center',
    background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
    padding: '8px 10px', marginBottom: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <input
      type="text"
      placeholder="Type (e.g. Background)"
      value={attr.trait_type}
      onChange={(e) => onUpdate(index, 'trait_type', e.target.value)}
      style={{
        flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '0.8rem', outline: 'none',
      }}
    />
    <input
      type="text"
      placeholder="Value (e.g. Blue)"
      value={attr.value}
      onChange={(e) => onUpdate(index, 'value', e.target.value)}
      style={{
        flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
        color: '#fff', fontSize: '0.8rem', outline: 'none',
      }}
    />
    <button
      onClick={() => onRemove(index)}
      style={{
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '8px', padding: '8px 10px', color: '#ef4444',
        cursor: 'pointer', fontSize: '0.8rem',
      }}
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
);

// ── Create Collection Modal ──────────────────────────────
const CreateCollectionModal = ({ onClose, onSuccess, showPasswordModal, setShowPasswordModal, setPendingAction }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    blockchain: 'ethereum',
    contractType: 'ERC721',
    maxSupply: '',
    mintPrice: '',
    mintPriceCurrency: 'ETH',
    royaltyBps: 0,
    categories: [],
    links: { website: '', twitter: '', discord: '' },
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Image must be under 50MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (catId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId],
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) return 'Collection name is required';
      if (!imageFile) return 'Collection image is required';
      return null;
    }
    if (step === 2) {
      if (!formData.description.trim()) return 'Description is required';
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Please log in first');

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('symbol', formData.symbol || formData.name.toUpperCase().slice(0, 8));
      formPayload.append('description', formData.description);
      formPayload.append('blockchain', formData.blockchain);
      formPayload.append('contractType', formData.contractType);
      if (formData.maxSupply) formPayload.append('maxSupply', formData.maxSupply);
      if (formData.mintPrice) formPayload.append('mintPrice', formData.mintPrice);
      formPayload.append('mintPriceCurrency', formData.mintPriceCurrency);
      formPayload.append('royaltyBps', formData.royaltyBps);
      formPayload.append('categories', JSON.stringify(formData.categories));
      formPayload.append('links', JSON.stringify(formData.links));
      if (imageFile) formPayload.append('image', imageFile);
      if (bannerFile) formPayload.append('banner', bannerFile);

      const res = await axios.post(`${API_BASE}/nft/collections`, formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.collection) {
        onSuccess(res.data.collection);
      }
    } catch (err) {
      console.error('Create collection error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 1002, overflowY: 'auto', padding: '20px',
    }} onClick={onClose}>
      <div
        style={{
          background: '#0f0f0f', borderRadius: '20px', width: '100%', maxWidth: '560px',
          border: '1px solid #222', margin: '20px auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>
              <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#d4af37', marginRight: '10px' }} />
              Create Collection
            </h2>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.8rem' }}>
              Step {step} of 3 — {['Basic Info', 'Details', 'Blockchain & Royalties'][step - 1]}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '0 24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '4px', height: '3px', background: '#1a1a1a', borderRadius: '4px' }}>
            {[1, 2, 3].map(s => (
              <div
                key={s}
                style={{
                  flex: 1, borderRadius: '4px',
                  background: step >= s ? '#d4af37' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              {/* Logo Upload */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: '120px', height: '120px', borderRadius: '20px',
                    margin: '0 auto 12px', cursor: 'pointer', position: 'relative',
                    background: imagePreview ? 'transparent' : 'rgba(255,255,255,0.03)',
                    border: `2px dashed ${imagePreview ? '#d4af37' : '#333'}`,
                    overflow: 'hidden',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Collection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
                      <FontAwesomeIcon icon={faCamera} size="2x" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.7rem' }}>Upload Logo</span>
                    </div>
                  )}
                  {imagePreview && (
                    <div style={{
                      position: 'absolute', bottom: '4px', right: '4px',
                      background: '#d4af37', borderRadius: '50%', width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FontAwesomeIcon icon={faCheck} style={{ color: '#000', fontSize: '0.6rem' }} />
                    </div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                <p style={{ color: '#555', fontSize: '0.7rem', margin: 0 }}>
                  JPG, PNG, GIF, WEBP. Max 50MB.
                </p>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cool Cats"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222', borderRadius: '12px', color: '#fff',
                    fontSize: '0.95rem', outline: 'none',
                  }}
                />
              </div>

              {/* Symbol */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Symbol <span style={{ color: '#444' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. COOL"
                  value={formData.symbol}
                  onChange={(e) => updateForm('symbol', e.target.value.toUpperCase())}
                  maxLength={10}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222', borderRadius: '12px', color: '#fff',
                    fontSize: '0.95rem', outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div>
              {/* Banner Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Banner Image <span style={{ color: '#444' }}>(optional)</span>
                </label>
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  style={{
                    width: '100%', height: '140px', borderRadius: '14px', cursor: 'pointer',
                    background: bannerPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
                    border: `2px dashed ${bannerPreview ? '#d4af37' : '#222'}`,
                    overflow: 'hidden',
                  }}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' }}>
                      <FontAwesomeIcon icon={faImage} size="2x" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.75rem' }}>Upload Banner (Recommended: 1500x500)</span>
                    </div>
                  )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Description *
                </label>
                <textarea
                  placeholder="Tell collectors about your collection..."
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222', borderRadius: '12px', color: '#fff',
                    fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <p style={{ color: '#444', fontSize: '0.7rem', margin: '4px 0 0', textAlign: 'right' }}>
                  {formData.description.length}/1000
                </p>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Categories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '20px', border: 'none',
                        fontSize: '0.8rem', cursor: 'pointer',
                        background: formData.categories.includes(cat.id) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)',
                        color: formData.categories.includes(cat.id) ? '#d4af37' : '#888',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderColor: formData.categories.includes(cat.id) ? '#d4af37' : 'transparent',
                      }}
                    >
                      <FontAwesomeIcon icon={cat.icon} style={{ fontSize: '0.7rem' }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Social Links <span style={{ color: '#444' }}>(optional)</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'website', placeholder: 'https://yoursite.com', icon: faLink },
                    { key: 'twitter', placeholder: '@yourhandle', icon: faUser },
                    { key: 'discord', placeholder: 'Discord invite link', icon: faUser },
                  ].map(link => (
                    <div key={link.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FontAwesomeIcon icon={link.icon} style={{ color: '#555', fontSize: '0.85rem', width: '16px' }} />
                      <input
                        type="text"
                        placeholder={link.placeholder}
                        value={formData.links[link.key]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          links: { ...prev.links, [link.key]: e.target.value },
                        }))}
                        style={{
                          flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid #222', borderRadius: '10px', color: '#fff',
                          fontSize: '0.85rem', outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Blockchain & Royalties */}
          {step === 3 && (
            <div>
              {/* Blockchain */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Blockchain
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.entries(CHAIN_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateForm('blockchain', key)}
                      style={{
                        padding: '14px 10px', borderRadius: '12px', border: 'none',
                        cursor: 'pointer', textAlign: 'center',
                        background: formData.blockchain === key
                          ? `${CHAIN_COLORS[key]}20`
                          : 'rgba(255,255,255,0.03)',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderColor: formData.blockchain === key ? CHAIN_COLORS[key] : 'transparent',
                      }}
                    >
                      <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{CHAIN_ICONS[key]}</div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: formData.blockchain === key ? '#fff' : '#888',
                      }}>
                        {label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>
                  Token Type
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['ERC721', 'ERC1155'].map(type => (
                    <button
                      key={type}
                      onClick={() => updateForm('contractType', type)}
                      style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        cursor: 'pointer', textAlign: 'center',
                        background: formData.contractType === type
                          ? 'rgba(212,175,55,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderColor: formData.contractType === type ? '#d4af37' : 'transparent',
                      }}
                    >
                      <div style={{ color: formData.contractType === type ? '#d4af37' : '#888', fontSize: '0.9rem', fontWeight: 600 }}>
                        {type}
                      </div>
                      <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '2px' }}>
                        {type === 'ERC721' ? 'Unique items' : 'Multiple editions'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Supply */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Max Supply <span style={{ color: '#444' }}>(leave empty for unlimited)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={formData.maxSupply}
                  onChange={(e) => updateForm('maxSupply', e.target.value)}
                  min={1}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #222', borderRadius: '12px', color: '#fff',
                    fontSize: '0.95rem', outline: 'none',
                  }}
                />
              </div>

              {/* Mint Price */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Mint Price <span style={{ color: '#444' }}>(0 = free mint)</span>
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.mintPrice}
                    onChange={(e) => updateForm('mintPrice', e.target.value)}
                    step="0.001"
                    min={0}
                    style={{
                      flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #222', borderRadius: '12px', color: '#fff',
                      fontSize: '0.95rem', outline: 'none',
                    }}
                  />
                  <select
                    value={formData.mintPriceCurrency}
                    onChange={(e) => updateForm('mintPriceCurrency', e.target.value)}
                    style={{
                      padding: '14px 16px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #222', borderRadius: '12px', color: '#fff',
                      fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="ETH">ETH</option>
                    <option value="MATIC">MATIC</option>
                    <option value="BNB">BNB</option>
                  </select>
                </div>
              </div>

              {/* Royalty */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
                  Creator Royalty
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={formData.royaltyBps / 100}
                    onChange={(e) => updateForm('royaltyBps', parseFloat(e.target.value) * 100)}
                    style={{ flex: 1, accentColor: '#d4af37' }}
                  />
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                    padding: '10px 16px', minWidth: '80px', textAlign: 'center',
                  }}>
                    <span style={{ color: '#d4af37', fontSize: '1.1rem', fontWeight: 600 }}>
                      {formData.royaltyBps / 100}%
                    </span>
                  </div>
                </div>
                <p style={{ color: '#444', fontSize: '0.7rem', margin: '6px 0 0' }}>
                  <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '4px' }} />
                  Earn {formData.royaltyBps / 100}% on every secondary sale
                </p>
              </div>

              {/* Summary */}
              <div style={{
                background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '12px', padding: '16px', marginBottom: '8px',
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#d4af37', fontSize: '0.85rem' }}>
                  Collection Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['Name', formData.name],
                    ['Symbol', formData.symbol || 'Auto-generated'],
                    ['Blockchain', CHAIN_LABELS[formData.blockchain]],
                    ['Type', formData.contractType],
                    ['Supply', formData.maxSupply || 'Unlimited'],
                    ['Mint Price', formData.mintPrice ? `${formData.mintPrice} ${formData.mintPriceCurrency}` : 'Free'],
                    ['Royalty', `${formData.royaltyBps / 100}%`],
                    ['Categories', formData.categories.join(', ') || 'None'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span style={{ color: '#666', fontSize: '0.7rem' }}>{label}</span>
                      <div style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-word' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '12px', marginBottom: '16px',
            }}>
              <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '6px' }} />
                {error}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1, padding: '14px', background: 'transparent',
                  border: '1px solid #333', borderRadius: '12px',
                  color: '#aaa', cursor: 'pointer', fontSize: '0.95rem',
                }}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  flex: 1, padding: '14px', background: '#d4af37',
                  border: 'none', borderRadius: '12px',
                  color: '#000', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
                }}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 1, padding: '14px',
                  background: creating ? '#555' : 'linear-gradient(135deg, #d4af37, #f4d03f)',
                  border: 'none', borderRadius: '12px',
                  color: creating ? '#999' : '#000',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {creating ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWandMagicSparkles} />
                    Create Collection
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Create NFT Modal ─────────────────────────────────────
const CreateNFTModal = ({ collection, onClose, onSuccess, showPasswordModal, setShowPasswordModal, setPendingAction }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    attributes: [],
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [animationFile, setAnimationFile] = useState(null);
  const [animationPreview, setAnimationPreview] = useState(null);
  const [showAttributes, setShowAttributes] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [mintedNFT, setMintedNFT] = useState(null);
  const imageInputRef = useRef(null);
  const animationInputRef = useRef(null);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('File must be under 100MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAnimationChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimationFile(file);
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        setAnimationPreview(URL.createObjectURL(file));
      }
    }
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }],
    }));
  };

  const updateAttribute = (index, key, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [key]: value } : attr
      ),
    }));
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleMint = async () => {
    if (!formData.name.trim()) { setError('NFT name is required'); return; }
    if (!imageFile) { setError('Image is required'); return; }

    setMinting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Please log in first');

      const formPayload = new FormData();
      formPayload.append('collectionId', collection.id);
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('attributes', JSON.stringify(formData.attributes));
      if (imageFile) formPayload.append('image', imageFile);
      if (animationFile) formPayload.append('animation', animationFile);

      const res = await axios.post(`${API_BASE}/nft/mint`, formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { nft, unsignedTransaction } = res.data;

      if (unsignedTransaction) {
        // Need to sign on-chain transaction
        setPendingAction({
          type: 'mint',
          nftId: nft.id,
          unsignedTransaction,
          nftName: nft.name,
        });
        setShowPasswordModal(true);
        setMintedNFT(nft);
      } else {
        // Off-chain mint complete
        setMintedNFT(nft);
        onSuccess(nft);
      }
    } catch (err) {
      console.error('Mint error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mint NFT');
    } finally {
      setMinting(false);
    }
  };

  // Show success state
  if (mintedNFT) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1002,
      }}>
        <div style={{
          background: '#0f0f0f', borderRadius: '20px', padding: '32px',
          width: '90%', maxWidth: '400px', textAlign: 'center',
          border: '1px solid rgba(34,197,94,0.3)',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: '#22c55e', fontSize: '2rem' }} />
          </div>
          <h3 style={{ color: '#fff', margin: '0 0 8px' }}>NFT Created!</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 20px' }}>
            Your NFT has been minted successfully
          </p>
          <div style={{
            borderRadius: '14px', overflow: 'hidden', marginBottom: '16px',
            border: '1px solid #222',
          }}>
            <img
              src={mintedNFT.image || imagePreview}
              alt={mintedNFT.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ color: '#888', fontSize: '0.75rem' }}>{collection.name}</div>
              <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{mintedNFT.name}</div>
            </div>
          </div>
          <button
            onClick={() => { onClose(); onSuccess(mintedNFT); }}
            style={{
              width: '100%', padding: '14px', background: '#d4af37',
              border: 'none', borderRadius: '12px', color: '#000',
              cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 1002, overflowY: 'auto', padding: '20px',
    }} onClick={onClose}>
      <div
        style={{
          background: '#0f0f0f', borderRadius: '20px', width: '100%', maxWidth: '520px',
          border: '1px solid #222', margin: '20px auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: '#d4af37', marginRight: '10px' }} />
            Mint NFT
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.4rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Collection Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            padding: '10px 14px', marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {collection.image && (
              <img src={collection.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ color: '#888', fontSize: '0.7rem' }}>Minting to</div>
              <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{collection.name}</div>
            </div>
          </div>

          {/* Image Upload */}
          <div
            onClick={() => imageInputRef.current?.click()}
            style={{
              width: '100%', height: '240px', borderRadius: '16px', cursor: 'pointer',
              background: imagePreview ? 'transparent' : 'rgba(255,255,255,0.02)',
              border: `2px dashed ${imagePreview ? '#d4af37' : '#222'}`,
              overflow: 'hidden', marginBottom: '20px', position: 'relative',
            }}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="NFT" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {animationPreview && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
                    padding: '4px 10px', color: '#fff', fontSize: '0.7rem',
                  }}>
                    <FontAwesomeIcon icon={faPlay} style={{ marginRight: '4px' }} />
                    Has animation
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444' }}>
                <FontAwesomeIcon icon={faUpload} size="2x" style={{ marginBottom: '12px' }} />
                <span style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Upload your NFT</span>
                <span style={{ fontSize: '0.7rem' }}>JPG, PNG, GIF, WEBP, MP4, GLB. Max 100MB</span>
              </div>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*,video/mp4,video/webm,model/gltf+json,model/gltf-binary" onChange={handleImageChange} style={{ display: 'none' }} />

          {/* Animation Upload */}
          {imagePreview && !animationFile && (
            <button
              onClick={() => animationInputRef.current?.click()}
              style={{
                width: '100%', padding: '12px', marginBottom: '20px',
                background: 'rgba(255,255,255,0.03)', border: '1px dashed #222',
                borderRadius: '10px', color: '#666', cursor: 'pointer',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <FontAwesomeIcon icon={faFilm} />
              Add Animation (Video/Audio/3D)
            </button>
          )}
          <input ref={animationInputRef} type="file" accept="video/*,audio/*,model/*" onChange={handleAnimationChange} style={{ display: 'none' }} />

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
              Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Cool Cat #123"
              value={formData.name}
              onChange={(e) => updateForm('name', e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid #222', borderRadius: '12px', color: '#fff',
                fontSize: '0.95rem', outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              placeholder="Tell the story behind this NFT..."
              value={formData.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid #222', borderRadius: '12px', color: '#fff',
                fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Attributes Toggle */}
          <button
            onClick={() => setShowAttributes(!showAttributes)}
            style={{
              width: '100%', padding: '14px', marginBottom: '12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid #222',
              borderRadius: '12px', color: '#ccc', cursor: 'pointer',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>
              <FontAwesomeIcon icon={faCube} style={{ marginRight: '8px', color: '#d4af37' }} />
              Properties ({formData.attributes.length})
            </span>
            <FontAwesomeIcon icon={showAttributes ? faChevronUp : faChevronDown} />
          </button>

          {/* Attributes Section */}
          {showAttributes && (
            <div style={{ marginBottom: '16px' }}>
              {formData.attributes.map((attr, index) => (
                <AttributeRow
                  key={index}
                  attr={attr}
                  index={index}
                  onUpdate={updateAttribute}
                  onRemove={removeAttribute}
                />
              ))}
              <button
                onClick={addAttribute}
                style={{
                  width: '100%', padding: '12px',
                  background: 'rgba(212,175,55,0.08)', border: '1px dashed rgba(212,175,55,0.3)',
                  borderRadius: '10px', color: '#d4af37', cursor: 'pointer',
                  fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Property
              </button>
            </div>
          )}

          {/* Preview Attributes */}
          {!showAttributes && formData.attributes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {formData.attributes.filter(a => a.trait_type && a.value).map((attr, i) => (
                <div key={i} style={{
                  background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: '8px', padding: '4px 10px',
                }}>
                  <span style={{ color: '#888', fontSize: '0.65rem' }}>{attr.trait_type}</span>
                  <span style={{ color: '#d4af37', fontSize: '0.75rem', marginLeft: '6px' }}>{attr.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '12px', marginBottom: '16px',
            }}>
              <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '6px' }} />
                {error}
              </p>
            </div>
          )}

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={minting}
            style={{
              width: '100%', padding: '16px',
              background: minting ? '#555' : 'linear-gradient(135deg, #d4af37, #f4d03f)',
              border: 'none', borderRadius: '12px',
              color: minting ? '#999' : '#000',
              cursor: minting ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {minting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Minting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                Create NFT
              </>
            )}
          </button>

          <p style={{ color: '#444', fontSize: '0.7rem', textAlign: 'center', marginTop: '12px' }}>
            Your NFT will be stored on the {CHAIN_LABELS[collection.blockchain] || 'selected'} blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

// ── My Collections Panel ─────────────────────────────────
const MyCollectionsPanel = ({ onSelectCollection, onNavigateToExplore }) => (
  <div style={{ padding: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>My Collections</h3>
      <button
        onClick={onNavigateToExplore}
        style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.8rem' }}
      >
        ← Back to Explore
      </button>
    </div>
    <EmptyCollectionsState onCreateClick={onNavigateToExplore} />
  </div>
);

const EmptyCollectionsState = ({ onCreateClick }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <div style={{
      width: '80px', height: '80px', borderRadius: '50%',
      background: 'rgba(212,175,55,0.1)', margin: '0 auto 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#d4af37', fontSize: '1.8rem' }} />
    </div>
    <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem' }}>Create Your First Collection</h3>
    <p style={{ color: '#666', margin: '0 0 24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
      Collections organize your NFTs. Create one to start minting your own unique digital assets on the blockchain.
    </p>
    <button
      onClick={onCreateClick}
      style={{
        padding: '14px 32px', background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
        border: 'none', borderRadius: '12px', color: '#000',
        cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: '8px',
      }}
    >
      <FontAwesomeIcon icon={faPlus} />
      Create Collection
    </button>
  </div>
);

// ── Main NFTBrowsePage Component ─────────────────────────
const NFTBrowsePage = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
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

  // Create NFT state
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'create'
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateNFT, setShowCreateNFT] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  // Signing state
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

  // ── Fetch My Collections ────────────────────────────
  const fetchMyCollections = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/nft/collections`, {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyCollections(res.data.collections || []);
    } catch (err) {
      console.error('My collections error:', err);
    }
  }, []);

  useEffect(() => { fetchExplore(); }, [activeChain, sortBy, activeCategory, page]);
  useEffect(() => {
    const delay = setTimeout(() => { if (search !== undefined) fetchExplore(true); }, 500);
    return () => clearTimeout(delay);
  }, [search]);
  useEffect(() => {
    if (activeTab === 'create') fetchMyCollections();
  }, [activeTab, fetchMyCollections]);

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
      const { unsignedTransaction, transactionId, type } = pendingAction;

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

      // Broadcast to appropriate endpoint
      if (type === 'mint') {
        await axios.post(`${API_BASE}/nft/broadcast`, {
          transactionId: pendingAction.nftId,
          txHash: tx.hash,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE}/nft/broadcast`, {
          transactionId,
          txHash: tx.hash,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }

      setShowPasswordModal(false);
      setPendingAction(null);
      setVaultPassword('');
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      fetchExplore();
      fetchMyCollections();

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
      requestBuyNFT(selectedNFT.id);
    } else if (selectedNFT.openSeaUrl) {
      window.open(selectedNFT.openSeaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Collection created handler ──────────────────────
  const handleCollectionCreated = (collection) => {
    setShowCreateCollection(false);
    setSelectedCollection(collection);
    setShowCreateNFT(true);
    fetchMyCollections();
  };

  // ── NFT minted handler ──────────────────────────────
  const handleNFTCreated = (nft) => {
    setShowCreateNFT(false);
    setSelectedCollection(null);
    fetchMyCollections();
    fetchExplore();
  };

  // ── Select collection to mint into ──────────────────
  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    setShowCreateNFT(true);
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> <span>Back</span>
        </div>
        <div className="header-center">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>NFT Marketplace</h2>
        </div>
        <div className="header-right" onClick={() => setShowFilters(!showFilters)} style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon icon={activeTab === 'create' ? faPlus : faFilter} />
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ paddingBottom: '80px' }}>
        {/* Tab Switcher */}
        <div style={{
          display: 'flex', margin: '16px 16px 0', background: 'rgba(255,255,255,0.03)',
          borderRadius: '14px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={() => setActiveTab('explore')}
            style={{
              flex: 1, padding: '12px', borderRadius: '11px', border: 'none',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
              background: activeTab === 'explore' ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: activeTab === 'explore' ? '#d4af37' : '#666',
              transition: 'all 0.2s',
            }}
          >
            <FontAwesomeIcon icon={faSearch} style={{ marginRight: '6px' }} />
            Explore
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1, padding: '12px', borderRadius: '11px', border: 'none',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
              background: activeTab === 'create' ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: activeTab === 'create' ? '#d4af37' : '#666',
              transition: 'all 0.2s',
            }}
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: '6px' }} />
            Create
          </button>
        </div>

        {/* ═══ EXPLORE TAB ═══ */}
        {activeTab === 'explore' && (
          <>
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
          </>
        )}

        {/* ═══ CREATE TAB ═══ */}
        {activeTab === 'create' && (
          <div style={{ padding: '16px' }}>
            {/* Create Options */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '1rem' }}>
                What would you like to create?
              </h3>

              {/* Create Collection Card */}
              <div
                onClick={() => setShowCreateCollection(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(244,208,63,0.04))',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: '16px', padding: '20px', marginBottom: '12px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'rgba(212,175,55,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#d4af37', fontSize: '1.4rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1rem' }}>Create Collection</h4>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Organize your NFTs into a collection with custom branding, royalties, and more.
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown} style={{ color: '#555' }} />
                </div>
              </div>

              {/* Mint Single NFT Card */}
              <div
                onClick={() => {
                  if (myCollections.length === 0) {
                    setShowCreateCollection(true);
                  } else if (myCollections.length === 1) {
                    handleSelectCollection(myCollections[0]);
                  }
                  // If multiple collections, show selection below
                }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '20px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'rgba(139,92,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={faGem} style={{ color: '#8b5cf6', fontSize: '1.4rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1rem' }}>Mint NFT</h4>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {myCollections.length === 0
                        ? 'Create a collection first to start minting NFTs.'
                        : `Mint into one of your ${myCollections.length} collection${myCollections.length > 1 ? 's' : ''}.`
                      }
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronDown} style={{ color: '#555' }} />
                </div>
              </div>
            </div>

            {/* My Collections List */}
            {myCollections.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>My Collections</h3>
                  <button
                    onClick={() => setShowCreateCollection(true)}
                    style={{
                      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: '8px', padding: '6px 12px', color: '#d4af37',
                      cursor: 'pointer', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.65rem' }} />
                    New
                  </button>
                </div>

                {myCollections.map(col => (
                  <div
                    key={col.id}
                    onClick={() => handleSelectCollection(col)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', padding: '14px', marginBottom: '8px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {col.image ? (
                      <img src={col.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px',
                        background: 'rgba(212,175,55,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#d4af37' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {col.name}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: '0.75rem' }}>
                          {CHAIN_ICONS[col.blockchain]} {CHAIN_LABELS[col.blockchain] || col.blockchain}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.75rem' }}>
                          {col.totalSupply || 0} items
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCollection(col);
                      }}
                      style={{
                        padding: '8px 14px', background: '#d4af37', border: 'none',
                        borderRadius: '8px', color: '#000', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 600,
                      }}
                    >
                      Mint
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {myCollections.length === 0 && (
              <EmptyCollectionsState onCreateClick={() => setShowCreateCollection(true)} />
            )}

            {/* Info Box */}
            <div style={{
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)',
              borderRadius: '12px', padding: '16px', marginTop: '24px',
            }}>
              <h4 style={{ margin: '0 0 8px', color: '#d4af37', fontSize: '0.85rem' }}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px' }} />
                About BlockVault NFTs
              </h4>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#888', fontSize: '0.8rem', lineHeight: 1.8 }}>
                <li>NFTs are minted on-chain and stored permanently on the blockchain</li>
                <li>Metadata and images are stored on IPFS/S3 for durability</li>
                <li>Set creator royalties to earn on secondary sales</li>
                <li>Your private keys never leave your device (non-custodial)</li>
                <li>List your NFTs on our marketplace or transfer to any wallet</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          CREATE COLLECTION MODAL
          ═══════════════════════════════════════════════════════ */}
      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onSuccess={handleCollectionCreated}
          showPasswordModal={showPasswordModal}
          setShowPasswordModal={setShowPasswordModal}
          setPendingAction={setPendingAction}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          CREATE NFT MODAL
          ═══════════════════════════════════════════════════════ */}
      {showCreateNFT && selectedCollection && (
        <CreateNFTModal
          collection={selectedCollection}
          onClose={() => { setShowCreateNFT(false); setSelectedCollection(null); }}
          onSuccess={handleNFTCreated}
          showPasswordModal={showPasswordModal}
          setShowPasswordModal={setShowPasswordModal}
          setPendingAction={setPendingAction}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          BUY / VIEW MODAL
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#d4af37' }}>
                {selectedNFT.canBuy ? 'Purchase NFT' : 'NFT Details'}
              </h3>
              <button onClick={() => setShowBuyModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

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

            <button
              className="btn-gold"
              style={{
                width: '100%', padding: '12px', fontSize: '1rem',
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
          PASSWORD MODAL
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
              <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: 18 }}>
                {pendingAction?.type === 'mint' ? 'Confirm Mint' : 'Sign Transaction'}
              </h3>
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
                  <span style={{ color: '#d4af37', fontSize: 12 }}>
                    {pendingAction.type === 'mint' ? 'NFT Mint' : 'NFT Purchase'}
                  </span>
                </div>
                {pendingAction.nftName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#888', fontSize: 12 }}>NFT</span>
                    <span style={{ color: '#fff', fontSize: 12 }}>{pendingAction.nftName}</span>
                  </div>
                )}
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
