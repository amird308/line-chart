import { useState, useEffect, useCallback, useRef } from 'react';
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
  isLoading: boolean;
}

export function usePriceData({ symbol = 'BTCUSDT' }: UsePriceDataProps): UsePriceDataReturn {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastPriceRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // history
  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true);
    
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
    setIsLoading(false);
    
  }, [symbol]);

  // realtime
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    try {
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);

      ws.onopen = () => {
        console.log(`WebSocket connected for ${symbol}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const price = parseFloat(data.c);

          if (!isNaN(price) && price > 0) {
            setCurrentPrice(price);
            lastPriceRef.current = price;
            setPriceData(prevData => {
              const newDataPoint: PriceData = {
                timestamp: Date.now(),
                price: price
              };
              const updatedData = [...prevData, newDataPoint];
              if(updatedData.length >= 600) {
                return updatedData.slice(-200);
              }
              return updatedData;
            });
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected for ${symbol}`, event.code, event.reason);     
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [symbol]);

  // symbol changes and init
  useEffect(() => {
    setPriceData([]);
    setCurrentPrice(0);
    setIsLoading(true);
    lastPriceRef.current = 0;
    lastUpdateRef.current = 0;

    fetchHistoricalData().then(() => {
      connectWebSocket();
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, [symbol]);

  return {
    priceData,
    currentPrice,
    isLoading
  };
}
