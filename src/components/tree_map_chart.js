import Chart from "react-google-charts";
import { useState, useEffect } from 'react';

const TreeMapChart = (props) => {
  const { size, data, options} = props;
  const { onKeyPress, onChartReady, onChartSelect} = props;

  return (
    <Chart
      chartType="TreeMap"
      height="100vh"
      width="30vw"
      data={data}
      options={options}
      chartEvents={[
        { eventName: "select", callback: onChartSelect },
        { eventName: "ready", callback: onChartReady }
      ]}
    />
  );
}

export default TreeMapChart;
