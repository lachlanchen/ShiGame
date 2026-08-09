export const supportedLocales = [
  "en",
  "ar",
  "de",
  "es",
  "fr",
  "ja",
  "ko",
  "ru",
  "vi",
  "zh-Hans",
  "zh-Hant",
] as const;

export type Locale = (typeof supportedLocales)[number];
export type LocalizedText = Partial<Record<Locale, string>> & { en: string; "zh-Hans": string };

export const resourceKeys = ["grain", "trust", "momentum", "people", "danger"] as const;
export type ResourceKey = (typeof resourceKeys)[number];
export type Resources = Record<ResourceKey, number>;

export interface SourceRef {
  id: string;
  editionId: string;
  work: string;
  section: string;
  locator: string;
  url?: string;
  author?: string;
  date?: string;
  note: LocalizedText;
  claimStatus: "received-account" | "later-compilation" | "strategic-text" | "dramatic-reconstruction";
  rightsStatus: "public-link-metadata-only" | "project-original";
}

export type ClaimReviewStatus = "evidence-located" | "specialist-review-required" | "authored-reconstruction";

export interface HistoricalClaim {
  id: string;
  kind: "chronology" | "event" | "institution" | "person" | "geography" | "strategic-lens" | "reconstruction";
  statement: LocalizedText;
  sourceRefs: string[];
  reviewStatus: ClaimReviewStatus;
  confidence: "high" | "medium" | "low" | "not-applicable";
  uncertainty: LocalizedText;
  gameUse: LocalizedText;
  reviewer: string;
}

export interface MapSite {
  id: string;
  name: LocalizedText;
  x: number;
  z: number;
  status: "known" | "reported" | "reference";
  summary: LocalizedText;
  uncertainty: LocalizedText;
  sourceRefs: string[];
  claimRefs: string[];
}

export interface Character {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  historical: boolean;
}

export type CommitmentStatus = "kept" | "strained" | "broken";

export interface CommitmentOutcome {
  id: string;
  choiceId: string;
  status: CommitmentStatus;
  forecast: LocalizedText;
  response: LocalizedText;
  effects: Partial<Resources>;
}

export interface PlayerCommitment {
  id: string;
  claimStatus: "dramatic-reconstruction";
  establishedByChoiceId: string;
  stakeholderId: string;
  title: LocalizedText;
  promise: LocalizedText;
  outcomes: CommitmentOutcome[];
}

export interface CommitmentSelection {
  commitment: PlayerCommitment;
  outcome: CommitmentOutcome;
}

export interface OppositionStage {
  id: string;
  minDanger: number;
  maxDanger: number;
  title?: LocalizedText;
  forecast?: LocalizedText;
  response?: LocalizedText;
  counterplay?: LocalizedText;
  effects: Partial<Resources>;
}

export interface StrategicMethod {
  id: string;
  title: LocalizedText;
  reading: LocalizedText;
}

export interface MethodReadNeutral {
  id: string;
  title: LocalizedText;
  forecast: LocalizedText;
  response: LocalizedText;
  counterplay: LocalizedText;
}

export interface MethodCountermeasure {
  id: string;
  targetMethodId: string;
  title: LocalizedText;
  forecast: LocalizedText;
  hitResponse: LocalizedText;
  missResponse: LocalizedText;
  counterplay: LocalizedText;
  effects: Partial<Resources>;
}

export interface MethodReadModel {
  claimStatus: "dramatic-reconstruction";
  minimumObservations: number;
  title: LocalizedText;
  description: LocalizedText;
  neutral: MethodReadNeutral;
  countermeasures: MethodCountermeasure[];
}

export interface MethodReadSelection {
  read: MethodReadNeutral | MethodCountermeasure;
  counts: Record<string, number>;
}

export interface OppositionModel {
  id: string;
  claimStatus: "dramatic-reconstruction";
  title?: LocalizedText;
  description?: LocalizedText;
  methods: StrategicMethod[];
  methodRead: MethodReadModel;
  stages: OppositionStage[];
}

export type PressureKind = "state" | "terrain" | "supply" | "network";

export interface PressureResponse {
  kind: PressureKind;
  warning: LocalizedText;
  reveal: LocalizedText;
  effects: Partial<Resources>;
}

export interface FieldCondition {
  id: string;
  claimStatus: "dramatic-reconstruction";
  title: LocalizedText;
  signal: LocalizedText;
  weight: number;
  effects: Partial<Resources>;
}

export interface Choice {
  id: string;
  methodId: string;
  label: LocalizedText;
  intent: LocalizedText;
  consequence: LocalizedText;
  strategy: LocalizedText;
  effects: Partial<Resources>;
  requirements?: {
    min?: Partial<Resources>;
    max?: Partial<Resources>;
  };
  pressure?: PressureResponse;
  flags?: string[];
  nextNodeId?: string;
}

export interface CampaignNode {
  id: string;
  dateLabel: LocalizedText;
  siteId: string;
  speakerId: string;
  title: LocalizedText;
  context: LocalizedText;
  dialogue: LocalizedText;
  sourceRefs: string[];
  claimRefs: string[];
  conditions: FieldCondition[];
  choices: Choice[];
}

export interface Campaign {
  schemaVersion: number;
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  startNodeId: string;
  initialResources: Resources;
  commitments: PlayerCommitment[];
  opposition: OppositionModel;
  sites: MapSite[];
  characters: Character[];
  sources: SourceRef[];
  claims: HistoricalClaim[];
  nodes: CampaignNode[];
}

export interface ChoiceRecord {
  nodeId: string;
  choiceId: string;
  conditionId: string;
  before: Resources;
  afterChoice: Resources;
  commitmentId?: string;
  commitmentOutcomeId?: string;
  commitmentEffects: Partial<Resources>;
  afterCommitment: Resources;
  pressureEffects: Partial<Resources>;
  afterPressure: Resources;
  oppositionStageId?: string;
  oppositionEffects: Partial<Resources>;
  afterOpposition: Resources;
  methodId?: string;
  methodReadId?: string;
  methodReadMatched?: boolean;
  methodReadEffects: Partial<Resources>;
  afterMethodRead: Resources;
  conditionEffects: Partial<Resources>;
  after: Resources;
}

export interface GameState {
  saveVersion: 6;
  legacyDecisionCount: number;
  preMethodReadDecisionCount: number;
  preCommitmentDecisionCount: number;
  campaignId: string;
  seed: number;
  currentNodeId: string;
  resources: Resources;
  flags: string[];
  history: ChoiceRecord[];
  completed: boolean;
  failureReason?: "captured" | "scattered";
}

export interface ChoiceResolution {
  state: GameState;
  node: CampaignNode;
  choice: Choice;
  condition: FieldCondition;
  oppositionStage?: OppositionStage;
  method: StrategicMethod;
  methodRead?: MethodReadSelection;
  methodReadMatched: boolean;
  commitment?: CommitmentSelection;
  playerDeltas: Partial<Resources>;
  commitmentDeltas: Partial<Resources>;
  pressureDeltas: Partial<Resources>;
  oppositionDeltas: Partial<Resources>;
  methodReadDeltas: Partial<Resources>;
  fieldDeltas: Partial<Resources>;
  deltas: Partial<Resources>;
}
