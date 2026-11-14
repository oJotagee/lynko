import { COMPARISON } from './plan-copy'

export function PlanComparison() {
  return (
    <section
      aria-labelledby="compare-plans"
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="p-6 sm:p-8">
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground">COMPARE OS PLANOS</p>
        <h2 id="compare-plans" className="mt-2 text-xl font-semibold">
          Todos os detalhes, lado a lado.
        </h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-[11px] tracking-[0.14em] text-muted-foreground">
          <tr>
            <th scope="col" className="px-6 py-4 font-normal sm:px-8">
              RECURSO
            </th>
            <th scope="col" className="w-1/4 px-4 py-4 font-normal">
              GRÁTIS
            </th>
            <th scope="col" className="w-1/4 px-4 py-4 font-normal">
              PRO
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.feature} className="border-t border-border">
              <th scope="row" className="px-6 py-4 text-left font-medium sm:px-8">
                {row.feature}
              </th>
              <td className="px-4 py-4">{row.free}</td>
              <td className="px-4 py-4 font-medium text-ring">{row.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
