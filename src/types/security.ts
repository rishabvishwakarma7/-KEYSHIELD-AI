export type RouteId =
  | 'overview'
  | 'live-monitor'
  | 'threat-alerts'
  | 'process-explorer'
  | 'event-timeline'
  | 'threat-hunting'
  | 'ai-analyst'
  | 'mitre-attack'
  | 'detection-rules'
  | 'incident-management'
  | 'reports'
  | 'system-health'
  | 'settings';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertCategory =
  | 'Suspicious Process Activity'
  | 'Unexpected Registry Modification'
  | 'Suspicious Driver Activity'
  | 'Unusual File Activity'
  | 'Abnormal Network Connections';

export type AlertStatus = 'New' | 'Investigating' | 'Resolved' | 'False Positive';

export type ProcessRiskLevel = 'Normal' | 'Informational' | 'Suspicious' | 'High Risk';

export type EventStatus = 'Observed' | 'Flagged' | 'Correlated' | 'Reviewed';

export interface EndpointHost {
  id: string;
  hostname: string;
  osVersion: string;
  ipAddress: string;
  department: string;
  monitoringMode: 'DEMO';
  posture: 'Elevated' | 'Guarded' | 'Nominal';
  lastCollectedEvent: string;
  sysmonVersion: string;
  agentVersion: string;
  activeAlertsCount: number;
  events24h: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  endpointId: string;
  category: AlertCategory | 'Process Telemetry' | 'Authentication Audit';
  processName: string;
  pid: number;
  source: 'Sysmon-EID1' | 'Sysmon-EID7' | 'Sysmon-EID11' | 'Sysmon-EID13' | 'Sysmon-EID3' | 'ETW-Kernel';
  severity: SeverityLevel;
  status: EventStatus;
  summary: string;
  commandLine: string;
  targetObject: string;
  mitreId?: string;
  evidenceTags: string[];
  isDemo: true;
}

export interface AnalystNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface ThreatAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: SeverityLevel;
  status: AlertStatus;
  riskScore: number;
  endpointId: string;
  processName: string;
  pid: number;
  timestamp: string;
  detectionRuleId: string;
  detectionRuleName: string;
  mitreId: string;
  mitreName: string;
  description: string;
  evidence: string[];
  relatedEventIds: string[];
  notes: AnalystNote[];
  isDemo: true;
}

export interface ProcessNode {
  pid: number;
  ppid: number | null;
  name: string;
  executablePath: string;
  creationTime: string;
  parentName: string;
  publisher: string;
  signatureStatus: 'Signed (Microsoft)' | 'Signed (Vendor)' | 'Unsigned';
  cpuPercent: number;
  memoryMb: number;
  riskLevel: ProcessRiskLevel;
  riskIndicators: string[];
  associatedEventIds: string[];
  networkDestinations: string[];
  endpointId: string;
  isDemo: true;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic:
    | 'Execution'
    | 'Persistence'
    | 'Privilege Escalation'
    | 'Defense Evasion'
    | 'Credential Access'
    | 'Discovery'
    | 'Collection'
    | 'Command and Control';
  description: string;
  telemetrySignals: string[];
  detectionRecommendations: string[];
  relatedAlertIds: string[];
  confidenceNote: string;
  coverageStatus: 'Active Rule' | 'Telemetry Partial' | 'Advisory';
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  mitreId: string;
  category: AlertCategory;
  enabled: boolean;
  lastModified: string;
  author: string;
  queryText: string;
  matchField: 'processName' | 'commandLine' | 'targetObject' | 'category';
  matchPattern: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: 'Open' | 'Containment Review' | 'Investigating' | 'Closed';
  assignedAnalyst: string;
  createdAt: string;
  updatedAt: string;
  endpointId: string;
  relatedAlertIds: string[];
  evidenceCollection: string[];
  notes: AnalystNote[];
  timeline: {
    timestamp: string;
    actor: string;
    action: string;
  }[];
  resolutionSummary: string;
  isDemo: true;
}

export type ReportType =
  | 'Security Overview'
  | 'Threat Detection Summary'
  | 'Incident Investigation'
  | 'Process Risk Analysis'
  | 'MITRE Technique Report'
  | 'Detection Performance';

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  dateRange: string;
  endpointScope: string;
  author: string;
  summary: string;
  metrics: { label: string; value: string }[];
  isDemo: true;
}

export interface SystemHealthComponent {
  id: string;
  name: string;
  layer: 'Collection' | 'Pipeline' | 'Intelligence' | 'Storage';
  demoState: 'Simulated Nominal' | 'Simulated Degraded' | 'Unconnected (Demo)';
  liveState: 'Not Connected';
  detail: string;
  lastChecked: string;
  latencyMs: number | null;
}

export interface AIAnalystStructuredResponse {
  summary: string;
  observedEvidence: string[];
  riskAssessment: string;
  mitreContext: string;
  recommendedSteps: string[];
  referencedIds: string[];
  mode: 'DEMO' | 'LIVE_GEMINI';
}

export interface AIAnalystMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  structured?: AIAnalystStructuredResponse;
  error?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  timestamp: string;
  read: boolean;
  routeTarget: RouteId;
  itemId?: string;
}

export interface AppSettings {
  glassIntensity: 'subtle' | 'balanced' | 'deep';
  reducedMotionOverride: boolean;
  liveFeedAutoAppend: boolean;
  telemetryMode: 'DEMO';
  liveAiEnabled: boolean;
}

export type InspectorSelection =
  | { kind: 'alert'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'process'; pid: number }
  | { kind: 'incident'; id: string }
  | { kind: 'mitre'; id: string };
