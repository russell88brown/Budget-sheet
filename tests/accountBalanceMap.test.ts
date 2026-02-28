import assert from "node:assert/strict";

import { buildAccountBalanceMap } from "../ts/core/accountBalanceMap";

const map = buildAccountBalanceMap(
  [
    { name: "Cash", balance: "100" },
    { name: "Card", balance: -20 },
  ],
  (v) => String(v || "").toLowerCase(),
  (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
);

assert.deepEqual(map, { cash: 100, card: -20 });
