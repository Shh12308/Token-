import api from '../../utils/api';
import { ethers } from 'ethers';

const login = async (wallet) => {
  // 1. Get message
  const { data } = await api.post('/auth/nonce');

  // 2. Sign message
  const signature = await wallet.signMessage(data.messageToSign);

  // 3. Verify
  const res = await api.post('/auth/verify', {
    walletAddress: wallet.address,
    signature,
    message: data.messageToSign
  });

  // 4. Save token
  localStorage.setItem('authToken', res.data.token);
};
