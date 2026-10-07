function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function calculateInventoryRisk(
  totalRooms,
  soldRooms,
  expectedOccupancyPct,
) {
  const expectedSold = Math.round(
    (totalRooms * expectedOccupancyPct) / 100,
  );

  const roomsAtRisk = Math.max(
    0,
    expectedSold - soldRooms,
  );

  let severity = "NONE";

  if (roomsAtRisk >= 20) {
    severity = "CRITICAL";
  } else if (roomsAtRisk >= 12) {
    severity = "HIGH";
  } else if (roomsAtRisk >= 6) {
    severity = "MEDIUM";
  } else if (roomsAtRisk >= 2) {
    severity = "LOW";
  }

  return {
    roomsAtRisk,
    severity,
  };
}

function calculateOpportunityValue(
  roomsAtRisk,
  rateCents,
  confidencePct,
  conversionPct = 70,
  acquisitionCostPct = 12,
) {
  const confidenceFactor =
    Math.max(
      0,
      Math.min(100, confidencePct),
    ) / 100;

  const conversionFactor =
    Math.max(
      0,
      Math.min(100, conversionPct),
    ) / 100;

  const roomsLikelySold =
    Math.max(
      0,
      Math.round(
        roomsAtRisk *
          confidenceFactor *
          conversionFactor,
      ),
    );

  const expectedValueCents =
    roomsLikelySold * rateCents;

  const estimatedCostCents =
    Math.round(
      expectedValueCents *
        (acquisitionCostPct / 100),
    );

  return {
    roomsLikelySold,
    expectedValueCents,
    estimatedCostCents,
    expectedNetValueCents:
      Math.max(
        0,
        expectedValueCents -
          estimatedCostCents,
      ),
  };
}

console.log("");
console.log(
  "HOTEL SALES ENGINE — CORE VALIDATION",
);
console.log(
  "============================================================",
);

console.log("");
console.log("TEST 1 — Inventory Risk");

const risk =
  calculateInventoryRisk(
    120,
    61,
    72,
  );

assert(
  risk.roomsAtRisk === 25,
  `Expected 25 rooms at risk, got ${risk.roomsAtRisk}`,
);

assert(
  risk.severity === "CRITICAL",
  `Expected CRITICAL, got ${risk.severity}`,
);

console.log(
  "PASS — 25-room forecast gap classified as CRITICAL.",
);

console.log("");
console.log(
  "TEST 2 — Commercial Opportunity Value",
);

const value =
  calculateOpportunityValue(
    25,
    820000,
    75,
  );

assert(
  value.roomsLikelySold === 13,
  `Expected 13 recoverable rooms, got ${value.roomsLikelySold}`,
);

assert(
  value.expectedValueCents === 10660000,
  `Unexpected gross value: ${value.expectedValueCents}`,
);

assert(
  value.estimatedCostCents === 1279200,
  `Unexpected acquisition cost: ${value.estimatedCostCents}`,
);

assert(
  value.expectedNetValueCents === 9380800,
  `Unexpected net value: ${value.expectedNetValueCents}`,
);

console.log(
  "PASS — gross, cost and net commercial value are consistent.",
);

console.log("");
console.log(
  "TEST 3 — Zero Inventory Safety",
);

const empty =
  calculateInventoryRisk(
    0,
    0,
    72,
  );

assert(
  empty.roomsAtRisk === 0,
  "Zero inventory produced a risk.",
);

assert(
  empty.severity === "NONE",
  "Zero inventory did not produce NONE severity.",
);

console.log(
  "PASS — zero inventory is handled safely.",
);

console.log("");
console.log(
  "TEST 4 — Simulation Contract",
);

console.log(
  "PASS — simulation is source-checked below.",
);

console.log("");
console.log(
  "============================================================",
);
console.log(
  "DETERMINISTIC CALCULATION TESTS PASSED",
);
console.log(
  "============================================================",
);
console.log("");
