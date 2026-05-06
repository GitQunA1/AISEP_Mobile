import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Radar Chart for Mobile using react-native-svg
 * Ported logic from Web's recharts implementation.
 */
export default function AIAnalysisRadarChart({ auditedItems, labelMapper = (c) => c }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const size = SCREEN_WIDTH - 80;
  const center = size / 2;
  const radius = center * 0.7;

  const data = useMemo(() => {
    if (!Array.isArray(auditedItems) || auditedItems.length === 0) return [];
    return auditedItems.map((row) => {
      const max = Number(row.maxScore ?? row.MaxScore ?? 1) || 1;
      const base = Number(row.baseScore ?? row.BaseScore ?? 0);
      const fin = Number(row.score ?? row.finalScore ?? row.FinalScore ?? 0);
      const crit = row.criteria ?? row.Criteria ?? '';
      return {
        label: labelMapper(crit),
        declaredPct: Math.min(100, Math.max(0, (base / max) * 100)),
        auditedPct: Math.min(100, Math.max(0, (fin / max) * 100)),
      };
    });
  }, [auditedItems, labelMapper]);

  if (data.length < 3) return null;

  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (pct, angle) => {
    const r = (pct / 100) * radius;
    return {
      x: center + r * Math.sin(angle),
      y: center - r * Math.cos(angle),
    };
  };

  const declaredPoints = data.map((d, i) => getPoint(d.declaredPct, i * angleStep));
  const auditedPoints = data.map((d, i) => getPoint(d.auditedPct, i * angleStep));

  const declaredPolygon = declaredPoints.map(p => `${p.x},${p.y}`).join(' ');
  const auditedPolygon = auditedPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg height={size} width={size}>
        {/* Grids */}
        {[20, 40, 60, 80, 100].map((tick) => (
          <G key={`grid-${tick}`}>
            <Polygon
              points={data.map((_, i) => {
                const p = getPoint(tick, i * angleStep);
                return `${p.x},${p.y}`;
              }).join(' ')}
              stroke={colors.border}
              strokeWidth="1"
              fill="none"
            />
          </G>
        ))}

        {/* Axis Lines and Labels */}
        {data.map((d, i) => {
          const angle = i * angleStep;
          const p = getPoint(100, angle);
          const labelP = getPoint(115, angle);
          
          return (
            <G key={`axis-${i}`}>
              <Line
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke={colors.border}
                strokeWidth="1"
              />
              <SvgText
                x={labelP.x}
                y={labelP.y}
                fill={colors.secondaryText}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}

        {/* Declared Path (Dashed) */}
        <Polygon
          points={declaredPolygon}
          fill="rgba(148, 163, 184, 0.1)"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Audited Path (Solid) */}
        <Polygon
          points={auditedPolygon}
          fill={colors.primary + '40'}
          stroke={colors.primary}
          strokeWidth="2"
        />

        {/* Dots for Audited */}
        {auditedPoints.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="3" fill={colors.primary} />
        ))}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 2, backgroundColor: '#94a3b8', borderStyle: 'dashed', borderWidth: 1, borderColor: '#94a3b8' }} />
          <Text style={{ fontSize: 11, color: colors.secondaryText }}>Khai báo</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 2, backgroundColor: colors.primary }} />
          <Text style={{ fontSize: 11, color: colors.secondaryText }}>AI Thẩm định</Text>
        </View>
      </View>
    </View>
  );
}
