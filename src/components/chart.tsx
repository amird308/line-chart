import React from 'react';
import { usePriceData } from '../hooks/use-data-price';

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
  console.log(priceData)

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
        width={width} 
        height={height} 
        className="bg-transparent"
        style={{ display: priceData.length < 2 ? 'none' : 'block' }}
      />

    </div>
  );
};

export default Chart; 