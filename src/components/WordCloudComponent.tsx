import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface Word {
  text: string;
  value: number;
}

interface CloudWord extends Word {
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
  font?: string;
  padding?: number;
}

interface WordCloudProps {
  data: Word[];
  font?: string;
  fontSize?: (word: Word) => number;
  padding?: number;
  spiral?: 'archimedean' | 'rectangular';
  rotate?: (word: Word) => number;
  width?: number;
  height?: number;
}

const WordCloudComponent: React.FC<WordCloudProps> = ({
  data,
  font = 'Impact',
  fontSize = (word: Word) => Math.sqrt(word.value) * 5,
  padding = 2,
  spiral = 'archimedean',
  rotate = () => (Math.random() - 0.5) * 30,
  width = 500, // Default width
  height = 300, // Default height
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);

  // Update width/height based on container size for responsiveness (optional, but good practice)
  useEffect(() => {
    const parentElement = svgRef.current?.parentElement;

    const observer = new ResizeObserver(entries => {
      // We only expect one entry for the parent div
      if (entries[0] && entries[0].contentRect) {
        setCurrentWidth(entries[0].contentRect.width);
        setCurrentHeight(entries[0].contentRect.height);
      }
    });

    if (parentElement) {
      observer.observe(parentElement);
    }

    return () => {
      if (parentElement) {
        observer.unobserve(parentElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous cloud

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layout = (cloud as any)()
      .size([currentWidth, currentHeight])
      .words(data.map(d => ({ text: d.text, value: d.value, size: fontSize(d), rotate: rotate(d), paddingLine: padding } as CloudWord)))
      .padding(padding) // Apply padding from props
      .rotate(rotate) // Apply rotate function from props
      .font(font) // Apply font from props
      .fontSize((d: CloudWord) => d.size || 0) // Apply fontSize function from props
      .spiral(spiral) // Apply spiral from props
      .on('end', draw);

    layout.start();

    function draw(words: CloudWord[]) { // words passed from d3-cloud layout
      svg
        .attr('width', currentWidth)
        .attr('height', currentHeight)
        .append('g')
        .attr('transform', `translate(${currentWidth / 2},${currentHeight / 2})`)
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', (d) => `${d.size}px`)
        .style('font-family', (d) => d.font || font)
        .style('fill', (d, i) => d3.schemeCategory10[i % 10]) // Simple coloring
        .attr('text-anchor', 'middle')
        .attr('transform', (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text((d) => d.text);
    }
  }, [data, font, fontSize, padding, spiral, rotate, currentWidth, currentHeight]);

  // The outer div is to provide a container for ResizeObserver to observe
  return (
    <div style={{ width: '100%', height: '100%', minHeight: height, minWidth: width }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default WordCloudComponent;
