import { useRef, useEffect, useCallback } from 'react';
import type { PriceData } from './use-data-price';

interface UseD3ChartProps {
  data: PriceData[];
}


export function useD3Chart({ data }: UseD3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const initializedRef = useRef<boolean>(false);

  const initializeChart = useCallback(() => {
    

    initializedRef.current = true;
  }, []);


  const updateChart = useCallback(() => {
    
  }, []);


  useEffect(() => {
    if (data.length >= 2 && !initializedRef.current) {
      initializeChart();
    }
  }, [initializeChart, data.length]);

  useEffect(() => {
    if (initializedRef.current) {
      updateChart();
    }
  }, [updateChart]);



  return svgRef;
} 