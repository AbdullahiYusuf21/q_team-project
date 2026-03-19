import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// D3.js draws directly onto an SVG element.
// React gives us a ref (a direct pointer to the DOM node),
// and D3 uses that pointer to draw — bypassing React's virtual DOM.
// This is the standard pattern for using D3 inside React.

export default function ProbabilityChart({ probabilities }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!probabilities || !svgRef.current) return

    const data = Object.entries(probabilities)
      .map(([state, prob]) => ({ state, prob }))
      .filter(d => d.prob > 0.0001)  // hide near-zero states

    const width   = 500
    const height  = 220
    const marginT = 20
    const marginR = 20
    const marginB = 50
    const marginL = 55

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')

    const chartW = width  - marginL - marginR
    const chartH = height - marginT - marginB

    const g = svg.append('g')
      .attr('transform', `translate(${marginL},${marginT})`)

    // X scale — one band per basis state label
    const x = d3.scaleBand()
      .domain(data.map(d => d.state))
      .range([0, chartW])
      .padding(0.35)

    // Y scale — probability 0 to 1
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([chartH, 0])

    // Gridlines — subtle horizontal lines at 0.25, 0.5, 0.75, 1.0
    g.selectAll('.gridline')
      .data([0.25, 0.5, 0.75, 1.0])
      .enter().append('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', chartW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#2a2a3a')
      .attr('stroke-dasharray', '3,3')

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x',      d => x(d.state))
      .attr('y',      d => y(d.prob))
      .attr('width',  x.bandwidth())
      .attr('height', d => chartH - y(d.prob))
      .attr('rx', 4)
      .attr('fill', '#7c6aff')
      .attr('opacity', 0.85)

    // Probability labels on top of bars
    g.selectAll('.bar-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.state) + x.bandwidth() / 2)
      .attr('y', d => y(d.prob) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0f0f8')
      .attr('font-size', '11px')
      .text(d => `${(d.prob * 100).toFixed(1)}%`)

    // X axis — state labels
    g.append('g')
      .attr('transform', `translate(0,${chartH})`)
      .call(d3.axisBottom(x))
      .call(ax => {
        ax.selectAll('text')
          .attr('fill', '#9090aa')
          .attr('font-size', '12px')
          .attr('font-family', 'monospace')
        ax.selectAll('line, path').attr('stroke', '#2a2a3a')
      })

    // X axis label
    g.append('text')
      .attr('x', chartW / 2)
      .attr('y', chartH + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9090aa')
      .attr('font-size', '11px')
      .text('Basis State')

    // Y axis — probability
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d * 100}%`))
      .call(ax => {
        ax.selectAll('text').attr('fill', '#9090aa').attr('font-size', '11px')
        ax.selectAll('line, path').attr('stroke', '#2a2a3a')
      })

  }, [probabilities])

  return (
    <div style={styles.wrapper}>
      <svg ref={svgRef} />
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    padding: '20px',
    maxWidth: '600px',
  }
}