const { scoreExpert, rankExperts, performSensitivityAnalysis } = require('../src/services/ranking');

console.log('====================================================');
console.log('TESTING MATCHING & RANKING ALGORITHM (SECTION 7)');
console.log('====================================================\n');

// Benchmark Request
const testRequest = {
  needs: [1, 2], // 1: PG search, 2: area walkthrough
  areaId: 10,    // Koramangala
  areaName: 'Koramangala',
  languages: [1], // Hindi
  slot: 'Saturday_morning'
};

const m = 4.0;
const C = 5;

// Candidate Experts
const expertA = {
  id: 'A',
  name: 'Expert A (New)',
  services: [1, 2],
  areas: [10],
  languages: [1],
  freeSlots: ['Saturday_morning'],
  ratingSum: 5.0,
  ratingCount: 1
};

const expertB = {
  id: 'B',
  name: 'Expert B (Established)',
  services: [1, 2],
  areas: [10],
  languages: [1],
  freeSlots: ['Saturday_morning'],
  ratingSum: 50 * 4.8, // 240
  ratingCount: 50
};

const expertC = {
  id: 'C',
  name: 'Expert C (Busy)',
  services: [1], // Only 1 of 2 needs
  areas: [10],
  languages: [1],
  freeSlots: ['Sunday_evening'], // Not available Saturday morning
  ratingSum: 30 * 4.9, // 147
  ratingCount: 30
};

const resA = scoreExpert(expertA, testRequest, m, C);
const resB = scoreExpert(expertB, testRequest, m, C);
const resC = scoreExpert(expertC, testRequest, m, C);

console.log('Calculated Expert Scores:');
console.log('Expert A:', {
  smoothed: resA.smoothedRating,
  score: resA.score,
  expectedSmoothed: 4.17,
  expectedScore: 0.958
});
console.log('Expert B:', {
  smoothed: resB.smoothedRating,
  score: resB.score,
  expectedSmoothed: 4.73,
  expectedScore: 0.986
});
console.log('Expert C:', {
  smoothed: resC.smoothedRating,
  score: resC.score,
  expectedSmoothed: 4.77,
  expectedScore: 0.689
});

// Verification assertions
const tolerance = 0.003;
function checkClose(val, expected, label) {
  if (Math.abs(val - expected) > tolerance) {
    throw new Error(`FAIL: ${label} expected ${expected}, got ${val}`);
  }
}

checkClose(resA.smoothedRating, 4.17, 'Expert A smoothed rating');
checkClose(resA.score, 0.958, 'Expert A score');

checkClose(resB.smoothedRating, 4.73, 'Expert B smoothed rating');
checkClose(resB.score, 0.986, 'Expert B score');

checkClose(resC.smoothedRating, 4.77, 'Expert C smoothed rating');
checkClose(resC.score, 0.689, 'Expert C score');

const ranked = rankExperts([expertA, expertB, expertC], testRequest, { platformAverage: m, C });
console.log('\nRanking Order Result:');
ranked.forEach((e, idx) => {
  console.log(` Rank ${idx + 1}: ${e.name} -> Score: ${e.ranking.score} (Chips: ${e.ranking.reasonChips.join(' | ')})`);
});

if (ranked[0].id !== 'B' || ranked[1].id !== 'A' || ranked[2].id !== 'C') {
  throw new Error(`FAIL: Expected ranking order B, A, C. Got ${ranked.map(r => r.id).join(', ')}`);
}

console.log('\nRunning Weight Sensitivity Analysis (+/- 10%)...');
const sensitivity = performSensitivityAnalysis([expertA, expertB, expertC], testRequest, 0.10);
console.log(`Sensitivity Results: ${sensitivity.stableTests}/${sensitivity.totalTests} tests kept identical Top-3 (${sensitivity.stabilityPercentage}% stable).`);

console.log('\n ALL RANKING UNIT TESTS PASSED SUCCESSFULLY! Exact match to blueprint specifications.\n');
