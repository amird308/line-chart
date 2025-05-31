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
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
}
