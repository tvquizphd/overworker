import sizeMe from 'react-sizeme';
import Chart from "react-google-charts";
import { useState, useEffect } from 'react';

const TreeMapChart = (props) => { {
    const { size, data, options} = props;
    const { onKeyPress, onChartReady, onChartSelect} = props;

    const [fakeControls, setFakeControls] = useState([]);

    useEffect(() => {
      // trigger chart rerender
      setFakeControls([]);
    }, [size.width, size.height]);

    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <div style={{ position: 'absolute', width: '100%', height: size.height }}>
          <Chart
            chartType="TreeMap"
            controls={fakeControls}
            width={`${size.width}px`}
            height={`${size.height}px`}
            data={data}
            options={options}
            chartEvents={[
              { eventName: "select", callback: onChartSelect },
              { eventName: "ready", callback: onChartReady }
            ]}
          />
        </div>
      </div>
    );
  }
}

export default sizeMe({ monitorHeight: true })(TreeMapChart);
