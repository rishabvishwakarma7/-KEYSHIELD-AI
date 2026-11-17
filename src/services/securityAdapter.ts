import type {
  AIAnalystStructuredResponse,
  AlertStatus,
  DetectionRule,
  EndpointHost,
  IncidentRecord,
  MitreTechnique,
  ProcessNode,
  SecurityEvent,
  SeverityLevel,
  ThreatAlert,
} from '../types/security';

export interface SecurityDataAdapter {
  readonly mode: 'DEMO' | 'LIVE';
  fetchEndpoints(): Promise<EndpointHost[]>;
  fetchEvents(endpointId?: string): Promise<SecurityEvent[]>;
  fetchAlerts(endpointId?: string): Promise<ThreatAlert[]>;
  fetchProcesses(endpointId?: string): Promise<ProcessNode[]>;
  fetchIncidents(): Promise<IncidentRecord[]>;
}

export interface EventFilterParams {
  search: string;
  category: string;
  severity: string;
  endpointId?: string;
  timeWindow?: 'all' | '15m' | '1h' | '24h';
  referenceIsoTime?: string;
}

const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function filterAndSortEvents(
  events: SecurityEvent[],
  params: EventFilterParams,
  sortField: 'timestamp' | 'severity' | 'processName' | 'id' = 'timestamp',
  sortDirection: 'asc' | 'desc' = 'desc',
): SecurityEvent[] {
  const query = params.search.trim().toLowerCase();
  const refTime = params.referenceIsoTime ? Date.parse(params.referenceIsoTime) : Date.parse('2026-11-17T10:07:00Z');

  const filtered = events.filter((ev) => {
    if (params.endpointId && params.endpointId !== 'ALL' && ev.endpointId !== params.endpointId) {
      return false;
    }
    if (params.category !== 'All' && ev.category !== params.category) {
      return false;
    }
    if (params.severity !== 'All' && ev.severity !== params.severity) {
      return false;
    }
    if (params.timeWindow && params.timeWindow !== 'all') {
      const evMs = Date.parse(ev.timestamp);
      const diffMins = (refTime - evMs) / 60000;
      if (params.timeWindow === '15m' && diffMins > 15) return false;
      if (params.timeWindow === '1h' && diffMins > 60) return false;
      if (params.timeWindow === '24h' && diffMins > 1440) return false;
    }
    if (query) {
      const haystack = `${ev.id} ${ev.processName} ${ev.summary} ${ev.commandLine} ${ev.targetObject} ${ev.source} ${ev.mitreId ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'timestamp') {
      cmp = Date.parse(a.timestamp) - Date.parse(b.timestamp);
    } else if (sortField === 'severity') {
      cmp = SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    } else if (sortField === 'processName') {
      cmp = a.processName.localeCompare(b.processName);
    } else {
      cmp = a.id.localeCompare(b.id);
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): {
  rows: T[];
  totalPages: number;
  currentPage: number;
} {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;
  return {
    rows: items.slice(start, start + safePageSize),
    totalPages,
    currentPage,
  };
}

export function updateAlertStatusInList(
  alerts: ThreatAlert[],
  alertId: string,
  nextStatus: AlertStatus,
): ThreatAlert[] {
  return alerts.map((a) => (a.id === alertId ? { ...a, status: nextStatus } : a));
}

export interface ProcessTreeNode {
  process: ProcessNode;
  children: ProcessTreeNode[];
  depth: number;
}

export function buildProcessTree(processes: ProcessNode[]): ProcessTreeNode[] {
  const byPid = new Map<number, ProcessTreeNode>();
  for (const proc of processes) {
    byPid.set(proc.pid, { process: proc, children: [], depth: 0 });
  }

  const roots: ProcessTreeNode[] = [];
  for (const proc of processes) {
    const node = byPid.get(proc.pid)!;
    if (proc.ppid !== null && byPid.has(proc.ppid)) {
      byPid.get(proc.ppid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const assignDepth = (node: ProcessTreeNode, depth: number) => {
    node.depth = depth;
    node.children.sort((a, b) => a.process.pid - b.process.pid);
    for (const child of node.children) {
      assignDepth(child, depth + 1);
    }
  };

  roots.sort((a, b) => a.process.pid - b.process.pid);
  for (const root of roots) {
    assignDepth(root, 0);
  }
  return roots;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDetectionRuleSyntax(rule: Pick<DetectionRule, 'name' | 'queryText' | 'matchPattern' | 'mitreId'>): RuleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule.name.trim()) {
    errors.push('Rule name is required.');
  }
  if (!rule.queryText.trim()) {
    errors.push('Rule definition cannot be empty.');
  } else {
    if (!rule.queryText.includes('detection:')) {
      errors.push('Rule definition must include a "detection:" block.');
    }
    if (!rule.queryText.includes('condition:')) {
      errors.push('Rule definition must specify a "condition:" expression.');
    }
  }
  if (!rule.matchPattern.trim()) {
    errors.push('Match pattern is required for rule test evaluation.');
  } else {
    try {
      new RegExp(rule.matchPattern, 'i');
    } catch {
      errors.push('Match pattern contains invalid regular expression syntax.');
    }
  }
  if (!/^T\d{4}(\.\d{3})?$/.test(rule.mitreId.trim())) {
    warnings.push('MITRE ID does not match standard format (e.g., T1056.001).');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function testDetectionRuleAgainstEvents(
  rule: DetectionRule,
  events: SecurityEvent[],
): SecurityEvent[] {
  const validation = validateDetectionRuleSyntax(rule);
  if (!validation.valid) return [];
  const regex = new RegExp(rule.matchPattern, 'i');
  return events.filter((ev) => {
    const value = String(ev[rule.matchField] ?? '');
    return regex.test(value);
  });
}

export interface GlobalSearchResults {
  events: SecurityEvent[];
  alerts: ThreatAlert[];
  processes: ProcessNode[];
  incidents: IncidentRecord[];
  mitre: MitreTechnique[];
}

export function runGlobalSearch(
  query: string,
  data: {
    events: SecurityEvent[];
    alerts: ThreatAlert[];
    processes: ProcessNode[];
    incidents: IncidentRecord[];
    mitre: MitreTechnique[];
  },
): GlobalSearchResults {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      events: data.events.slice(0, 4),
      alerts: data.alerts.slice(0, 4),
      processes: data.processes.slice(0, 4),
      incidents: data.incidents.slice(0, 3),
      mitre: data.mitre.slice(0, 3),
    };
  }
  return {
    events: data.events
      .filter((e) => `${e.id} ${e.processName} ${e.summary} ${e.mitreId ?? ''}`.toLowerCase().includes(q))
      .slice(0, 6),
    alerts: data.alerts
      .filter((a) => `${a.id} ${a.title} ${a.processName} ${a.mitreId} ${a.category}`.toLowerCase().includes(q))
      .slice(0, 6),
    processes: data.processes
      .filter((p) => `${p.pid} ${p.name} ${p.executablePath} ${p.riskLevel}`.toLowerCase().includes(q))
      .slice(0, 6),
    incidents: data.incidents
      .filter((i) => `${i.id} ${i.title} ${i.assignedAnalyst} ${i.status}`.toLowerCase().includes(q))
      .slice(0, 5),
    mitre: data.mitre
      .filter((m) => `${m.id} ${m.name} ${m.tactic} ${m.description}`.toLowerCase().includes(q))
      .slice(0, 5),
  };
}

export function synthesizeDemoAIResponse(
  prompt: string,
  context: {
    alerts: ThreatAlert[];
    processes: ProcessNode[];
    events: SecurityEvent[];
    selectedAlertId?: string;
    selectedPid?: number;
  },
): AIAnalystStructuredResponse {
  const q = prompt.toLowerCase();
  const primaryAlert =
    context.alerts.find((a) => a.id === context.selectedAlertId) ??
    context.alerts.find((a) => a.severity === 'Critical') ??
    context.alerts[0];
  const targetProc =
    context.processes.find((p) => p.pid === (context.selectedPid ?? primaryAlert?.pid)) ??
    context.processes.find((p) => p.riskLevel === 'High Risk') ??
    context.processes[0];

  if (q.includes('mitre') || q.includes('technique') || q.includes('t1056')) {
    return {
      summary:
        'DEMO OUTPUT: Telemetry correlates most strongly with MITRE ATT&CK T1056.001 (Input Capture: Keylogging) alongside T1547.001 (Registry Run Keys) and T1071.001 (Application Layer Protocol). API metadata alone warrants deeper memory validation before confirming active keystroke capture.',
      observedEvidence: [
        'Sysmon EID 7 logged unsigned DLL load (user32_hook_shim.dll) with SetWindowsHookExW import descriptors in AudioSrvHelper.exe (PID 6812).',
        'Sysmon EID 13 recorded HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\AudioSyncHelper creation.',
        'ETW-Kernel logged non-standard driver load kbdfilter_legacy.sys from C:\\Windows\\Temp on LT-FIN-118.',
      ],
      riskAssessment:
        'Elevated (94/100 in synthetic scoring) on WS-ENG-042 due to combined unsigned module load, ProgramData execution path, and Office-to-PowerShell lineage.',
      mitreContext:
        'Primary: T1056.001 (Collection) · Supporting: T1547.001 (Persistence), T1059.001 (Execution), T1074.001 (Data Staged). Note: Hook API descriptors indicate capability, not proven capture without memory hook-chain confirmation.',
      recommendedSteps: [
        'Inspect loaded module memory space and active Windows hook tables on WS-ENG-042 (PID 6812).',
        'Acquire SHA-256 hash of user32_hook_shim.dll and kbdfilter_legacy.sys for threat intelligence verification.',
        'Review macro-enabled document Q4_Vendor_Spec.docm email delivery trail.',
        'Verify whether host network containment is approved by the incident commander.',
      ],
      referencedIds: ['ALT-2041', 'ALT-2039', 'EVT-90418', 'T1056.001'],
      mode: 'DEMO',
    };
  }

  if (q.includes('next') || q.includes('investigate') || q.includes('incident')) {
    return {
      summary:
        'DEMO OUTPUT: Incident INC-4102 traces an Office macro execution chain on WS-ENG-042 culminating in an unsigned ProgramData daemon exhibiting persistence, hidden file staging, and fixed-cadence outbound TLS traffic.',
      observedEvidence: [
        '09:19:15Z — winword.exe (PID 4412) wrote setup_helper.ps1 to user Downloads.',
        '09:59:14Z — powershell.exe (PID 4920) launched with -NoP -W Hidden -ExecutionPolicy Bypass.',
        '10:02:55Z — AudioSrvHelper.exe (PID 6812) created hidden .cache_idx.dat (entropy 7.82 bits/byte).',
        '10:04:12Z — 14 periodic TLS connections observed toward 198.51.100.74:8443.',
      ],
      riskAssessment:
        'Critical investigation priority for WS-ENG-042. Multiple corroborating persistence and staging signals reduce the likelihood of benign developer tooling.',
      mitreContext:
        'Attack chain spans T1566.001 -> T1059.001 -> T1056.001 / T1547.001 -> T1074.001 -> T1071.001.',
      recommendedSteps: [
        'Examine PowerShell Script Block logs (Event ID 4104) around 09:59Z for deobfuscated payload parameters.',
        'Check DNS and proxy logs for domain resolution preceding 198.51.100.74:8443 connections.',
        'Preserve .cache_idx.dat and AudioSrvHelper.exe metadata for forensic triage.',
        'Audit other endpoints for identical AudioSrvHelper.exe file hashes or HKCU Run keys.',
      ],
      referencedIds: ['INC-4102', 'ALT-2041', 'ALT-2040', 'EVT-90414'],
      mode: 'DEMO',
    };
  }

  return {
    summary: `DEMO OUTPUT: Process ${targetProc?.name ?? 'AudioSrvHelper.exe'} (PID ${targetProc?.pid ?? 6812}) was flagged because it executes as an unsigned binary from ${targetProc?.executablePath ?? 'C:\\ProgramData\\AudioHelper'} and combines input-hook DLL import metadata with persistence and anomalous network cadence.`,
    observedEvidence: [
      ...(primaryAlert?.evidence ?? []),
      `Process parent lineage: ${targetProc?.parentName ?? 'powershell.exe'} -> ${targetProc?.name ?? 'AudioSrvHelper.exe'}`,
      `Signature status: ${targetProc?.signatureStatus ?? 'Unsigned'}`,
    ],
    riskAssessment: `Risk Score ${primaryAlert?.riskScore ?? 94}/100 (${primaryAlert?.severity ?? 'Critical'}). Network connections to 198.51.100.74:8443 are flagged as anomalous cadence requiring payload/reputation corroboration rather than assumed exfiltration.`,
    mitreContext: `${primaryAlert?.mitreId ?? 'T1056.001'} (${primaryAlert?.mitreName ?? 'Input Capture: Keylogging'}). Telemetry reflects API import and persistence metadata in the DEMO dataset.`,
    recommendedSteps: [
      'Validate whether any legitimate enterprise audio software uses ProgramData\\AudioHelper.',
      'Correlate Sysmon EID 7 DLL load events with active user session timing.',
      'Inspect the HKCU Run registry value and hidden Temp artifact metadata.',
      'Update alert ALT-2041 status and escalate within Incident INC-4102 if unauthorized.',
    ],
    referencedIds: [primaryAlert?.id ?? 'ALT-2041', ...(primaryAlert?.relatedEventIds.slice(0, 3) ?? ['EVT-90418'])],
    mode: 'DEMO',
  };
}
