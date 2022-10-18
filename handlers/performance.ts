import { BeatmapDecoder } from 'osu-parsers';
import { ScoreInfo } from 'osu-classes';
import { StandardRuleset } from 'osu-standard-stable';
import { TaikoRuleset } from 'osu-taiko-stable';
import { CatchRuleset } from 'osu-catch-stable';
import { ManiaRuleset } from 'osu-mania-stable';
import fs from 'fs';

export async function botCalculations(mode: number, path: string, maxCombo: number): Promise<string[]> {
  const decoder = new BeatmapDecoder();
  const parsed = decoder.decodeFromPath(path);
  let ruleset;
  switch (mode) {
    case 0:
      ruleset = new StandardRuleset();
      break;
    case 1:
      ruleset = new TaikoRuleset();
      break;
    case 2:
      ruleset = new CatchRuleset();
      break;
    case 3:
      ruleset = new ManiaRuleset();
      break;
  }

  let beatmap = ruleset.applyToBeatmap(parsed);
  let difficultyCalculator = ruleset.createDifficultyCalculator(beatmap);
  let difficulty = difficultyCalculator.calculate();
  const score_95 = new ScoreInfo({
    maxCombo: maxCombo,
    accuracy: 0.95
  });
  const score_98 = new ScoreInfo({
    accuracy: 0.98
  });
  const score_100 = new ScoreInfo({
    accuracy: 1
  });
  let calc_95 = ruleset.createPerformanceCalculator(difficulty, score_95);
  calc_95.calculateAttributes();
  let max_95 = calc_95.calculate();

  let calc_98 = ruleset.createPerformanceCalculator(difficulty, score_98);
  calc_98.calculateAttributes();
  let max_98 = calc_95.calculate();

  let calc_100 = ruleset.createPerformanceCalculator(difficulty, score_100);
  calc_100.calculateAttributes();
  let max_100 = calc_95.calculate();
  return [max_95.toString(), max_98.toString(), max_100.toString()];
}