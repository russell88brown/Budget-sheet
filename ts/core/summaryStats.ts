export type SeriesStats = {
  min: number;
  max: number;
  minDate: unknown;
  maxDate: unknown;
  start: number;
  end: number;
  netChange: number;
};

export function valuesWithinTolerance(
  left: unknown,
  right: unknown,
  tolerance = 0.01
): boolean {
  const lhs = typeof left === "number" ? left : 0;
  const rhs = typeof right === "number" ? right : 0;
  return Math.abs(lhs - rhs) <= tolerance;
}

export function countDaysBelow(rows: unknown[][], index: number, threshold: number): number {
  return (rows || []).reduce((count, row) => {
    const value = Number((row && row[index]) || 0);
    return count + (value < threshold ? 1 : 0);
  }, 0);
}

export function computeSeriesStats(
  rows: unknown[][],
  index: number,
  roundMoney: (value: unknown) => number
): SeriesStats {
  if (!rows || !rows.length) {
    return {
      min: roundMoney(0),
      max: roundMoney(0),
      minDate: null,
      maxDate: null,
      start: roundMoney(0),
      end: roundMoney(0),
      netChange: roundMoney(0),
    };
  }

  let minValue = Number((rows[0] && rows[0][index]) || 0);
  let maxValue = Number((rows[0] && rows[0][index]) || 0);
  let minDate = rows[0] && rows[0][0];
  let maxDate = rows[0] && rows[0][0];
  const startValue = Number((rows[0] && rows[0][index]) || 0);
  const endValue = Number((rows[rows.length - 1] && rows[rows.length - 1][index]) || 0);

  (rows || []).forEach((row) => {
    const value = Number((row && row[index]) || 0);
    if (value < minValue) {
      minValue = value;
      minDate = row && row[0];
    }
    if (value > maxValue) {
      maxValue = value;
      maxDate = row && row[0];
    }
  });

  return {
    min: roundMoney(minValue),
    max: roundMoney(maxValue),
    minDate,
    maxDate,
    start: roundMoney(startValue),
    end: roundMoney(endValue),
    netChange: roundMoney(endValue - startValue),
  };
}
