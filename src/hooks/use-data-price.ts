import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface PriceData {
  timestamp: number;
  price: number;
}

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string 
];

interface UsePriceDataProps {
  symbol?: string;
}

interface UsePriceDataReturn {
  priceData: PriceData[];
  currentPrice: number;
  error: string | null;
  isLoading: boolean;
}

export function usePriceData({ symbol = 'BTCUSDT' }: UsePriceDataProps = {}): UsePriceDataReturn {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // history
  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const now = Date.now();
    const oneHourAgo = now - (2 * 60 * 1000);
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: symbol.toUpperCase(),
        interval: '1s',
        startTime: oneHourAgo,
        endTime: now,
        limit: 120,
      },
      timeout: 10000,
    });

    const klines = response.data;
    const historicalData: PriceData[] = klines.map((kline: BinanceKline) => ({
      timestamp: kline[0],
      price: parseFloat(kline[4]),
    })).sort((a: PriceData, b: PriceData) => a.timestamp - b.timestamp);

    setPriceData(historicalData);
    if (historicalData.length > 0) {
      const lastPrice = historicalData[historicalData.length - 1].price;
      setCurrentPrice(lastPrice);

    }
    
  }, [symbol]);


  useEffect(() => {
    setPriceData([]);
    setCurrentPrice(0);
    setError(null);
    setIsLoading(true);

    fetchHistoricalData();

  }, [symbol]);

  return {
    priceData,
    currentPrice,
    error,
    isLoading
  };
}
