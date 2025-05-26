import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

const APP_WALLET_PRIVATE_KEY = process.env.APP_WALLET_PRIVATE_KEY;
const LUKSO_RPC_URL = process.env.NEXT_PUBLIC_LUKSO_RPC_URL || 'https://rpc.testnet.lukso.network';

// Rate limiting to prevent abuse
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

const ipRequests: Record<string, { count: number, resetTime: number }> = {};

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();

  if (!ipRequests[ip] || ipRequests[ip].resetTime < now) {
    ipRequests[ip] = { count: 1, resetTime: now + RATE_LIMIT.windowMs };
  } else {
    ipRequests[ip].count++;
    if (ipRequests[ip].count > RATE_LIMIT.max) {
      return NextResponse.json({
        error: 'Too many requests, please try again later'
      }, { status: 429 });
    }
  }

  try {
    if (!APP_WALLET_PRIVATE_KEY) {
      console.error('App wallet private key not configured');
      return NextResponse.json({
        error: 'Server misconfiguration'
      }, { status: 500 });
    }

    const body = await request.json();
    const { contractAddress, methodName, args, options, abi } = body;

    if (!contractAddress || !methodName || !Array.isArray(args) || !Array.isArray(abi)) {
      return NextResponse.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(LUKSO_RPC_URL);
    const wallet = new ethers.Wallet(APP_WALLET_PRIVATE_KEY, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    const tx = await contract[methodName](...args, options || {});
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      from: wallet.address
    });
  } catch (error: any) {
    console.error('Error processing app transaction:', error);

    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, { status: 500 });
  }
}
