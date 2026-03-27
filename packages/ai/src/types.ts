export type RecommendationSourceIssue = {
  ruleKey: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedUrl: string;
  impactScore: number;
};

export type AiRecommendationRecord = {
  title: string;
  summary: string;
  rationale: string;
  actions: string[];
  sourceRuleKeys: string[];
  model: string;
};

export type AiRecommendationRequest = {
  projectName: string;
  domain: string;
  score: number;
  issues: RecommendationSourceIssue[];
};

export interface AiRecommendationService {
  generateProjectRecommendations(input: AiRecommendationRequest): Promise<AiRecommendationRecord[]>;
}
