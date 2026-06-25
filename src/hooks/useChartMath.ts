import { useMemo } from "react"
import {
  calculateChartMetrics,
  buildTooltipData,
  buildTooltipTransform,
  buildTooltipStyle,
  CHART_DIMENSIONS,
  type CashFlowDataPoint,
} from "@/lib/statistics"

export function useCashFlowChart(displayCashFlow: CashFlowDataPoint[], chartMode: string) {
  const dims = CHART_DIMENSIONS

  const metrics = useMemo(
    () => calculateChartMetrics(displayCashFlow, chartMode, dims),
    [displayCashFlow, chartMode, dims]
  )

  return { ...metrics, dims }
}

export function useChartInteraction(
  activeIndex: number | null,
  displayCashFlow: CashFlowDataPoint[],
  incomePoints: { x: number; y: number }[],
  expensePoints: { x: number; y: number }[],
  chartMode: string,
  maxVal: number,
  chartHeight: number,
  paddingY: number,
  netFlowData: { values: number[]; scaleMax: number; yZero: number },
  svgWidth: number,
  svgHeight: number
) {
  const tooltipInfo = useMemo(
    () => buildTooltipData(activeIndex, displayCashFlow, incomePoints, expensePoints, chartMode, maxVal, chartHeight, paddingY, netFlowData),
    [activeIndex, displayCashFlow, incomePoints, expensePoints, chartMode, maxVal, chartHeight, paddingY, netFlowData]
  )

  const activeMinY = tooltipInfo?.minY ?? 0

  const tooltipTransform = useMemo(
    () => buildTooltipTransform(activeIndex, displayCashFlow, incomePoints, expensePoints, activeMinY),
    [activeIndex, displayCashFlow, incomePoints, expensePoints, activeMinY]
  )

  const tooltipStyle = useMemo(
    () => buildTooltipStyle(activeIndex, displayCashFlow, incomePoints, expensePoints, svgWidth, svgHeight, activeMinY),
    [activeIndex, displayCashFlow, incomePoints, expensePoints, svgWidth, svgHeight, activeMinY]
  )

  return { activeMinY, tooltipTransform, tooltipStyle }
}

export function useModalChartMath(
  monthDailyFlow: CashFlowDataPoint[],
  modalActiveIdx: number | null
) {
  const dims = CHART_DIMENSIONS

  const metrics = useMemo(
    () => calculateChartMetrics(monthDailyFlow, 'line', dims),
    [monthDailyFlow, dims]
  )

  const tooltipInfo = useMemo(
    () => buildTooltipData(modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, 'line', metrics.maxVal, dims.chartHeight, dims.paddingY, metrics.netFlowData),
    [modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, metrics.maxVal, dims.chartHeight, dims.paddingY, metrics.netFlowData]
  )

  const activeMinY = tooltipInfo?.minY ?? 0

  const modalTooltipTransform = useMemo(
    () => buildTooltipTransform(modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, activeMinY),
    [modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, activeMinY]
  )

  const modalTooltipStyle = useMemo(
    () => buildTooltipStyle(modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, dims.svgWidth, dims.svgHeight, activeMinY),
    [modalActiveIdx, monthDailyFlow, metrics.incomePoints, metrics.expensePoints, dims.svgWidth, dims.svgHeight, activeMinY]
  )

  return {
    modalMaxTransValue: metrics.maxTransValue,
    modalMaxVal: metrics.maxVal,
    modalIncPts: metrics.incomePoints,
    modalExpPts: metrics.expensePoints,
    modalIncPath: metrics.incomePath,
    modalExpPath: metrics.expensePath,
    modalIncArea: metrics.incomeArea,
    modalExpArea: metrics.expenseArea,
    modalTooltipTransform,
    modalTooltipStyle,
  }
}
