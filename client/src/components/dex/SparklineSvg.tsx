type Props = { values: number[]; positive?: boolean };

export function SparklineSvg({ values, positive }: Props) {
  if (!values.length) return <div className="h-7 w-20" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = max === min ? 1 : max - min;
  const w = 80;
  const h = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / pad) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = positive === false ? "#ff5c5c" : positive === true ? "#3dd68c" : "#00d9c0";
  return (
    <svg className="h-7 w-20" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} strokeWidth="1.2" points={pts} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
