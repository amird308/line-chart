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
  const { priceData } = usePriceData({ symbol });
  console.log(priceData)

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">



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