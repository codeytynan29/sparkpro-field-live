import type { WidgetId } from '../../content/types'
import type { DrillCategory } from '../../engine/drills'
import type { TableRules } from '../../engine/rules'
import { BustTable, CardValues, ChipColors, DealerPlay, HandBuilder, PlayerBust, RoundFlow, TableLayout, TotalQuiz } from './basics'
import {
  ChartWidget, CountDrill, DeckEstimation, DecisionDrill, EvCompare, HouseEdge, IndexPlays, InsuranceMath, PayoutCalc,
  PerfectPairsWidget, RemovalEffects, RuinSim, SignalDrill, SignalsDemo, TcDrill, TwentyOnePlusThreeWidget, VarianceSim,
} from './advanced'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any> | undefined

export function Widget({ id, props }: { id: WidgetId; props?: Props }) {
  const p = props ?? {}
  switch (id) {
    case 'card-values': return <CardValues />
    case 'hand-builder': return <HandBuilder />
    case 'total-quiz': return <TotalQuiz count={p.count} />
    case 'dealer-play': return <DealerPlay />
    case 'bust-table': return <BustTable />
    case 'player-bust': return <PlayerBust />
    case 'table-layout': return <TableLayout />
    case 'chip-colors': return <ChipColors />
    case 'signals-demo': return <SignalsDemo style={p.style} />
    case 'signal-drill': return <SignalDrill style={p.style} count={p.count} />
    case 'ev-compare': return <EvCompare cards={p.cards} up={p.up} />
    case 'insurance-math': return <InsuranceMath />
    case 'payout-calc': return <PayoutCalc mode={p.mode} />
    case 'house-edge': return <HouseEdge />
    case 'variance-sim': return <VarianceSim />
    case 'ruin-sim': return <RuinSim />
    case 'count-drill': return <CountDrill mode={p.mode} count={p.count} />
    case 'tc-drill': return <TcDrill count={p.count} />
    case 'deck-estimation': return <DeckEstimation count={p.count} />
    case 'strategy-chart': return <ChartWidget editable={p.editable} />
    case 'perfect-pairs': return <PerfectPairsWidget />
    case 'twenty-one-plus-three': return <TwentyOnePlusThreeWidget />
    case 'index-plays': return <IndexPlays />
    case 'round-flow': return <RoundFlow />
    case 'decision-drill': return <DecisionDrill category={p.category as DrillCategory} count={p.count} rules={p.rules as Partial<TableRules>} />
    case 'removal-effects': return <RemovalEffects />
    default: return <p className="text-sm text-cream-300/60">This exercise is unavailable.</p>
  }
}
