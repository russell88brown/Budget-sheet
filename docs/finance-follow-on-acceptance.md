# Finance follow-on synthetic evidence

Prepared against [PR #22](https://github.com/russell88brown/Budget-sheet/pull/22)
at `07bfa140e8b2c3aec2fa3e34dc066dc54037a1e1`. Every account, identifier, amount
and date in the fixtures is invented. No private workbook or financial account
interface was used.

The fixture file is `tests/fixtures/finance-follow-on-cases.json`. The new
`tests/financeFollowOnAcceptance.test.ts` imports the existing
`ts/core/journalEventApplication` module and follows the repository's assert-based
test convention. The current test runner discovers every `tests/*.test.ts` file,
so no package.json change is needed. With existing dependencies installed, the
focused command is `npm exec tsx -- tests/financeFollowOnAcceptance.test.ts`.

| Case | Desired canonical result | Observed module boundary |
| --- | --- | --- |
| Posted card payment seen twice | Count 125 once: cash 875, card -375 | Two raw transfer applications give cash 750, card -250. The module is not a duplicate detector. |
| Two reminders for one bill | One 80 expense: cash 920 | Two raw expense applications give cash 840. Reminder identity differs from obligation identity. |
| Notice balance release | Spendable cash 400 before 10 April 2030; 1,000 on/after release; total cash 1,000 throughout | Availability is a test oracle only; BudgetAccount and the inspected Accounts schema have no release-date field. |
| Paid booking in opening cash | Paid 200 contributes zero remaining; unpaid 150 leaves cash 650 | Applying both costs again leaves 450. Opening-position reconciliation belongs before future event generation. |

Records, availability_overlay and canonicalisation are explicitly proposed test
contracts. Only canonical_events use existing BudgetEvent fields. Test-local
normalisation is an oracle, not a production feature. It rejects a conflicting
duplicate payment amount and bill due date, and compares complete canonical
events rather than just their totals. The raw travel comparison demonstrates
double deduction only; it does not test historical date filtering.

The exact candidate test passed offline on Node 26.8.2 against the pinned source
using native type stripping and an external resolver for the local module path.
The existing event-application test also passed separately. The focused tsx
command, full npm test, typecheck, build, Apps Script suite and deployed workbook
were not run. No dependencies were installed. Candidate sprint documents passed
the pinned sprint checker in a temporary verification tree; the candidate does
not change codex/current-sprint or package.json.

The tested function applies one event with injected rounding/account-key/transfer
callbacks. The callbacks follow the existing module-test style. This evidence
does not cover the production transfer resolver, recurrence, sorting, complete
journal generation, summaries, posted transaction import or a deployment.

Budget-sheet owns the domain schema, implementation and synthetic tests. Personal
Governance #70 should link this owning candidate and its evidence. The current
publication proposal extends draft #22 at its verified head, retaining its main
target and existing workbook map. Next implementation tasks are stable payment/bill identity,
conflict handling, account availability granularity and explicit reconciliation
of paid bookings to opening balances.
