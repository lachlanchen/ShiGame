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
  work: string;
  section: string;
  author?: string;
  date?: string;
  note: LocalizedText;
  claimStatus: "primary-account" | "later-compilation" | "dramatic-reconstruction";
}

export interface MapSite {
  id: string;
  name: LocalizedText;
  x: number;
  z: number;
  status: "active" | "known" | "future";
}

export interface Character {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  historical: boolean;
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
  sites: MapSite[];
  characters: Character[];
  sources: SourceRef[];
  nodes: CampaignNode[];
}

export interface ChoiceRecord {
  nodeId: string;
  choiceId: string;
  conditionId: string;
  before: Resources;
  afterChoice: Resources;
  pressureEffects: Partial<Resources>;
  afterPressure: Resources;
  conditionEffects: Partial<Resources>;
  after: Resources;
}

export interface GameState {
  saveVersion: 3;
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
  playerDeltas: Partial<Resources>;
  pressureDeltas: Partial<Resources>;
  fieldDeltas: Partial<Resources>;
  deltas: Partial<Resources>;
}
