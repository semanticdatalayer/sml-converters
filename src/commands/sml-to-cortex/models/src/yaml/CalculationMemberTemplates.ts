import { YamlFormatString } from "./IYamlDataset";

export type CalculationTemplate = {
  description: string;
  expression: string;
  defaultFormat?: YamlFormatString;
  useInputMetricFormat?: boolean;
  validOnlyForTimeDim?: boolean;
};

export enum CalculationMembersTemplatesIds {
  Current = "Current",
  Previous = "Previous",
  CurrentVsPrevious = "Current vs Previous",
  CurrentVsPreviousPct = "Current vs Previous Pct",
  Next = "Next",
  CurrentVsNext = "Current vs Next",
  CurrentVsNextPct = "Current vs Next Pct",
  PctOfParent = "Pct of Parent",
  PctOfTotal = "Pct of Total",
  LastYear = "Last Year",
  CurrentVsLastYear = "Current vs Last Year",
  CurrentVsLastYearPct = "Current vs Last Year Pct",
  YearToDate = "Year to Date",
  QuarterToDate = "Quarter to Date",
  MonthToDate = "Month to Date",
  MonthMovingAverage3Month = "Month Moving Average 3 Month",
  MovingAverage30Period = "Moving Average 30 Period",
  MovingAverage5Period = "Moving Average 5 Period",
  MovingStdDev30Period = "Moving Std Dev 30 Period",
  MovingStdDev5Period = "Moving Std Dev 5 Period",
}

export const CalculationTemplates: Record<CalculationMembersTemplatesIds, CalculationTemplate> = {
  [CalculationMembersTemplatesIds.Current]: {
    description: `The measure's value for the current dimension members in the query.`,
    expression: "([${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
  },
  [CalculationMembersTemplatesIds.Previous]: {
    description: "The measure value for the previous dimension member relative to the current dimension member.",
    expression: "([${Dim}].CurrentMember.prevMember, [Measures].currentMember)",
    useInputMetricFormat: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsPrevious]: {
    description: `Current measure value minus the previous Member's measure value.`,
    expression:
      "([${Dim}].CurrentMember, [Measures].currentMember) - ([${Dim}].CurrentMember.prevMember, [Measures].currentMember)",
    useInputMetricFormat: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsPreviousPct]: {
    description: `Current measure value minus the previous Member's measure value expressed as a percent of the Prev value.`,
    expression:
      "(([${Dim}].CurrentMember, [Measures].currentMember) - ([${Dim}].CurrentMember.prevMember, [Measures].currentMember)) / ([${Dim}].CurrentMember.prevMember, [Measures].currentMember)",
    defaultFormat: YamlFormatString.Percent,
  },
  [CalculationMembersTemplatesIds.Next]: {
    description: "The measure value for the next dimension member relative to the current dimension member.",
    expression: "([${Dim}].CurrentMember.nextMember, [Measures].currentMember)",
    useInputMetricFormat: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsNext]: {
    description: `Current measure value minus the Next Member's measure value.`,
    expression:
      "([${Dim}].CurrentMember, [Measures].currentMember) - ([${Dim}].CurrentMember.nextMember, [Measures].currentMember)",
    useInputMetricFormat: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsNextPct]: {
    description: `Current measure value minus the Next Member's measure value expressed as a percent of the Next value.`,
    expression:
      "(([${Dim}].CurrentMember, [Measures].currentMember) - ([${Dim}].CurrentMember.nextMember, [Measures].currentMember)) / ([${Dim}].CurrentMember.nextMember, [Measures].currentMember)",
    defaultFormat: YamlFormatString.Percent,
  },
  [CalculationMembersTemplatesIds.PctOfParent]: {
    description: `The measure's value as a percent of the dimension member's total value.`,
    expression:
      "([${Dim}].CurrentMember, [Measures].currentMember) / ([${Dim}].CurrentMember.parent, [Measures].currentMember)",
    defaultFormat: YamlFormatString.Percent,
  },
  [CalculationMembersTemplatesIds.PctOfTotal]: {
    description: `The measure's value as a percent of the dimension's total value.`,
    expression: "([${Dim}].CurrentMember, [Measures].currentMember) / ([${Dim}].[All], [Measures].currentMember)",
    defaultFormat: YamlFormatString.Percent,
  },
  [CalculationMembersTemplatesIds.LastYear]: {
    description: `Last Year's value for the current dimension member.`,
    expression: "(ParallelPeriod([${Dim}].TimeYears, 1, [${Dim}].CurrentMember), [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsLastYear]: {
    description: `Current value minus Last Year's value for the given dimension member.`,
    expression:
      "(([${Dim}].CurrentMember, [Measures].currentMember) - (ParallelPeriod([${Dim}].TimeYears, 1, [${Dim}].CurrentMember), [Measures].currentMember ))",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.CurrentVsLastYearPct]: {
    description: `Current value minus Last Year's value for the given dimension member expressed as a percent of Last Year's value.`,
    expression:
      "(([${Dim}].CurrentMember, [Measures].currentMember) - (ParallelPeriod([${Dim}].TimeYears, 1, [${Dim}].CurrentMember), [Measures].currentMember )) / (ParallelPeriod([${Dim}].TimeYears, 1, [${Dim}].CurrentMember), [Measures].currentMember)",
    defaultFormat: YamlFormatString.Percent,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.YearToDate]: {
    description: `Year to Date aggregation of [Measures] using each measure's aggregation function. Works for each level of the hierarchy, constraining each member to the set of siblings within the Ancestor Year.`,
    expression: "Aggregate(PeriodsToDate([${Dim}].TimeYears, [${Dim}].CurrentMember),[Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.QuarterToDate]: {
    description: `Quarter to Date aggregation of [Measures] using each measure's aggregation function. Works for each level of the hierarchy, constraining each member to the set of siblings within the Ancestor Quarter.`,
    expression: "Aggregate(PeriodsToDate([${Dim}].TimeQuarters, [${Dim}].CurrentMember),[Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MonthToDate]: {
    description: `Month to Date aggregation of [Measures] using each measure's aggregation function. Works for each level of the hierarchy, constraining each member to the set of siblings within the Ancestor Month.`,
    expression: "Aggregate(PeriodsToDate([${Dim}].TimeMonths, [${Dim}].CurrentMember),[Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MonthMovingAverage3Month]: {
    description: "3 Month Moving Average. Works for the Month Level and below.",
    expression:
      "Avg(ParallelPeriod([${Dim}].TimeMonths, 2, [${Dim}].CurrentMember):[${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MovingAverage30Period]: {
    description:
      "30 Period Moving Average. Periods depend on the level of evaluation. If requested at the Day level, this is a 30 Day Average. At the week level, this is a 30 week average.",
    expression: "Avg([${Dim}].CurrentMember.Lag(29):[${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MovingAverage5Period]: {
    description:
      "5 Period Moving Average. Periods depend on the level of evaluation. If requested at the Day level, this is a 5 Day Average. At the week level, this is a 5 week average.",
    expression: "Avg([${Dim}].CurrentMember.Lag(4):[${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MovingStdDev30Period]: {
    description:
      "30 Period Moving Standard Deviation. Periods depend on the level of evaluation. If requested at the Day level, this is the Stdev of 30 daily records. At the week level, this is the Stdev of 30 weekly records.",
    expression: "Stdev([${Dim}].CurrentMember.Lag(29):[${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
  [CalculationMembersTemplatesIds.MovingStdDev5Period]: {
    description:
      "5 Period Moving Standard Deviation. Periods depend on the level of evaluation. If requested at the Day level, this is the Stdev of 5 daily records. At the week level, this is the Stdev of 5 weekly records.",
    expression: "Stdev([${Dim}].CurrentMember.Lag(4):[${Dim}].CurrentMember, [Measures].currentMember)",
    useInputMetricFormat: true,
    validOnlyForTimeDim: true,
  },
};

export function replaceDimNameInTemplateExpression(templateExpression: string, dimensionName: string): string {
  return templateExpression.replace(/\${Dim}/g, dimensionName);
}
