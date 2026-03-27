import OpenAI from "openai";

import type {
  AiRecommendationRecord,
  AiRecommendationRequest,
  AiRecommendationService,
  RecommendationSourceIssue
} from "./types";

function sortIssues(issues: RecommendationSourceIssue[]) {
  return [...issues].sort((left, right) => right.impactScore - left.impactScore);
}

function heuristicRecommendation(issue: RecommendationSourceIssue): AiRecommendationRecord {
  return {
    title: `Fix ${issue.title.toLowerCase()}`,
    summary: `${issue.summary} Prioritize this on ${issue.affectedUrl}.`,
    rationale: `This issue is marked ${issue.severity} and has an impact score of ${issue.impactScore}, so it should move before lower-impact cleanup tasks.`,
    actions: [
      `Review ${issue.affectedUrl} and confirm why the ${issue.ruleKey} rule fired.`,
      "Apply the technical fix and validate it on the rendered page.",
      "Re-run the crawl to confirm the issue count drops."
    ],
    sourceRuleKeys: [issue.ruleKey],
    model: "heuristic-fallback"
  };
}

export class OpenAiRecommendationService implements AiRecommendationService {
  private readonly client: OpenAI;

  constructor(private readonly apiKey: string, private readonly model = "gpt-5.4") {
    this.client = new OpenAI({ apiKey });
  }

  async generateProjectRecommendations(input: AiRecommendationRequest): Promise<AiRecommendationRecord[]> {
    if (!this.apiKey) {
      return sortIssues(input.issues).slice(0, 3).map(heuristicRecommendation);
    }

    try {
      const prompt = [
        `You are the RankForge SEO copilot.`,
        `Project: ${input.projectName}`,
        `Domain: ${input.domain}`,
        `Health score: ${input.score}`,
        "Return strict JSON shaped as an array of objects with title, summary, rationale, actions, sourceRuleKeys, and model.",
        "Use only the provided issues. Keep actions concrete and implementation-ready.",
        JSON.stringify(sortIssues(input.issues).slice(0, 8))
      ].join("\n");

      const response = await this.client.responses.create({
        model: this.model,
        input: prompt
      });
      const output = response.output_text;
      const parsed = JSON.parse(output) as Array<Omit<AiRecommendationRecord, "model"> & { model?: string }>;

      return parsed.map((entry) => ({
        ...entry,
        model: entry.model ?? this.model
      }));
    } catch {
      return sortIssues(input.issues).slice(0, 3).map(heuristicRecommendation);
    }
  }
}

export class HeuristicRecommendationService implements AiRecommendationService {
  async generateProjectRecommendations(input: AiRecommendationRequest): Promise<AiRecommendationRecord[]> {
    return sortIssues(input.issues).slice(0, 3).map(heuristicRecommendation);
  }
}
