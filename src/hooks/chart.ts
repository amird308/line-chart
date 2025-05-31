import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { PriceData } from './use-data-price';
import * as d3 from 'd3';
interface UseD3ChartProps {
  data: PriceData[];
}


export function useChart({ data }: UseD3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const initializedRef = useRef<boolean>(false);

  // memoized scales
  const scales = useMemo(() => {
      if (data.length < 2) return null;
  
      const priceExtent = d3.extent(data, d => d.price) as [number, number];
      const timeExtent = d3.extent(data, d => new Date(d.timestamp)) as [Date, Date];
      
      const priceRange = priceExtent[1] - priceExtent[0];
      const timePadding = (timeExtent[1].getTime() - timeExtent[0].getTime()) * 0.05;
      
      const xScale = d3.scaleTime()
        .domain([timeExtent[0], new Date(timeExtent[1].getTime() + timePadding)])
        .range([0, 1000]);
      
      const yScale = d3.scaleLinear()
        .domain([
          priceExtent[0] - priceRange * 0.1,
          priceExtent[1] + priceRange * 0.1
        ])
        .range([600, 0]);
  
      return { xScale, yScale };
  }, [data]);

  const initializeChart = useCallback(() => {
    if (!svgRef.current || !scales) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    
    const redGradient = defs.append('linearGradient')
      .attr('id', 'redZone')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    redGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444').attr('stop-opacity', 0.3);
    redGradient.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626').attr('stop-opacity', 0.1);

    const greenGradient = defs.append('linearGradient')
      .attr('id', 'greenZone')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    greenGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.3);
    greenGradient.append('stop').attr('offset', '100%').attr('stop-color', '#16a34a').attr('stop-opacity', 0.1);

    const container = svg.append('g')
      .attr('transform', `translate(${80},${60})`);

    // background zones
    const lastPrice = data[data.length - 1].price;
    const currentPriceY = scales.yScale(lastPrice);
    
    container.append('rect')
      .attr('class', 'red-zone')
      .attr('width', 1200)
      .attr('height', currentPriceY)
      .attr('fill', 'url(#redZone)');

    container.append('rect')
      .attr('class', 'green-zone')
      .attr('y', currentPriceY)
      .attr('width', 1200)
      .attr('height', 600 - currentPriceY)
      .attr('fill', 'url(#greenZone)');

    container.append('line')
      .attr('class', 'current-price-line')
      .attr('x2', 1200)
      .attr('y1', currentPriceY)
      .attr('y2', currentPriceY)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8);

    // axes
    const yAxisGenerator = d3.axisRight(scales.yScale)
      .ticks(8)
      .tickFormat(d => `$${d3.format(',.5f')(d as number)}`);

    const yAxisGroup = (
      container.append('g')
    )
      .attr('class', 'y-axis')
      .attr('transform', `translate(${1000}, 0)`)
      .call(yAxisGenerator);

    yAxisGroup.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '12px');
    yAxisGroup.selectAll('line').attr('stroke', '#374151').attr('stroke-opacity', 0.5);
    yAxisGroup.select('.domain').remove();

    const xAxisGenerator = d3.axisBottom(scales.xScale)
      .ticks(6)
      .tickFormat(d => d3.timeFormat('%H:%M:%S')(d as Date));

    const xAxisGroup = (
      container.append('g')
    )
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${600})`)
      .call(xAxisGenerator);

    xAxisGroup.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '12px');
    xAxisGroup.selectAll('line').attr('stroke', '#374151').attr('stroke-opacity', 0.5);
    xAxisGroup.select('.domain').attr('stroke', '#374151');

    // price line path
    container.append('path')
      .attr('class', 'price-line')
      .attr('fill', 'none')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');

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