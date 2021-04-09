import { Component } from 'react';
import TreeMapChart from "../components/tree_map_chart";

const raw_data = [
  [
    "Location",
    "Parent",
    "Market trade volume (size)",
    "Market increase/decrease (color)"
  ],
  ["Global", null, 0, 0],
  ["America", "Global", 0, 0],
  ["Europe", "Global", 0, 0],
  ["Asia", "Global", 0, 0],
  ["Australia", "Global", 0, 0],
  ["Africa", "Global", 0, 0],
  ["Brazil", "America", 11, 10],
  ["USA", "America", 52, 31],
  ["Mexico", "America", 24, 12],
  ["Canada", "America", 16, -23],
  ["France", "Europe", 42, -11],
  ["Germany", "Europe", 31, -2],
  ["Sweden", "Europe", 22, -13],
  ["Italy", "Europe", 17, 4],
  ["UK", "Europe", 21, -5],
  ["China", "Asia", 36, 4],
  ["Japan", "Asia", 20, -12],
  ["India", "Asia", 40, 63],
  ["Laos", "Asia", 4, 34],
  ["Mongolia", "Asia", 1, -5],
  ["Israel", "Asia", 12, 24],
  ["Iran", "Asia", 18, 13],
  ["Pakistan", "Asia", 11, -52],
  ["Egypt", "Africa", 21, 0],
  ["S. Africa", "Africa", 30, 43],
  ["Sudan", "Africa", 12, 2],
  ["Congo", "Africa", 10, 12],
  ["Zaire", "Africa", 8, 10]
];

const parents = new Set(
  raw_data.slice(2).map((d) => {
    return d[1];
  })
);

const nameDummyNode = (name) => {
  return `${name} is a great country!`;
};

const data = raw_data.reduce((list, d, i) => {
  const name = d[0];
  if (i != 0 && !parents.has(name)) {
    list.push([nameDummyNode(name), name, 1, d[3]]);
  }
  return list;
}, raw_data);

const name_to_row = new Map(data.map((d, i) => [d[0], i - 1]));

export default class TreeMap extends Component {
  constructor() {
    super();
    this.state = {
      currentNodeName: "Global"
    };
  }

  setCurrentNodeName = (name, parent_name) => {
    if (parent_name === undefined) {
      const row = name_to_row.get(name);
      if (row !== undefined) {
        parent_name = data[row + 1][1];
      }
    }
    const { currentNodeName } = this.state;
    const is_current = currentNodeName == name;
    const parent_row = name_to_row.get(parent_name);
    // Regular Click
    let new_node_name = name;
    // Clicked on header;
    if (is_current && parent_row !== undefined) {
      new_node_name = parent_name;
    }
    // Clicked on base-level comment;
    else if (nameDummyNode(parent_name) == name) {
      new_node_name = parent_name;
    }
    this.setState({
      currentNodeName: new_node_name
    });
  };

  onChartSelect = ({ chartWrapper }) => {
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const { row } = selection[0];
    const d = data[row + 1];
    this.setCurrentNodeName(d[0], d[1]);
  };

  onKeyPress = (event) => {
    if (event.key === " " || event.key === "Enter") {
      const text = document.activeElement.querySelector("text");
			if (text) this.setCurrentNodeName(text.textContent);
    }
  };

  onChartReady = ({ chartWrapper }) => {
    const { currentNodeName } = this.state;
    const chart = chartWrapper.getChart();
    const row = name_to_row.get(currentNodeName);

    chart.setSelection([{ row }]);
  };

  render() {
    const options = {
      minColor: "#7193ff",
      midColor: "#B86C80",
      maxColor: "#ff4500",
      headerHeight: 40,
      headerColor: "#1a001a",
      fontColor: "white",
      showScale: false,
      maxPostDepth: 1,
      generateTooltip: (row, n, v) => {
        return `<div class="secret-tooltip" data-row="${row}"></div>`;
      },
      useWeightedAverageForAggregation: true
    };

    return (
      <TreeMapChart
        data={data}
        options={options}
        onChartReady={this.onChartReady}
        onChartSelect={this.onChartSelect}
      />
    );
  }
}
