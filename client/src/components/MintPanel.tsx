import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther, isAddress, zeroAddress } from "viem";
import {zyncAbi} from "../abi/zync";
import type { ApiConfig } from "../types";
import { useWallet } from "../wallet/WalletContext";

function isZeroAddr(a: string) {
  return !isAddress(a) || a.toLowerCase() === zeroAddress;
}

export function MintPanel({ cfg }: { cfg: ApiConfig }) {
  const { address, walletChainId, publicClient, walletClient, chain, requestConnect } = useWallet();
  const [ethIn, setEthIn] = useState("0.01");
  const tokenAddress = cfg.zync_token_address as `0x${string}`;
  const tokenReady = !isZeroAddr(cfg.zync_token_address);
  const wrongChain = Boolean(address) && walletChainId !== undefined && walletChainId !== cfg.chain_id;

  const [mintPriceWei, setMintPriceWei] = useState<bigint | undefined>();
  const [symbol, setSymbol] = useState("ZYNC");
  const [decimals, setDecimals] = useState(18);
  const [maxSupply, setMaxSupply] = useState<bigint | undefined>();
  const [totalSupply, setTotalSupply] = useState<bigint | undefined>();
  const [balance, setBalance] = useState<bigint | undefined>();
  const [readErr, setReadErr] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const refreshReads = useCallback(async () => {
    if (!tokenReady) return;
    setReadErr(false);
    const reader = address ?? zeroAddress;
    try {
      const [p, sym, dec, max, tot, bal] = await Promise.all([
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "mintPriceWei" }),
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "symbol" }),
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "decimals" }),
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "MAX_SUPPLY" }),
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "totalSupply" }),
        publicClient.readContract({ address: tokenAddress, abi: zyncAbi, functionName: "balanceOf", args: [reader] }),
      ]);
      setMintPriceWei(p); setSymbol(sym); setDecimals(dec);
      setMaxSupply(max); setTotalSupply(tot);
      setBalance(address ? bal : undefined);
    } catch { setReadErr(true); }
  }, [tokenReady, tokenAddress, publicClient, address]);

  useEffect(() => { void refreshReads(); }, [refreshReads]);

  const estimatedTokens = useMemo(() => {
    if (!mintPriceWei || mintPriceWei === 0n) return null;
    try {
      const wei = parseEther(ethIn || "0");
      if (wei === 0n) return 0n;
      return (wei * 10n ** 18n) / mintPriceWei;
    } catch { return null; }
  }, [ethIn, mintPriceWei]);

  const canMint = tokenReady && address && walletClient && !wrongChain && estimatedTokens != null && estimatedTokens > 0n && mintPriceWei != null && mintPriceWei > 0n;

  async function onMint() {
    if (!canMint || !address) return;
    setTxError(undefined); setTxHash(undefined); setTxPending(true);
    try {
      const value = parseEther(ethIn || "0");
      const hash = await walletClient.writeContract({ address: tokenAddress, abi: zyncAbi, functionName: "mintWithEth", value, account: address, chain });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshReads();
    } catch (e) { setTxError(e instanceof Error ? e.message : "Transaction failed"); }
    finally { setTxPending(false); }
  }

  if (!tokenReady) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-[rgba(12,14,24,0.7)] p-6 backdrop-blur-xl">
        <h2 className="mb-2 text-lg font-semibold">Deploy the contract first</h2>
        <p className="mb-4 text-sm leading-relaxed text-white/55">
          Set <code className="font-mono text-[#6ee7c2]">ZYNC_TOKEN_ADDRESS</code> in <code className="font-mono text-[#6ee7c2]">.env</code> to your deployed <code className="font-mono text-[#6ee7c2]">ZyncToken</code> address, then restart the API.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 font-mono text-xs text-white/45 whitespace-pre-wrap">
          {`npm run chain\nnpm run deploy`}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[rgba(12,14,24,0.7)] p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold tracking-tight">Mint ZYNC</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/55">Send native ETH; the contract mints {symbol} at the public price.</p>
        </div>
        <div className="font-mono text-xs text-white/40 break-all sm:text-right sm:max-w-[200px]">{tokenAddress}</div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-white/45">Price</p>
          <p className="m-0 font-mono text-sm text-[#6ee7c2]">
            {mintPriceWei != null ? `${formatEther(mintPriceWei)} ETH / 1 ${symbol}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-white/45">Your balance</p>
          <p className="m-0 font-mono text-sm">
            {balance != null ? `${formatEther(balance)} ${symbol}` : address ? "—" : "Connect wallet"}
          </p>
        </div>
        {maxSupply != null && totalSupply != null && (
          <div className="col-span-full rounded-xl border border-white/[0.07] bg-black/25 p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-white/45">Supply</p>
            <p className="mb-2 font-mono text-sm">{formatEther(totalSupply)} / {formatEther(maxSupply)} {symbol}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#12b886] to-[#8b5cf6]"
                style={{ width: `${Number((totalSupply * 100n) / maxSupply)}%` }} />
            </div>
          </div>
        )}
      </div>

      <label className="mb-2 block text-xs uppercase tracking-wider text-white/45">Amount to spend (ETH)</label>
      <input value={ethIn} onChange={(e) => setEthIn(e.target.value)} placeholder="0.0" inputMode="decimal"
        className="mb-2 w-full rounded-xl border border-white/[0.08] bg-[#050a0f] px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[rgba(45,212,163,0.4)]" />
      <p className="mb-6 text-xs text-white/40">
        Estimated receive:{" "}
        <span className="font-mono text-[#6ee7c2]">
          {estimatedTokens != null ? `${formatEther(estimatedTokens)} ${symbol}` : "—"}
        </span>
      </p>

      <button type="button" disabled={txPending || (!!address && !canMint)}
        onClick={() => { if (!address) { requestConnect(); return; } void onMint(); }}
        className="w-full rounded-xl border-none bg-gradient-to-r from-[#12b886] to-[#2dd4a3] py-3.5 text-sm font-semibold text-[#050a0f] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
        {!address ? "Connect wallet to mint" : wrongChain ? "Wrong network" : txPending ? "Confirming…" : "Mint with ETH"}
      </button>

      {txError && <p className="mt-3 break-words font-mono text-xs text-red-300">{txError}</p>}
      {txHash && !txError && <p className="mt-3 font-mono text-xs text-[rgba(110,231,194,0.9)]">Confirmed · <span className="break-all">{txHash}</span></p>}
      {readErr && <p className="mt-3 text-xs text-amber-200/85">Could not read contract state. Check RPC and contract address.</p>}
    </div>
  );
}
