"use client";

export function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Documentation</h1>
      
      <section className="mb-8 rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">Getting Started</h2>
        <p className="mb-4 text-white/70">
          Welcome to ZyncSwap, a decentralized exchange platform built on the Zync network. Get started in minutes with our simple, secure trading platform.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-white/70">
          <li>Connect your wallet to start trading (MetaMask, WalletConnect, Coinbase Wallet supported)</li>
          <li>Swap tokens instantly with low fees and fast execution</li>
          <li>View real-time market data, charts, and price movements</li>
          <li>Trade with limit orders and advanced order types</li>
          <li>Track your portfolio and trading history</li>
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">Features</h2>
        <div className="space-y-4 text-white/70">
          <div>
            <h3 className="mb-2 font-medium text-white/90">Instant Swap</h3>
            <p>Exchange tokens instantly at the best available rates. Our smart routing algorithm finds the optimal path across multiple liquidity pools to ensure you get the best price with minimal slippage.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Live Markets</h3>
            <p>Browse all available trading pairs with real-time prices, 24h volume, and price changes. Filter by favorites and sort by various metrics to find the best trading opportunities.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Advanced Trading</h3>
            <p>Professional trading interface with TradingView charts, order books, and advanced order types. Set limit orders, stop losses, and take profit levels for sophisticated trading strategies.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Low Fees</h3>
            <p>Enjoy competitive trading fees starting at 0.3% with no hidden costs. Gas fees are optimized for the Zync network, ensuring cost-effective trading.</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">How to Trade</h2>
        <div className="space-y-4 text-white/70">
          <div>
            <h3 className="mb-2 font-medium text-white/90">Step 1: Connect Your Wallet</h3>
            <p>Click the "Connect Wallet" button in the top right corner and select your preferred wallet provider. Make sure you're connected to the Zync network.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Step 2: Select Trading Pair</h3>
            <p>Choose the tokens you want to trade from the dropdown menus. You can search by token name or symbol.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Step 3: Enter Amount</h3>
            <p>Enter the amount you want to trade. The interface will automatically calculate the expected output amount and show you the exchange rate.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Step 4: Review & Confirm</h3>
            <p>Review the transaction details including fees, slippage tolerance, and minimum received amount. Click "Swap" and confirm the transaction in your wallet.</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">Security</h2>
        <div className="space-y-3 text-white/70">
          <p>Your security is our top priority. ZyncSwap implements multiple layers of protection:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong className="text-white/90">Non-Custodial:</strong> You maintain full control of your funds at all times. We never have access to your private keys.</li>
            <li><strong className="text-white/90">Audited Smart Contracts:</strong> Our contracts have been audited by leading security firms to ensure safety and reliability.</li>
            <li><strong className="text-white/90">No KYC Required:</strong> Trade anonymously without providing personal information.</li>
            <li><strong className="text-white/90">Encrypted Connections:</strong> All communications are encrypted using industry-standard protocols.</li>
            <li><strong className="text-white/90">Multi-Chain Support:</strong> Seamlessly trade across multiple blockchain networks.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">Supported Tokens</h2>
        <p className="mb-4 text-white/70">
          ZyncSwap supports a wide range of popular cryptocurrencies including:
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm text-white/70 md:grid-cols-3">
          <div>• Bitcoin (BTC)</div>
          <div>• Ethereum (ETH)</div>
          <div>• Solana (SOL)</div>
          <div>• BNB</div>
          <div>• XRP</div>
          <div>• Cardano (ADA)</div>
          <div>• Avalanche (AVAX)</div>
          <div>• Polygon (MATIC)</div>
          <div>• Chainlink (LINK)</div>
          <div>• Uniswap (UNI)</div>
          <div>• USDT</div>
          <div>• USDC</div>
        </div>
        <p className="mt-4 text-sm text-white/50">And many more tokens are continuously being added.</p>
      </section>

      <section className="rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.5)] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#00d9c0]">FAQ</h2>
        <div className="space-y-4 text-white/70">
          <div>
            <h3 className="mb-2 font-medium text-white/90">What are the trading fees?</h3>
            <p>Trading fees start at 0.3% per transaction. There are no deposit or withdrawal fees.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">What is slippage?</h3>
            <p>Slippage is the difference between the expected price and the actual execution price. You can adjust slippage tolerance in the settings.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">How long do transactions take?</h3>
            <p>Most transactions complete within seconds on the Zync network. Actual time may vary based on network congestion.</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white/90">Can I cancel a transaction?</h3>
            <p>Once a transaction is submitted to the blockchain, it cannot be cancelled. However, you can speed up pending transactions by increasing the gas fee.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
