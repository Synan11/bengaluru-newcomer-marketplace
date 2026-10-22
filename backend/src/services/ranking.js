/**
 * Verified Local Assistance Marketplace for City Newcomers
 * Module M4: Explainable Trust-Aware Matching & Ranking Algorithm
 * Based on Section 7 of Blueprint
 * 
 * Formula:
 * Score = 0.40 * S + 0.20 * L + 0.20 * T + 0.10 * G + 0.10 * A
 * 
 * S (Service coverage): (needs the expert offers) / (needs requested)
 * L (Area coverage): 1 if expert knows requested area, else 0 (1 if no area requested)
 * T (Trust score): Bayesian smoothed rating rescaled to 0..1
 *     smoothed = (C * m + ratingSum) / (C + ratingCount)
 *     T = (smoothed - 1) / 4
 *     C = 5 (prior strength), m = 4.0 (platform baseline)
 * G (Language): (matched requested languages) / (total requested languages) (1 if none requested)
 * A (Availability): 1 if free at requested weekday + time_slot, else 0 (1 if none requested)
 */

const WEIGHTS = {
  service: 0.40,
  area: 0.20,
  trust: 0.20,
  lang: 0.10,
  avail: 0.10
};

const DEFAULT_C = 5;
const DEFAULT_M = 4.0;

/**
 * Calculates smoothed Bayesian trust score rescaled to [0, 1]
 */
function calculateTrust(expert, m = DEFAULT_M, C = DEFAULT_C) {
  const ratingSum = Number(expert.ratingSum || expert.rating_sum || 0);
  const ratingCount = Number(expert.ratingCount || expert.rating_count || 0);

  const smoothed = (C * m + ratingSum) / (C + ratingCount);
  const normalizedT = (smoothed - 1) / 4; // Rescale from 1..5 range to 0..1 range
  return {
    smoothedRating: Number(smoothed.toFixed(2)),
    trustScore: normalizedT
  };
}

/**
 * Computes individual component scores, final aggregate score, and explainable chips
 */
function scoreExpert(expert, request, platformAverage = DEFAULT_M, C = DEFAULT_C) {
  const needsRequested = request.needs || [];
  const expertServices = expert.services instanceof Set 
    ? expert.services 
    : new Set(expert.services || []);

  const expertAreas = expert.areas instanceof Set 
    ? expert.areas 
    : new Set(expert.areas || []);

  const expertLanguages = expert.languages instanceof Set 
    ? expert.languages 
    : new Set(expert.languages || []);

  const expertSlots = expert.freeSlots instanceof Set 
    ? expert.freeSlots 
    : new Set(expert.freeSlots || []);

  // 1. S: Service Coverage (0.40)
  let S = 1.0;
  let matchedNeedsCount = 0;
  if (needsRequested.length > 0) {
    matchedNeedsCount = needsRequested.filter(n => expertServices.has(n)).length;
    S = matchedNeedsCount / needsRequested.length;
  }

  // 2. L: Area Match (0.20)
  let L = 1.0;
  let areaMatched = false;
  if (request.areaId) {
    areaMatched = expertAreas.has(request.areaId);
    L = areaMatched ? 1.0 : 0.0;
  }

  // 3. T: Trust (0.20)
  const { smoothedRating, trustScore: T } = calculateTrust(expert, platformAverage, C);

  // 4. G: Language Match (0.10)
  let G = 1.0;
  let matchedLangCount = 0;
  const requestedLanguages = request.languages || [];
  if (requestedLanguages.length > 0) {
    matchedLangCount = requestedLanguages.filter(l => expertLanguages.has(l)).length;
    G = matchedLangCount / requestedLanguages.length;
  }

  // 5. A: Availability Match (0.10)
  let A = 1.0;
  let slotMatched = false;
  if (request.slot) {
    // request.slot format: "Saturday_morning" or similar
    slotMatched = expertSlots.has(request.slot);
    A = slotMatched ? 1.0 : 0.0;
  }

  const finalScore = (
    WEIGHTS.service * S +
    WEIGHTS.area * L +
    WEIGHTS.trust * T +
    WEIGHTS.lang * G +
    WEIGHTS.avail * A
  );

  // Generate explainability reason chips
  const reasonChips = [];

  if (needsRequested.length > 0) {
    if (S === 1.0) {
      reasonChips.push(`Covers all ${needsRequested.length} requested needs`);
    } else if (matchedNeedsCount > 0) {
      reasonChips.push(`Covers ${matchedNeedsCount} of ${needsRequested.length} needs`);
    }
  }

  if (request.areaId && areaMatched) {
    reasonChips.push(`Knows ${request.areaName || 'requested area'}`);
  }

  const ratingCount = Number(expert.ratingCount || expert.rating_count || 0);
  if (ratingCount === 0) {
    reasonChips.push(`New Verified Expert (Neutral ${smoothedRating} prior)`);
  } else {
    reasonChips.push(`${smoothedRating} rating (${ratingCount} ${ratingCount === 1 ? 'review' : 'reviews'})`);
  }

  if (requestedLanguages.length > 0 && matchedLangCount > 0) {
    reasonChips.push(`Speaks ${requestedLanguages.join(', ')}`);
  }

  if (request.slot && slotMatched) {
    const [day, time] = request.slot.split('_');
    reasonChips.push(`Free ${day || ''} ${time || ''}`.trim());
  }

  return {
    score: Number(finalScore.toFixed(3)),
    rawScore: finalScore,
    components: {
      S: Number(S.toFixed(3)),
      L,
      T: Number(T.toFixed(3)),
      G: Number(G.toFixed(3)),
      A
    },
    smoothedRating,
    ratingCount,
    reasonChips
  };
}

/**
 * Filter, score, and rank a list of candidate experts
 */
function rankExperts(experts, request, options = {}) {
  const platformAverage = options.platformAverage || DEFAULT_M;
  const C = options.C || DEFAULT_C;
  const isStrict = Boolean(request.strict);

  let candidates = [...experts];

  // If strict mode is enabled, non-zero matches are enforced as hard filters
  if (isStrict) {
    candidates = candidates.filter(expert => {
      const expertServices = new Set(expert.services || []);
      const expertAreas = new Set(expert.areas || []);
      const expertLanguages = new Set(expert.languages || []);
      const expertSlots = new Set(expert.freeSlots || []);

      if (request.needs && request.needs.length > 0) {
        const coversAll = request.needs.every(n => expertServices.has(n));
        if (!coversAll) return false;
      }
      if (request.areaId && !expertAreas.has(request.areaId)) {
        return false;
      }
      if (request.languages && request.languages.length > 0) {
        const speaksAny = request.languages.some(l => expertLanguages.has(l));
        if (!speaksAny) return false;
      }
      if (request.slot && !expertSlots.has(request.slot)) {
        return false;
      }
      return true;
    });
  }

  // Score each expert
  const scored = candidates.map(expert => {
    const evaluation = scoreExpert(expert, request, platformAverage, C);
    return {
      ...expert,
      ranking: evaluation
    };
  });

  // Sort by score (descending), then by ratingCount (descending) as tiebreaker
  scored.sort((a, b) => {
    if (b.ranking.rawScore !== a.ranking.rawScore) {
      return b.ranking.rawScore - a.ranking.rawScore;
    }
    return (b.rating_count || b.ratingCount || 0) - (a.rating_count || a.ratingCount || 0);
  });

  return scored;
}

/**
 * Sensitivity Analysis for Defense in College Viva / Project Review
 * Changes each weight by +/- 10% and verifies how often top-3 order remains stable
 */
function performSensitivityAnalysis(experts, request, delta = 0.10) {
  const baseline = rankExperts(experts, request).slice(0, 3).map(e => e.expert_id || e.id);
  const variations = [];
  const weightKeys = Object.keys(WEIGHTS);

  for (const key of weightKeys) {
    for (const sign of [-1, 1]) {
      const modifiedWeights = { ...WEIGHTS, [key]: Math.max(0, WEIGHTS[key] + sign * delta) };
      // Normalize weights so sum is 1.0
      const total = Object.values(modifiedWeights).reduce((a, b) => a + b, 0);
      for (const k of weightKeys) modifiedWeights[k] /= total;

      // Custom ranking with altered weights
      const ranked = experts.map(e => {
        const evalRes = scoreExpert(e, request);
        const comp = evalRes.components;
        const alteredScore = (
          modifiedWeights.service * comp.S +
          modifiedWeights.area * comp.L +
          modifiedWeights.trust * comp.T +
          modifiedWeights.lang * comp.G +
          modifiedWeights.avail * comp.A
        );
        return { id: e.expert_id || e.id, alteredScore };
      }).sort((a, b) => b.alteredScore - a.alteredScore);

      const top3 = ranked.slice(0, 3).map(e => e.id);
      const isIdentical = JSON.stringify(top3) === JSON.stringify(baseline);
      variations.push({
        weightAdjusted: key,
        change: sign > 0 ? `+${delta * 100}%` : `-${delta * 100}%`,
        weights: modifiedWeights,
        top3Result: top3,
        stableWithBaseline: isIdentical
      });
    }
  }

  const stableCount = variations.filter(v => v.stableWithBaseline).length;
  return {
    baselineTop3: baseline,
    totalTests: variations.length,
    stableTests: stableCount,
    stabilityPercentage: Number(((stableCount / variations.length) * 100).toFixed(1)),
    variations
  };
}

module.exports = {
  WEIGHTS,
  DEFAULT_C,
  DEFAULT_M,
  calculateTrust,
  scoreExpert,
  rankExperts,
  performSensitivityAnalysis
};
