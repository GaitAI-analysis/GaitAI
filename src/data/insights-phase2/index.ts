/**
 * PHASE 2 ARTICLES — the recurring series, one record per file.
 *
 * `data/insights.ts` spreads this list into `insightArticles`, so a new
 * story is one file here plus an experience record in
 * `data/insight-experiences.ts`. Order within this list does not matter: the
 * publication sorts by date, and a series orders by `seriesOrder`.
 */
import type { InsightArticle } from "../insights";
import { whenPoseEstimationLies } from "./when-pose-estimation-lies";

export const phaseTwoArticles: InsightArticle[] = [whenPoseEstimationLies];
