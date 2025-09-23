import React from 'react';
import { Chart, useChart } from "@chakra-ui/charts";
import { Cell, Pie, PieChart } from "recharts";

const Progress = () => {
  const chart = useChart({
    data: [
      { name: "Todo", value: 3, color: "blue.400" },
      { name: "In Progress", value: 5, color: "orange.400" },
      { name: "Testing", value: 2, color: "pink.400" },
      { name: "Done", value: 8, color: "green.400" },
    ],
  });

  return (
    <div className="border rounded-md p-3 text-xs">
      <h3 className="font-semibold text-sm mb-1 text-gray-700">Task Progress</h3>
      <Chart.Root boxSize="160px" mx="auto" chart={chart}>
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={chart.data}
            dataKey={chart.key("value")}
            nameKey={chart.key("name")}
            outerRadius={45}
            innerRadius={25}
            label={({ name }) => name}
            labelLine={false}
          >
            {chart.data.map((item) => (
              <Cell key={item.name} fill={chart.color(item.color)} />
            ))}
          </Pie>
        </PieChart>
      </Chart.Root>
    </div>
  );
};

export default Progress;
