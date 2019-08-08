import React from 'react'
import * as d3 from 'd3'
import EmptyList from '../EmptyList'
import { withStyles } from '@material-ui/styles'
import * as _isEqual from 'lodash.isequal'
import { CURRENCY, resolveCurrencyValue } from '../../../data/resolvers'

const style = theme => ({
  TimelineFigure_root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflowX: 'hidden',
  },
  svg: {
    width: '100%',
    userSelect: 'none',
  },
  tickX: {
    fontSize: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  tick_noline: {
    '& line': {
      display: 'none',
    },
  },
  tick_notext: {
    '& text': {
      display: 'none',
    },
  },
  bar_group: {

  },
  bar: {
    fill: theme.palette.secondary.main,
  },
  barInactive: {
    fill: theme.palette.grey[200],
  },
  barOverlay: {
    fill: 'transparent',
  }
});

class TimelineFigure extends React.Component {
  constructor(props){
    super(props);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchHold = this.handleTouchHold.bind(this);
  }
  // touch events config
  holdDuration = 500;
  // svg config
  ref = React.createRef();
  width = 600;
  height = 400;
  padding = 40;
  barPadding = 3;
  // getters
  get bars() {
    return Array.from(this.ref.current.querySelectorAll(`.${this.props.classes.bar}`));
  }
  get overlays() {
    return Array.from(this.ref.current.querySelectorAll(`.${this.props.classes.barOverlay}`));
  }

  // lifecycle
  componentDidMount(){
    if (this._dataIsValid()) this.renderFigure();
  }
  shouldComponentUpdate(nextProps){
    return !_isEqual(this.props.data, nextProps.data);
  }
  componentDidUpdate(){
    if (this._dataIsValid()) this.renderFigure();
  }
  // data validation
  _dataIsValid(){
    return this.props.data.groups.length > 0;
  }
  // handlers
  handleTouchStart(e){
    console.log('start')
    const coords = getTouchCoords(e);
    this.timer = setTimeout(()=>this.handleTouchHold(coords), this.holdDuration)
  }
  handleTouchMove(e){
    console.log('move')
    if (this.timer) clearTimeout(this.timer);
    if (!this.props.swipeable) this.selectBar(getTouchCoords(e));
  }
  handleTouchEnd(e){
    console.log('end')
    if (this.timer) clearTimeout(this.timer);
    if (!this.props.swipeable) this.props.setSwipeable(true);
    this.deselectBars();
  }
  handleTouchHold(coords){
    console.log('hold')
    this.props.setSwipeable(false);
    this.selectBar(coords);
  }
  handleContextMenu(e){
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  selectBar(coords){
    const {x, y} = coords;
    this.overlays.forEach(overlay => {
      const rect = overlay.getBoundingClientRect();
      const bar = this.bars.find(b => b.dataset.id == overlay.dataset.id)
      if (
        x >= rect.x && x < rect.x+rect.width
        && y >= rect.y && y < rect.y+rect.height
      ) {
        bar.classList.remove(this.props.classes.barInactive);
      } else {
        bar.classList.add(this.props.classes.barInactive);
      }
    })
  }
  deselectBars(){
    this.bars.forEach(b => {
      b.classList.remove(this.props.classes.barInactive);
    })
  }

  // render d3
  renderFigure() {
    const svg = d3.select(this.ref.current);
    svg.selectAll('*').remove();
    // days of month
    const xMin = 0;
    const xMax = getDaysInMonth(this.props.data.id);
    // total expenses amounts per day
    const yMin = 0;
    const yMax = d3.max(this.props.data.groups, d => parseFloat(d.total));
    // scales
    const xScale = d3.scaleLinear()
                     .domain([xMin, xMax+1])
                     .range([this.padding, this.width-this.padding]);
    const yScale = d3.scaleLinear()
                     .domain([yMin, yMax])
                     .range([this.height-this.padding, this.padding]);
    // axes
    const xTicks = Array.from(Array(xMax+1).keys())
                        .map(i => i>0 ? [i, i+0.5] : [i])
                        .reduce((a,b)=>a.concat(b), []);
    const xAxis = d3.axisBottom()
                    .scale(xScale)
                    .tickValues(xTicks)
                    .tickPadding(12)
                    .tickSize(0)
                    .tickFormat((d,i)=>{
                      const v = Math.floor(d).toString();
                      return v.length < 2 ? '0'+v : v;
                    });
    const yAxis = d3.axisLeft()
                    .scale(yScale)
                    .tickValues([
                      Math.floor(yMax*0.25),
                      Math.floor(yMax*0.5),
                      Math.floor(yMax*0.75),
                      Math.floor(yMax),
                    ])
                    .tickSize(0)

    // draw axes
    const xAxisNode = svg.append('g')
       .attr('id', 'x-axis-'+this.props.data.id)
       .attr('transform', `translate(0,${this.height-this.padding+2})`)
       .call(xAxis);
    // const yAxisNode = svg.append('g')
    //    .attr('id', 'y-axis-'+this.props.data.id)
    //    .attr('transform', `translate(${this.padding})`)
    //    .call(yAxis);

    // apply staggered display style to date ticks
    xAxisNode.selectAll('.tick')
      .style('font-size', '16px')
      .attr('class', (d,i) => (i===0 || (d+2)%3 !== 0) ? this.props.classes.tick_notext : this.props.classes.tickX)
    // yAxisNode.selectAll('.tick')
    //   .style('font-size', '16px')

    const groupData = this._fillEmptyIndices(xMax)
    const barGroups = svg.selectAll(`.${this.props.classes.bar_group}`)
      .data(groupData)
      .enter()
      .append('g')
      .attr('class', this.props.classes.bar_group)

    const barWidth = (xScale(1)-this.padding)-(this.barPadding*2);
    const barGroupHalfWidth = xScale(0.5) - this.padding;

    // data bars
    barGroups.append('rect')
      .attr('class', this.props.classes.bar)
      .attr('x', (d,i) => xScale(d.id)+this.barPadding-barGroupHalfWidth)
      .attr('y', d => yScale(parseFloat(d.total)))
      .attr('height', d => yScale(0) - yScale(parseFloat(d.total)))
      .attr('width', barWidth)
      .attr('data-id', d => d.id)

    // user interaction bar overlays
    const barOverlay = {
      height: yScale(0)-yScale(yMax)+this.padding,
      width: xScale(1)-this.padding,
    }
    barGroups.append('rect')
      .attr('class', this.props.classes.barOverlay)
      .attr('x', (d,i) => xScale(d.id)-barGroupHalfWidth)
      .attr('y', yScale(yMax))
      .attr('height', barOverlay.height)
      .attr('width', barOverlay.width)
      .attr('data-id', d => d.id)

    // barGroups.append('text')
    //   .attr('x', (d,i) => xScale(d.id)+this.barPadding-barGroupHalfWidth)
    //   .attr('y', d => yScale(parseFloat(d.total)))
    //   .text(d=> d.total >= yMax ? d.id : '')
    //   .style('font-size', '16px')
  }

  render(){
    return (
      <div className={this.props.classes.TimelineFigure_root}>
        {this._dataIsValid() ? (
          <svg
            ref={this.ref}
            viewBox={`0 0 ${this.width} ${this.height}`}
            preserveAspectRatio='xMidYMid meet'
            className={this.props.classes.svg}
            onTouchStart={this.handleTouchStart}
            onTouchMove={this.handleTouchMove}
            onTouchEnd={this.handleTouchEnd}
            onTouchCancel={this.handleTouchEnd}
            onContextMenu={this.handleContextMenu}
          />
        ) : <EmptyList /> }
      </div>
    );
  }

  // internal helper
  _fillEmptyIndices(last){
    const data = this.props.data.groups.slice();
    for(let i=1; i<=last; i++){
      if (data.find(d => d.id===i)) continue;
      data.push({
        id: i,
        total: resolveCurrencyValue(0, CURRENCY[this.props.user.currency].decimal),
      });
    }
    return data;
  }
}

// external helper
function getDaysInMonth(id){
  // id = yyyymm as number type
  const str = id.toString();
  const y = str.slice(0,4);
  const m = str.slice(4);
  const d = new Date(parseInt(y, 10), parseInt(m, 10)+1);
  d.setDate(d.getDate()-1);
  return d.getUTCDate();
}
function getTouchCoords(e){
  return {x: e.touches[0].clientX, y: e.touches[0].clientY}
}

export default withStyles(style)(TimelineFigure);