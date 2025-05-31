import { useState } from "react"
import Chart from "./components/chart"

interface CryptoInfo {
  id: string;
  name: string;
  symbol: string;
  color: string;
}

const SUPPORTED_CRYPTOS: CryptoInfo[] = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTCUSDT', color: 'bg-orange-500'},
  { id: 'ETH', name: 'Ethereum', symbol: 'ETHUSDT', color: 'bg-blue-500' },
  { id: 'SOL', name: 'Solana', symbol: 'SOLUSDT', color: 'bg-purple-500'},
];

function App() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoInfo>(SUPPORTED_CRYPTOS[0]);

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Crypto Price Chart
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time cryptocurrency price data
          </p>
        </div>

        {/* Crypto Selector */}
        <div className="flex justify-center gap-3 mb-8">
          {SUPPORTED_CRYPTOS.map((crypto) => (
            <button
              key={crypto.id}
              onClick={() => setSelectedCrypto(crypto)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all
                ${crypto.id === selectedCrypto.id 
                  ? `${crypto.color} text-white ring-2 ring-white` 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              <span className="font-medium">{crypto.name}</span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-center mb-12">
          <Chart symbol={selectedCrypto.symbol} />
        </div>
      </div>
    </div>
  )
}

export default App
