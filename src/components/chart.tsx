import React from 'react';
import { usePriceData } from '../hooks/use-data-price';
import { useChart } from '../hooks/chart';
import { useChartDimensions } from '../hooks/use-chart-dimensions';

interface ChartProps {
  symbol?: string;
  width?: number;
  height?: number;
}

const Chart: React.FC<ChartProps> = () => {
  const symbol = 'BTCUSDT'; 
  const width = 1200;
  const height = 600;
  
  const { priceData, isLoading } = usePriceData({ symbol });

  const dimensions = useChartDimensions({
    width,
    height,
    marginTop: 60,
    marginRight: 120,
    marginBottom: 80,
    marginLeft: 80,
  });


  const svgRef = useChart({
    data: priceData,
    dimensions
  });

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">

      {(isLoading || priceData.length < 2) && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white text-lg font-semibold">
              {isLoading ? 'Loading Chart Data...' : 'Preparing Chart...'}
            </div>
          </div>
        </div>
      )}

      {/* Chart SVG */}
      <svg 
         ref={svgRef} 
        width={width} 
        height={height} 
        className="bg-transparent"
        style={{ display: priceData.length < 2 ? 'none' : 'block' }}
      />

      {/* Icons */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-4">
        {[
          { name: 'BTC', color: 'bg-orange-500' },
          { name: 'ETH', color: 'bg-gray-600' },
          { name: 'SOL', color: 'bg-blue-500' }
        ].map(crypto => (
          <div 
            key={crypto.name} 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${crypto.color} ${
              symbol.includes(crypto.name) ? 'ring-2 ring-yellow-400' : ''
            }`}
          >
            {crypto.name}
          </div>
        ))}
      </div>

      {/* Data Info */}
      {priceData.length >= 2 && (
        <div className="absolute bottom-4 left-6 z-20 text-gray-400 text-sm">
          <div>Data Points: {priceData.length}</div>
          <div>Symbol: {symbol}</div>
        </div>
      )}


    </div>
  );
};

export default Chart; 