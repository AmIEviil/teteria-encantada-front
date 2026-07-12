import {
  GaugeContainer,
  GaugeValueArc,
  GaugeReferenceArc,
} from "@mui/x-charts/Gauge";
import style from "./GaugeChart.module.css";
import { Tooltip } from "@mui/material";
import type { CustomGaugeChartProps } from "../../../../service/charts/gaugeChart.interface";
import { GaugePointer } from "./GaugePointer/GaugePointer";

const GaugeChart = ({
  title,
  minValue = 0,
  maxValue = 100,
  actualValue = 20,
}: CustomGaugeChartProps) => {
  return (
    <div className={style.gaugeContainer}>
      <div className={style.titleGaugeContainer}>
        <span className={style.titleGauge}>{title}</span>
      </div>
      <GaugeContainer
        width={200}
        height={200}
        startAngle={-110}
        endAngle={110}
        value={actualValue}
        valueMin={minValue}
        valueMax={maxValue}
        innerRadius="70%"
        outerRadius="100%"
      >
        <GaugeValueArc />
        <GaugePointer />
        <GaugeReferenceArc />
      </GaugeContainer>
      <div className={style.spanGaugeContainer}>
        <Tooltip title="Valor mínimo" arrow leaveDelay={0}>
          <p className={style.minRange}>{minValue}</p>
        </Tooltip>
        <Tooltip title="Utilizado" arrow leaveDelay={0}>
          <span className={style.actualValue}>{actualValue}</span>
        </Tooltip>
        <Tooltip title="Valor máximo" arrow leaveDelay={0}>
          <p className={style.maxRange}>{maxValue}</p>
        </Tooltip>
      </div>
    </div>
  );
};
export default GaugeChart;
