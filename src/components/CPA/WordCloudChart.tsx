import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordCloudProps {
    data: { answer: string; value: number }[];
    width?: number;
    height?: number;
    colors?: string[];
}

const WordCloudChart = ({ data, width = 500, height = 300, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'] }: WordCloudProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [words, setWords] = useState<any[]>([]);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Normalizar valores para tamanho da fonte
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const fontScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([16, 60]); // Tamanho min e max da fonte

        const layout = cloud()
            .size([width, height])
            .words(data.map(d => ({ text: d.answer, size: fontScale(d.value), value: d.value })))
            .padding(5)
            .rotate(() => (~~(Math.random() * 2) * 90)) // 0 ou 90 graus
            .font("Impact")
            .fontSize((d: any) => d.size)
            .on("end", setWords);

        layout.start();
    }, [data, width, height]);

    useEffect(() => {
        if (words.length > 0 && svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

            svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`)
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", (d: any) => `${d.size}px`)
                .style("font-family", "Impact")
                .style("fill", (_d, i) => colors[i % colors.length])
                .attr("text-anchor", "middle")
                .attr("transform", (d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text((d: any) => d.text)
                .append("title") // Tooltip simples do navegador
                .text((d: any) => `${d.text}: ${d.value}`);
        }
    }, [words, width, height, colors]);

    return (
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
            <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} />
        </div>
    );
};

export default WordCloudChart;
