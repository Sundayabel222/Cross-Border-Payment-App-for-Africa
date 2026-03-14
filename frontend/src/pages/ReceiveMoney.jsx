import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCheck, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ReceiveMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      api.get('/wallet/balance').then(r => setWalletAddress(r.data.public_key)).catch(() => {});
    }
  }, [walletAddress]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAddress = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'My AfriPay Wallet', text: walletAddress });
    } else {
      copyAddress();
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-6 flex items-center gap-1">
        <ArrowLeft size={18} /> Back
      </button>

      <h2 className="text-2xl font-bold text-white mb-2">Receive Money</h2>
      <p className="text-gray-400 text-sm mb-8">Share your wallet address or QR code to receive payments</p>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-6 flex items-center justify-center mb-6 mx-auto w-fit">
        {walletAddress ? (
          <QRCodeSVG value={walletAddress} size={200} level="H" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Address display */}
      <div className="bg-gray-900 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 mb-2">Your Stellar Wallet Address</p>
        <p className="text-white font-mono text-sm break-all leading-relaxed">{walletAddress}</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={copyAddress}
          className="bg-gray-800 hover:bg-gray-700 rounded-xl py-3.5 flex items-center justify-center gap-2 text-white font-medium transition-colors"
        >
          {copied ? <CheckCheck size={18} className="text-primary-500" /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
        <button
          onClick={shareAddress}
          className="bg-primary-500 hover:bg-primary-600 rounded-xl py-3.5 flex items-center justify-center gap-2 text-white font-medium transition-colors"
        >
          <Share2 size={18} /> Share
        </button>
      </div>

      <p className="text-center text-gray-600 text-xs mt-6">
        Only send XLM or Stellar-based assets to this address
      </p>
    </div>
  );
}
