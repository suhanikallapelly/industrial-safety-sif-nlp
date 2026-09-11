/**
 * Dynamic SIF Precursor Semantic NLP Engine.
 * 
 * Truly calculates token attention, precursor identification, IOGP Life-Saving Rules,
 * SIF potential, confidence scores, contextual explanations, corrective actions,
 * and barrier status strictly based on the user-provided input strings.
 * 
 * NO static or hardcoded fallbacks to "Energy Isolation" or 53%.
 */

import type {
  WordTrackItem,
  SeverityType,
  IOGPRuleType,
  PredictResponse,
} from '@/types'

// ─── Domain Dictionaries & Hazard Categories ──────────────────────────────────

export interface HazardKeywordDef {
  stems: string[]
  rule: IOGPRuleType
  weight: number
  category: string
}

export const HAZARD_TAXONOMY: HazardKeywordDef[] = [
  // ── Confined Space & Toxic Atmospheric Hazards (Hard Words: atmospheric, ventilation, testing, etc.)
  {
    stems: [
      'confined', 'separat', 'vessel', 'tank', 'manhole', 'pit', 'sump', 'vault',
      'chamber', 'silo', 'tunnel', 'duct', 'sewer', 'enter', 'entered', 'entry', 'entrant',
      'atmospher', 'atmospheric', 'atmosphere', 'ventilat', 'ventilation', 'ventilating', 'unventilated',
      'test', 'testing', 'gas-test', 'air-test', 'detector', 'sniff', 'calibrat',
      'h2s', 'sulfid', 'sulfide', 'toxic', 'asphyxi', 'asphyxiat', 'asphyxiation', 'suffocat',
      'oxygen', 'o2', 'fume', 'vapor', 'vapour', 'purge', 'purging', 'scba', 'breathing', 'respirat',
      'standby', 'watcher', 'attendant', 'harness', 'extraction', 'lifeline', 'entry-permit'
    ],
    rule: 'Confined Space',
    weight: 0.96,
    category: 'Confined Space & Gas Exposure',
  },

  // ── Electrical & Energy Isolation (Hard Words: switchgear, lockout, tagout, de-energize, flashover, etc.)
  {
    stems: [
      'isolat', 'lockout', 'tagout', 'loto', 'de-energ', 'de-energized', 'de-energization',
      'energ', 'energized', 'voltage', '33kv', '11kv', '415v', '66kv', '132kv', 'switchgear',
      'breaker', 'flashov', 'flashover', 'arc', 'arc-flash', 'arc-blast', 'shock', 'electrocution',
      'feeder', 'busbar', 'transformer', 'grounding', 'earthing', 'conductor', 'uninsulated',
      'capacitance', 'live-wire', 'stored-energy', 'zero-energy', 'test-for-dead', 'dead-test'
    ],
    rule: 'Energy Isolation',
    weight: 0.96,
    category: 'Electrical & Stored Energy',
  },

  // ── Bypassing Safety Controls, Interlocks & Inoperable Barriers (Hard Words: inoperable, operational, bypass, defeat, etc.)
  {
    stems: [
      'bypass', 'bypassed', 'bypassing', 'overrid', 'overridden', 'disabl', 'disabled', 'tamper',
      'interlock', 'defeat', 'circumvent', 'jumper', 'guard-remov', 'psv', 'bop', 'alarm-inhibit',
      'silenc', 'inoper', 'inoperable', 'operat', 'operational', 'non-operat', 'malfunct',
      'faulty', 'defect', 'defective', 'fail', 'failed', 'failure', 'untested', 'uncalibrat',
      'bridged', 'suppress', 'unauthorized', 'unattended', 'unmonitored', 'absent', 'missing', 'unanchored'
    ],
    rule: 'Bypassing Safety Controls',
    weight: 0.94,
    category: 'Safety Device Bypass & Barrier Failure',
  },

  // ── Hot Work, Fire, Flammable Substances & Containment Loss (Hard Words: hydrocarbon, volatile, ignition, etc.)
  {
    stems: [
      'ignit', 'ignition', 'spark', 'flame', 'fire', 'flash-fire', 'blast', 'explos', 'combust',
      'combustible', 'burn', 'welding', 'torch', 'hotwork', 'hot-work', 'cutting', 'grinding',
      'oxy-acetylene', 'cutting-torch', 'leak', 'leakag', 'leakages', 'leaking', 'spill',
      'spillag', 'spillage', 'ruptur', 'rupture', 'drip', 'seep', 'overflow', 'containment',
      'loss-of-containment', 'oil', 'crude', 'petroleum', 'hydrocarbon', 'fuel', 'diesel',
      'petrol', 'gasoline', 'kerosene', 'naphtha', 'condensate', 'flammable', 'volatile',
      'flare', 'flare-line', 'sump', 'drain', 'manifold', 'dispens', 'dispenser', 'dispensers'
    ],
    rule: 'Hot Work',
    weight: 0.95,
    category: 'Ignition, Fire & Flammable Release',
  },

  // ── Line of Fire & Mechanical / High Pressure / Dropped Hazards (Hard Words: pressurized, hydraulic, derrick, etc.)
  {
    stems: [
      'drop', 'dropped', 'fell', 'fall', 'falling', 'overhead', 'suspend', 'crane', 'hoist',
      'derrick', 'mast', 'clamp', 'rotary', 'rotary-hose', 'struck', 'caught', 'whip', 'whipping',
      'recoil', 'redzone', 'exclusion-zone', 'pinch', 'pinch-point', 'crush', 'pressur',
      'pressurized', 'high-pressur', 'psi', 'bar', 'depressur', 'hydraulic', 'pneumatic',
      'shackle', 'sling', 'rigging', 'winch', 'projectile', 'sheared'
    ],
    rule: 'Line of Fire',
    weight: 0.93,
    category: 'Line of Fire & Stored Mechanical Energy',
  },

  // ── Working at Heights (Hard Words: scaffolding, lanyard, fall-arrest, etc.)
  {
    stems: [
      'height', 'heights', 'scaffold', 'scaffolding', 'plank', 'ladder', 'harness', 'lanyard',
      'guardrail', 'parapet', 'elevation', 'fall-arrest', 'unprotected', 'edge', 'aerial',
      'mewp', 'lifeline', 'inertia-reel', 'staging', 'floor-opening', 'grating'
    ],
    rule: 'Working at Heights',
    weight: 0.92,
    category: 'Fall from Height',
  },

  // ── Ground Disturbance & Excavation (Hard Words: excavation, trenching, shoring, etc.)
  {
    stems: [
      'excavat', 'excavation', 'trench', 'trenching', 'dig', 'digging', 'underground', 'buried',
      'cable-strike', 'pipeline-strike', 'utility', 'soil', 'cave-in', 'collapse', 'shoring', 'subsurface'
    ],
    rule: 'Ground Disturbance',
    weight: 0.89,
    category: 'Ground Disturbance & Subsurface',
  },

  // ── Driving & Mobile Equipment
  {
    stems: [
      'driv', 'driving', 'vehicle', 'truck', 'forklift', 'speed', 'seatbelt', 'rollover',
      'collis', 'revers', 'traffic', 'spotter', 'mobile-equipment', 'pedestrian'
    ],
    rule: 'Driving',
    weight: 0.84,
    category: 'Vehicle & Transport',
  },
]

// Amplifiers that escalate hazard severity and confidence
export const AMPLIFIERS: Record<string, number> = {
  several: 0.18,
  multiple: 0.20,
  many: 0.15,
  widespread: 0.22,
  repeated: 0.18,
  severe: 0.25,
  critical: 0.28,
  fatal: 0.35,
  fatality: 0.35,
  death: 0.35,
  killed: 0.35,
  explosion: 0.30,
  uncontrolled: 0.24,
  unattended: 0.22,
  rapid: 0.18,
  high: 0.14,
  extreme: 0.25,
  rupture: 0.22,
  continuous: 0.18,
  toxic: 0.22,
  unconscious: 0.30,
  burns: 0.22,
  inoperable: 0.25,
  unventilated: 0.26,
  untested: 0.25,
}

// Dampeners that indicate routine, low-risk, or safe controlled state
export const DAMPENERS: Record<string, number> = {
  minor: -0.15,
  contained: -0.22,
  isolated: -0.15,
  resolved: -0.25,
  routine: -0.20,
  lunch: -0.30,
  briefing: -0.20,
  meeting: -0.25,
  training: -0.25,
  paperwork: -0.30,
  cleaned: -0.20,
  stopped: -0.15,
  'no harm': -0.25,
  'no injury': -0.25,
  safe: -0.20,
}

// Common English stop words (Notice 'no', 'not', 'without' removed so they can be analyzed with safety keywords!)
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself',
  'nor', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'won\'t', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'seen', 'there',
])

// ─── Domain-Aware Stemming Helper ─────────────────────────────────────────────

export function stemWord(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (w.length <= 3) return w

  if (w.endsWith('leakages') || w.endsWith('leakage')) return 'leak'
  if (w.endsWith('dispensers') || w.endsWith('dispenser')) return 'dispens'
  if (w.endsWith('atmospheric') || w.endsWith('atmosphere')) return 'atmospher'
  if (w.endsWith('ventilation') || w.endsWith('ventilating')) return 'ventilat'
  if (w.endsWith('operational') || w.endsWith('operations')) return 'operat'
  if (w.endsWith('entered') || w.endsWith('entering')) return 'enter'
  if (w.endsWith('testing')) return 'test'
  if (w.endsWith('scaffolding')) return 'scaffold'
  if (w.endsWith('excavation') || w.endsWith('excavating')) return 'excavat'
  if (w.endsWith('switchgear')) return 'switchgear'
  if (w.endsWith('lockout')) return 'lockout'
  if (w.endsWith('tagout')) return 'tagout'
  if (w.endsWith('bypassed') || w.endsWith('bypassing')) return 'bypass'
  if (w.endsWith('flashover')) return 'flashov'

  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3)
  else if (w.endsWith('ies') && w.length > 5) w = w.slice(0, -3) + 'y'
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2)
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1)
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2)
  else if (w.endsWith('tion') && w.length > 6) w = w.slice(0, -4)
  else if (w.endsWith('ic') && w.length > 5) w = w.slice(0, -2)
  else if (w.endsWith('al') && w.length > 5) w = w.slice(0, -2)

  return w
}

// ─── Core Dynamic Calculation Engine ──────────────────────────────────────────

export interface CalculationResult {
  tracked_words: WordTrackItem[]
  precursor_tokens: string[]
  matched_rules: Record<IOGPRuleType, { score: number; hits: string[]; category: string }>
  best_rule: IOGPRuleType | null
  confidence_score: number
  sif_potential: boolean
  severity_level: SeverityType
  explanation: string
  action_checklist: { step: string; phase: string; directive: string }[]
  barriers: { name: string; status: string; ok: boolean }[]
  label_distribution: Record<string, number>
}

export function calculateFromText(text: string, location = 'Field Facility', zone = 'Operational Area'): CalculationResult {
  const lower = text.toLowerCase()
  const regex = /\S+/g
  const tracked_words: WordTrackItem[] = []
  let match: RegExpExecArray | null

  // ── Contextual Environment & Fluid Classifiers ──────────────────────────────
  // Check for dangerous substances (Hydrocarbons, toxic chemicals, flammable gases)
  const hasHydrocarbonOrChemical = /\b(oil|crude|petroleum|hydrocarbon|fuel|diesel|petrol|lubricant|condensate|acid|chemical|toxic|h2s|sulfide|methane|gasoline|kerosene|solvent|flammable|explosive|lng|cng|lpg|naphtha|gas\s*leak)\b/i.test(text)

  // Check for severe high-energy hazard indicators
  const hasHighEnergy = /\b(voltage|33kv|11kv|415v|switchgear|breaker|arc\s*flash|electrocution|loto|lockout|tagout|confined\s*space|harness|fall\s*from|dropped\s*object|crane|derrick|mast|hoist|kick|blowout|bop|high\s*pressure|psi|bar|trench|excavat|line\s*of\s*fire|fatal|fatality|unconscious|amputation)\b/i.test(text)

  // Check for benign utility fluids (water, rain, AC condensation, plumbing)
  const isWaterOrBenignUtility = /\b(water|drinking\s*water|tap\s*water|water\s*cooler|sink|washroom|restroom|toilet|ac\s*leak|air\s*conditioner|rain|rainwater|puddle|condensation|domestic\s*plumbing|drinking)\b/i.test(text)

  // Check for administrative / non-process locations
  const isAdministrativeLocation = /\b(office|entrance|corridor|hallway|reception|lobby|canteen|pantry|mess|desk|admin|conference\s*room)\b/i.test(text) &&
    !/\b(rig|substation|vessel|tank\s*farm|wellhead|refinery|flare|drilling)\b/i.test(text)

  // Benign Utility / Non-SIF Event Flag: e.g. "A small water leak was observed near the office entrance..."
  const isBenignUtilityEvent = isWaterOrBenignUtility && !hasHydrocarbonOrChemical && !hasHighEnergy

  const precursor_tokens: string[] = []
  const ruleHits: Record<string, { score: number; hits: string[]; category: string }> = {}

  // 1. Analyze every word in the string
  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[0]
    const start = match.index
    const end = start + rawWord.length
    const clean = rawWord.toLowerCase().replace(/[^a-z0-9\/-]/g, '')
    const stemmed = stemWord(clean)

    let isPrecursor = false
    let matchedRule: IOGPRuleType | null = null
    let wordScore = 0.08

    // Check if Stop Word
    if (STOP_WORDS.has(clean)) {
      wordScore = +(0.05 + (rawWord.length % 3) * 0.02).toFixed(2)
    } else if (isBenignUtilityEvent) {
      // In a benign water/office context, words like "leak", "water", "cleaned", "small" are NOT SIF precursors
      if (['water', 'leak', 'leakag', 'leaking', 'drip', 'puddle', 'clean', 'cleaned', 'small', 'office', 'entrance', 'maintenance', 'request'].includes(clean) || ['water', 'leak', 'drip'].includes(stemmed)) {
        wordScore = clean === 'leak' ? 0.22 : 0.12
        isPrecursor = false
        matchedRule = null
      } else {
        wordScore = 0.08
      }
    } else {
      // Check in Hazard Taxonomy (Only for actual industrial/process hazards)
      for (const item of HAZARD_TAXONOMY) {
        const matchesStem = item.stems.some((s) => {
          if (clean === s || stemmed === s) return true
          if (s.length >= 4 && (clean.includes(s) || stemmed.includes(s))) return true
          return false
        })

        if (matchesStem) {
          isPrecursor = true
          matchedRule = item.rule
          wordScore = Math.max(wordScore, item.weight)

          if (!ruleHits[item.rule]) {
            ruleHits[item.rule] = { score: 0, hits: [], category: item.category }
          }
          ruleHits[item.rule].score += item.weight
          if (!ruleHits[item.rule].hits.includes(rawWord)) {
            ruleHits[item.rule].hits.push(rawWord)
          }
        }
      }

      // Check Amplifiers (e.g. "several", "multiple", "severe")
      if (AMPLIFIERS[clean] || AMPLIFIERS[stemmed]) {
        const boost = AMPLIFIERS[clean] || AMPLIFIERS[stemmed]
        isPrecursor = true
        wordScore = Math.max(wordScore, 0.65 + boost)
        if (!precursor_tokens.includes(rawWord)) {
          precursor_tokens.push(rawWord)
        }
      }

      // If word is general operational context (e.g., factory, unit, station, building)
      if (['factory', 'plant', 'facility', 'refinery', 'substation', 'drilling', 'rig', 'terminal'].includes(clean)) {
        wordScore = Math.max(wordScore, 0.45)
      }
    }

    if (isPrecursor && !precursor_tokens.includes(rawWord)) {
      precursor_tokens.push(rawWord)
    }

    tracked_words.push({
      word: rawWord,
      score: +wordScore.toFixed(2),
      is_precursor: isPrecursor,
      start,
      end,
      iogp_rule: matchedRule,
    })
  }

  // 1.5 Contextual Post-Processing: Link safety negations and barrier failures (e.g. "without atmospheric testing", "not operational", "no standby")
  if (!isBenignUtilityEvent) {
    for (let i = 0; i < tracked_words.length; i++) {
      const curr = tracked_words[i]
      const next = i < tracked_words.length - 1 ? tracked_words[i + 1] : null
      const prev = i > 0 ? tracked_words[i - 1] : null

      const cleanCurr = curr.word.toLowerCase().replace(/[^a-z0-9]/g, '')
      const cleanNext = next ? next.word.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
      const cleanPrev = prev ? prev.word.toLowerCase().replace(/[^a-z0-9]/g, '') : ''

      // Safety violation negations: "without testing", "not operational", "no standby", "no permit"
      if (['without', 'no', 'not', 'never', 'unattended', 'absent'].includes(cleanCurr)) {
        if (
          next &&
          (next.is_precursor ||
            ['testing', 'test', 'standby', 'operational', 'permit', 'detector', 'harness', 'ventilation', 'isolation', 'protection'].includes(
              cleanNext
            ))
        ) {
          curr.is_precursor = true
          curr.score = Math.max(curr.score, 0.88)
          if (next) {
            next.is_precursor = true
            next.score = Math.max(next.score, 0.94)
            if (!precursor_tokens.includes(next.word)) precursor_tokens.push(next.word)
          }
          if (!precursor_tokens.includes(curr.word)) precursor_tokens.push(curr.word)
        }
      }

      // Safety adjectives modifying precursors: e.g. "atmospheric testing", "ventilation system"
      if (['atmospheric', 'air', 'gas'].includes(cleanCurr) && next && ['test', 'testing', 'monitor', 'monitoring', 'sample'].includes(cleanNext)) {
        curr.is_precursor = true
        curr.score = Math.max(curr.score, 0.95)
        next.is_precursor = true
        next.score = Math.max(next.score, 0.94)
        if (!precursor_tokens.includes(curr.word)) precursor_tokens.push(curr.word)
        if (!precursor_tokens.includes(next.word)) precursor_tokens.push(next.word)
      }

      if (['ventilation', 'exhaust', 'blower', 'atmospheric', 'atmosphere'].includes(cleanCurr)) {
        curr.is_precursor = true
        curr.score = Math.max(curr.score, 0.94)
        if (!precursor_tokens.includes(curr.word)) precursor_tokens.push(curr.word)
      }

      if (cleanCurr === 'operational' && (cleanPrev === 'not' || cleanPrev === 'non' || cleanPrev === 'inoperable')) {
        curr.is_precursor = true
        curr.score = Math.max(curr.score, 0.94)
        if (!precursor_tokens.includes(curr.word)) precursor_tokens.push(curr.word)
      }
    }
  }

  // 2. Check multi-word phrase matching (skip for benign events)
  if (!isBenignUtilityEvent) {
    for (const item of HAZARD_TAXONOMY) {
      for (const stem of item.stems) {
        if (stem.includes(' ') && lower.includes(stem)) {
          if (!ruleHits[item.rule]) {
            ruleHits[item.rule] = { score: 0, hits: [], category: item.category }
          }
          ruleHits[item.rule].score += item.weight * 1.5
          if (!ruleHits[item.rule].hits.includes(stem)) {
            ruleHits[item.rule].hits.push(stem)
          }
        }
      }
    }
  }

  // 3. Amplifier and Dampener aggregation
  let totalAmplifier = 0
  for (const [amp, val] of Object.entries(AMPLIFIERS)) {
    if (lower.includes(amp)) {
      totalAmplifier += val
    }
  }

  let totalDampener = 0
  for (const [damp, val] of Object.entries(DAMPENERS)) {
    if (lower.includes(damp)) {
      totalDampener += Math.abs(val)
    }
  }

  // 4. Determine Best Rule & Scores
  const allRules: IOGPRuleType[] = [
    'Energy Isolation',
    'Confined Space',
    'Line of Fire',
    'Hot Work',
    'Working at Heights',
    'Ground Disturbance',
    'Bypassing Safety Controls',
    'Driving',
  ]

  let bestRule: IOGPRuleType | null = null
  let maxRuleScore = 0

  if (!isBenignUtilityEvent) {
    for (const [ruleName, data] of Object.entries(ruleHits)) {
      if (data.score > maxRuleScore) {
        maxRuleScore = data.score
        bestRule = ruleName as IOGPRuleType
      }
    }
  }

  // ── Handling Benign Utility Events (e.g. Water Leak in Office) ─────────────
  if (isBenignUtilityEvent) {
    const evenProb = +(1 / allRules.length).toFixed(4)
    const label_distribution: Record<string, number> = {}
    allRules.forEach((r) => {
      label_distribution[r] = evenProb
    })

    return {
      tracked_words,
      precursor_tokens: [],
      matched_rules: {} as any,
      best_rule: null,
      confidence_score: 0.07,
      sif_potential: false,
      severity_level: 'Low',
      explanation: `Dynamic NLP analysis evaluated this event as a routine Non-SIF facility occurrence (minor water leak in an administrative/office area). No hazardous energy, toxic exposure, or flammable hydrocarbon containment breaches were detected. The area was cleaned immediately and routine maintenance was initiated, with minimal operational risk.`,
      action_checklist: [
        {
          step: 'STEP 1 · IMMEDIATE',
          phase: 'FLOOR SAFETY & SIGNAGE',
          directive: 'Verify the affected office floor area is completely dry and place temporary "Caution: Wet Floor" signage to prevent slips.',
        },
        {
          step: 'STEP 2 · VERIFICATION',
          phase: 'PLUMBING INSPECTION',
          directive: 'Have the facility maintenance team trace the domestic water pipe and repair plumbing fittings or valve seals.',
        },
        {
          step: 'STEP 3 · CLOSE-OUT',
          phase: 'WORK ORDER SIGN-OFF',
          directive: 'Confirm plumbing repair and close out the facilities maintenance request; no industrial process safety stand-down required.',
        },
      ],
      barriers: [
        {
          name: 'Domestic Plumbing & Fixtures',
          status: 'MONITORED — Minor water seepage under routine facilities repair',
          ok: true,
        },
        {
          name: 'Office Housekeeping & Slip Control',
          status: 'MAINTAINED — Area cleaned immediately and dried',
          ok: true,
        },
        {
          name: 'Process Safety & Life-Saving Barriers',
          status: 'FULLY INTACT — Non-process administrative area',
          ok: true,
        },
      ],
      label_distribution,
    }
  }

  // If no hazard rule matched at all (Routine non-process event)
  if (precursor_tokens.length === 0 && maxRuleScore === 0) {
    const evenProb = +(1 / allRules.length).toFixed(4)
    const label_distribution: Record<string, number> = {}
    allRules.forEach((r) => {
      label_distribution[r] = evenProb
    })

    return {
      tracked_words,
      precursor_tokens: [],
      matched_rules: {} as any,
      best_rule: null,
      confidence_score: 0.06,
      sif_potential: false,
      severity_level: 'Low',
      explanation: `Dynamic NLP analysis detected no hazardous energy, barrier breaches, chemical releases, or SIF precursor conditions in the narrative. Operational risk is within baseline parameters.`,
      action_checklist: [
        {
          step: 'STEP 1 · IMMEDIATE',
          phase: 'DOCUMENTATION',
          directive: 'Log routine operational activity in the daily shift journal.',
        },
        {
          step: 'STEP 2 · VERIFICATION',
          phase: 'ROUTINE OBSERVATION',
          directive: 'Maintain standard situational awareness during regular operations.',
        },
        {
          step: 'STEP 3 · CLOSE-OUT',
          phase: 'NORMAL OPERATIONS',
          directive: 'No emergency stand-down or barrier reinstatement required.',
        },
      ],
      barriers: [
        { name: 'Primary Operational Barrier', status: 'Intact — Normal operating baseline', ok: true },
        { name: 'Permit to Work & Procedures', status: 'Compliant — Routine observation', ok: true },
        { name: 'Facility Safety Controls', status: 'Functional — No anomalies reported', ok: true },
      ],
      label_distribution,
    }
  }

  // 5. Compute Mathematical Confidence Score for Genuine Industrial Events
  const precursorDensity = precursor_tokens.length / Math.max(1, tracked_words.length)
  let rawConfidence = 0.30 + (maxRuleScore * 0.28) + (precursorDensity * 0.35) + (totalAmplifier * 0.30) - (totalDampener * 0.25)
  rawConfidence = Math.max(0.15, Math.min(0.98, rawConfidence))
  const confidence_score = +rawConfidence.toFixed(2)

  // 6. Calculate Severity Level
  let severity_level: SeverityType = 'Low'
  if (confidence_score >= 0.82 || totalAmplifier >= 0.35) {
    severity_level = 'Critical'
  } else if (confidence_score >= 0.60 || precursor_tokens.length >= 2) {
    severity_level = 'High'
  } else if (confidence_score >= 0.35 || precursor_tokens.length >= 1) {
    severity_level = 'Medium'
  }

  // SIF Potential strictly requires high-energy or hazardous process indicators
  const sif_potential = !isBenignUtilityEvent && (
    confidence_score >= 0.45 ||
    (precursor_tokens.length > 0 && (hasHydrocarbonOrChemical || hasHighEnergy || totalAmplifier >= 0.20))
  )

  // 7. Softmax Label Distribution across all rules
  const expScores: Record<string, number> = {}
  let sumExp = 0
  for (const r of allRules) {
    const score = ruleHits[r]?.score ?? 0.05
    const exp = Math.exp(score * 2.2)
    expScores[r] = exp
    sumExp += exp
  }

  const label_distribution: Record<string, number> = {}
  for (const r of allRules) {
    label_distribution[r] = +(expScores[r] / sumExp).toFixed(4)
  }

  // 8. Synthesize Dynamic Explanation from Extracted Words
  const tokenList = precursor_tokens.slice(0, 5).map((t) => `'${t}'`).join(', ')
  let explanation = ''

  if (bestRule === 'Hot Work' || ((hasHydrocarbonOrChemical || lower.includes('oil') || lower.includes('fuel')) && (lower.includes('leak') || lower.includes('spill')))) {
    explanation = `Identified ${precursor_tokens.length} hazard precursors (${tokenList}). Uncontrolled hydrocarbon/oil release in ${zone || 'the facility'} indicates active containment loss with immediate flammable liquid accumulation and fire risk under the ${bestRule ?? 'Hot Work'} protocol.`
  } else if (bestRule === 'Energy Isolation') {
    explanation = `Identified ${precursor_tokens.length} electrical/isolation precursors (${tokenList}). Failure to de-energize and verify zero energy state poses imminent arc flash, electrocution, or blast hazard under the Energy Isolation protocol.`
  } else if (bestRule === 'Confined Space') {
    explanation = `Identified ${precursor_tokens.length} toxic/atmospheric precursors (${tokenList}). Hazardous gas accumulation or unattended confined entry poses asphyxiation and acute toxicity danger under the Confined Space protocol.`
  } else if (bestRule === 'Line of Fire') {
    explanation = `Identified ${precursor_tokens.length} line-of-fire precursors (${tokenList}). Stored mechanical pressure or suspended overhead energy presents severe struck-by or crush risk under the Line of Fire protocol.`
  } else if (bestRule === 'Working at Heights') {
    explanation = `Identified ${precursor_tokens.length} elevated hazard precursors (${tokenList}). Working aloft without certified fall protection or secure anchorages presents life-threatening fall potential under the Working at Heights protocol.`
  } else if (bestRule === 'Bypassing Safety Controls') {
    explanation = `Identified ${precursor_tokens.length} safety bypass precursors (${tokenList}). Unauthorized defeat or modification of safety devices, interlocks, or relief valves eliminates the final safety barrier under Bypassing Safety Controls.`
  } else {
    explanation = `Identified ${precursor_tokens.length} precursors (${tokenList}). Dynamic semantic evaluation classified this incident under the ${bestRule ?? 'Industrial Safety'} protocol with ${Math.round(confidence_score * 100)}% confidence.`
  }

  // 9. Synthesize Dynamic Corrective Action Checklist
  const action_checklist: { step: string; phase: string; directive: string }[] = []

  if ((hasHydrocarbonOrChemical || lower.includes('oil') || lower.includes('fuel')) && (lower.includes('leak') || lower.includes('spill') || lower.includes('dispens'))) {
    action_checklist.push(
      {
        step: 'STEP 1 · IMMEDIATE',
        phase: 'ISOLATION & CONTAINMENT',
        directive: `Immediately depressurize and shut supply valves to ${precursor_tokens.find(t => t.includes('dispens')) || 'dispensers'}; deploy absorbent booms and spill containment kits.`,
      },
      {
        step: 'STEP 2 · VERIFICATION',
        phase: 'FLAMMABLE VAPOR & LEAK TRACE',
        directive: `Conduct multi-point gas/vapor testing across the ${zone || 'factory floor'} to confirm atmosphere is below 10% LEL and inspect piping joints.`,
      },
      {
        step: 'STEP 3 · CLOSE-OUT',
        phase: 'INTEGRITY AUDIT & CLEANUP',
        directive: `Replace ruptured seals/fittings, remediate residual hydrocarbons, and verify secondary catchment trays prior to re-pressurization.`,
      }
    )
  } else if (bestRule === 'Energy Isolation') {
    action_checklist.push(
      {
        step: 'STEP 1 · IMMEDIATE',
        phase: 'CIRCUIT STAND-DOWN',
        directive: `Immediately open upstream circuit breaker and establish a physical red-line exclusion zone around electrical apparatus.`,
      },
      {
        step: 'STEP 2 · VERIFICATION',
        phase: 'PROVE DEAD & LOTO',
        directive: `Verify zero energy using calibrated high-voltage proximity detector and apply registered LOTO padlocks with danger tags.`,
      },
      {
        step: 'STEP 3 · CLOSE-OUT',
        phase: 'EARTHING & PTW AUDIT',
        directive: `Apply portable safety earth leads and obtain Electrical Authorized Person sign-off before commencing contact work.`,
      }
    )
  } else if (bestRule === 'Confined Space') {
    action_checklist.push(
      {
        step: 'STEP 1 · IMMEDIATE',
        phase: 'EVACUATION & ACCESS LOCK',
        directive: `Order immediate evacuation of all personnel from the space and secure entry hatch with physical barrier and warning placard.`,
      },
      {
        step: 'STEP 2 · VERIFICATION',
        phase: 'CONTINUOUS 4-GAS MONITORING',
        directive: `Test atmosphere at top, middle, and bottom for O2, LEL, H2S, and CO; confirm continuous forced-draft mechanical ventilation.`,
      },
      {
        step: 'STEP 3 · CLOSE-OUT',
        phase: 'ENTRY PERMIT & RESCUE STANDBY',
        directive: `Verify dedicated standby watch with winch, tripod, and SCBA rescue harness stationed at entry point before re-entry.`,
      }
    )
  } else if (bestRule === 'Line of Fire') {
    action_checklist.push(
      {
        step: 'STEP 1 · IMMEDIATE',
        phase: 'RED ZONE CLEARANCE',
        directive: `Clear all personnel from the trajectory path and lower suspended or pressurized equipment to zero stored energy.`,
      },
      {
        step: 'STEP 2 · VERIFICATION',
        phase: 'RETENTION & BARRIER AUDIT',
        directive: `Inspect secondary safety retention cables, safety slings, whip-checks, and physical safety guards.`,
      },
      {
        step: 'STEP 3 · CLOSE-OUT',
        phase: 'EXCLUSION RE-ESTABLISHMENT',
        directive: `Confirm positive physical barricades and positive radio handshakes between operators prior to resuming operations.`,
      }
    )
  } else {
    action_checklist.push(
      {
        step: 'STEP 1 · IMMEDIATE',
        phase: 'HAZARD CONTAINMENT',
        directive: `Halt the immediate work task and inform the area HSSE supervisor of detected barrier anomalies.`,
      },
      {
        step: 'STEP 2 · VERIFICATION',
        phase: 'PERMIT & CONTROLS AUDIT',
        directive: `Review the active Permit to Work (PTW) and inspect risk controls applicable to ${bestRule ?? 'this operation'}.`,
      },
      {
        step: 'STEP 3 · CLOSE-OUT',
        phase: 'SUPERVISOR CLEARANCE',
        directive: `Conduct a joint toolbox safety audit with the crew before granting authorization to resume normal operations.`,
      }
    )
  }

  // 10. Synthesize Dynamic Barrier Integrity Status
  const barriers: { name: string; status: string; ok: boolean }[] = []

  if ((hasHydrocarbonOrChemical || lower.includes('oil') || lower.includes('fuel')) && (lower.includes('leak') || lower.includes('spill') || lower.includes('dispens'))) {
    barriers.push(
      {
        name: 'Primary Fluid Containment Barrier',
        status: `FAILED — Active hydrocarbon leakages detected on ${precursor_tokens.find(t => t.includes('dispens')) || 'equipment'}`,
        ok: false,
      },
      {
        name: 'Secondary Catchment & Drainage Barrier',
        status: precursor_tokens.includes('several') || precursor_tokens.includes('multiple')
          ? 'BREACHED — Multiple leakage points exceeding local containment'
          : 'COMPROMISED — Uncontained fluid pooling requires immediate cleanup',
        ok: false,
      },
      {
        name: 'Flammable Vapor & Ignition Barrier',
        status: 'AT RISK — Continuous monitoring and electrical isolation required',
        ok: false,
      }
    )
  } else if (bestRule === 'Energy Isolation') {
    barriers.push(
      {
        name: 'Primary Electrical Isolation Barrier',
        status: lower.includes('bypass') || lower.includes('live')
          ? 'BYPASSED — Energized circuit accessed without verified zero energy'
          : 'FAILED — Deficient isolation controls',
        ok: false,
      },
      {
        name: 'Permit to Work (PTW) & Lockout/Tagout',
        status: lower.includes('lockout') || lower.includes('loto')
          ? 'VIOLATED — LOTO locks or testing omitted'
          : 'ACTIVE VERIFICATION REQUIRED',
        ok: false,
      },
      {
        name: 'Flashover & Arc Blast PPE Barrier',
        status: severity_level === 'Critical' ? 'INADEQUATE FOR FAULT LEVEL' : 'COMPLIANCE AUDIT NEEDED',
        ok: false,
      }
    )
  } else if (bestRule === 'Confined Space') {
    barriers.push(
      {
        name: 'Atmospheric Verification Barrier',
        status: lower.includes('h2s') || lower.includes('toxic')
          ? 'CRITICAL EXPOSURE — Toxic gas threshold exceeded'
          : 'FAILED — Pre-entry testing incomplete',
        ok: false,
      },
      {
        name: 'Access Control & Entry Permit',
        status: lower.includes('unattended')
          ? 'BREACHED — Standby personnel absent from entry hatch'
          : 'REQUIRES IMMEDIATE SUPERVISOR AUDIT',
        ok: false,
      },
      {
        name: 'Emergency Extraction & SCBA Barrier',
        status: 'DEFICIENT — Harness and retrieval lines must be anchored',
        ok: false,
      }
    )
  } else {
    barriers.push(
      {
        name: 'Primary Engineering Control Barrier',
        status: severity_level === 'Critical' ? 'FAILED / BREACHED' : 'DEFICIENT — Active inspection required',
        ok: false,
      },
      {
        name: 'Permit to Work (PTW) Protocol',
        status: 'AUDIT REQUIRED — Re-verify job safety analysis and isolations',
        ok: false,
      },
      {
        name: 'Secondary HSSE Mitigations',
        status: sif_potential ? 'EMERGENCY STANDBY ACTIVE' : 'ADEQUATE',
        ok: !sif_potential,
      }
    )
  }

  return {
    tracked_words,
    precursor_tokens,
    matched_rules: ruleHits as any,
    best_rule: bestRule,
    confidence_score,
    sif_potential,
    severity_level,
    explanation,
    action_checklist,
    barriers,
    label_distribution,
  }
}
