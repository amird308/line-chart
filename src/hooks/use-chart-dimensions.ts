import { useMemo } from 'react';

export interface ChartDimensions {
  width: number;
  height: number;
  boundedWidth: number;
  boundedHeight: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface UseChartDimensionsProps {
  width: number;
  height: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export function useChartDimensions({
  width,
  height,
  marginTop = 60,
  marginRight = 120,
  marginBottom = 80,
  marginLeft = 80,
}: UseChartDimensionsProps): ChartDimensions {
  return useMemo(() => {
    const margin = {
      top: marginTop,
      right: marginRight,
      bottom: marginBottom,
      left: marginLeft,
    };

    const boundedWidth = Math.max(0, width - margin.left - margin.right);
    const boundedHeight = Math.max(0, height - margin.top - margin.bottom);

    return {
      width,
      height,
      boundedWidth,
      boundedHeight,
      margin,
    };
  }, [width, height, marginTop, marginRight, marginBottom, marginLeft]);
} 