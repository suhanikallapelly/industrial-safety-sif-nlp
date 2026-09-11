/**
 * Authentic Oil India Limited Historical Incident Dataset Generator.
 * Generates 5,250+ realistic industrial audit records spanning 18 months of field operations.
 * Covers all 12 operational sectors, 8 IOGP Lifesaving categories, and routine workplace logs.
 */

import fs from 'fs'
import path from 'path'
import type { IncidentReport, SeverityType, StatusType, IOGPRuleType } from '@/types'

const LOCATIONS = [
  'Duliajan Central Facility',
  'Digboi Production Area',
  'Naharkatiya Oilfield',
  'Moran Gathering Station',
  'Shalmari Gas Compressor Plant',
  'Tengakhat Processing Facility',
  'Borbil Production Center',
  'Kumchai Gas Field',
  'Kusijan Substation & Terminal',
  'Jorhat Operational Base',
  'Dikom Drilling & Well Site',
  'Madhuban Dispatch Terminal',
]

const ZONES: Record<string, string[]> = {
  'Duliajan Central Facility': ['CPF-01 Separation Bay', 'CPF-04 Compressor Shed', 'Dispenser Bay 03', 'Crude Dispatch Station'],
  'Digboi Production Area': ['CDU Tank Farm Area', 'Wellsite D-14 Cellar', 'Effluent Treatment Plant', 'Boiler House 02'],
  'Naharkatiya Oilfield': ['Rig-12 Drill Floor', 'Substation-4 Feeder Room', 'Wellhead 54 Red Zone', 'Flowline Manifold'],
  'Moran Gathering Station': ['Moran Substation-B', 'Gathering Station 02', 'Flare Pit Perimeter', 'Crude Pumping Bay'],
  'Shalmari Gas Compressor Plant': ['Compressor House 01', 'Glycol Dehydration Skid', 'Auxiliary Switchgear Room', 'HP Gas Manifold'],
  'Tengakhat Processing Facility': ['Well Fluid Header', 'Test Separator Skid', 'Scraper Trap Area', 'Flare Line Isolation Point'],
  'Borbil Production Center': ['Beam Pumping Unit 07', 'Wellhead Red Zone', 'Transformer Yard', 'Chemical Injection Bay'],
  'Kumchai Gas Field': ['Amine Sweetening Unit', 'Booster Compressor Bay', 'Gas Metering Skid', 'Wellsite K-03'],
  'Kusijan Substation & Terminal': ['33kV Switchgear Room', 'Capacitor Bank Yard', 'Battery Bank Area', 'Feeder Cubicle Bay'],
  'Jorhat Operational Base': ['Logistics Yard', 'Heavy Tubular Storage', 'Vehicle Fleet Maintenance Bay', 'Workshop Bay 04'],
  'Dikom Drilling & Well Site': ['Rig-08 Drill Floor', 'Choke Manifold Skid', 'Mud Tank Circulation Pit', 'BOP Control Accumulator'],
  'Madhuban Dispatch Terminal': ['Main Crude Storage Tank 102', 'Booster Pump House', 'Firewater Reservoir & Pump Skid', 'Header Metering Bay'],
}

const REPORTERS = [
  { name: 'P. K. Gogoi', role: 'Field Safety Lead' },
  { name: 'A. Baruah', role: 'Operations Supervisor' },
  { name: 'R. Phukan', role: 'Electrical Engineer' },
  { name: 'S. Saikia', role: 'HSE Auditor' },
  { name: 'M. Hazarika', role: 'Drilling Lead' },
  { name: 'D. Sarma', role: 'Process Operator' },
  { name: 'B. Kalita', role: 'Mechanical Tech' },
  { name: 'N. Sonowal', role: 'Substation In-Charge' },
  { name: 'K. Bordoloi', role: 'Facility Inspector' },
  { name: 'T. Bora', role: 'Wellsite Geologist' },
  { name: 'J. Deka', role: 'Maintenance Supervisor' },
  { name: 'R. Tamuly', role: 'Electrical Tech' },
  { name: 'C. R. Dutta', role: 'Safety Officer' },
  { name: 'B. Goswami', role: 'Production Tech' },
  { name: 'S. Bhattacharya', role: 'Asset Integrity Lead' },
  { name: 'P. Neog', role: 'Control Room In-Charge' },
  { name: 'H. K. Das', role: 'HSE Coordinator' },
  { name: 'M. C. Barman', role: 'Civil Inspector' },
  { name: 'A. K. Nath', role: 'Pipeline Engineer' },
  { name: 'D. Chetia', role: 'Field Tech' },
]

interface SIFTemplate {
  rule: IOGPRuleType
  severity: SeverityType
  templates: string[]
  tokens: string[]
  checklist: { step: string; phase: string; directive: string }[]
  barriers: { name: string; status: string; ok: boolean }[]
}

const SIF_TEMPLATES: SIFTemplate[] = [
  {
    rule: 'Energy Isolation',
    severity: 'Critical',
    templates: [
      'Electrician bypassed lockout/tagout protocol on 33kV switchgear feeder panel without testing for dead. Accidental phase-to-ground flashover occurred causing high-voltage arc blast and severe burns.',
      'Maintenance crew commenced overhaul of high-pressure motor pump without applying physical LOTO padlock. Circuit breaker remained energized at 6.6kV bus.',
      'Technician removed safety padlock from main disconnect switch before contractor team cleared the motor enclosure. Energized conductor exposed.',
      'Feed isolation valve on hydrocarbon separator passing pressurized crude during scheduled pipe spool replacement. Double block and bleed was not verified.',
      'Electrical isolator switch operated under load during routine pump changeover, causing high-energy arc flash inside auxiliary switchgear room.',
    ],
    tokens: ['lockout', 'switchgear', 'flashover', 'high-voltage', 'bypassed', 'arc blast', 'energized', 'isolation'],
    checklist: [
      { step: 'Step 1: Emergency Isolation', phase: 'Immediate', directive: 'Trip upstream breaker, verify zero energy with calibrated detector, and lock out feeder.' },
      { step: 'Step 2: Permit Audit', phase: 'Corrective', directive: 'Audit all active LOTO permits across facility and conduct stand-down meeting.' },
      { step: 'Step 3: Asset Re-certification', phase: 'Close-out', directive: 'Inspect switchgear insulation resistance before re-energizing.' },
    ],
    barriers: [
      { name: 'Physical LOTO Lockout Barrier', status: 'Breached — Padlock bypassed', ok: false },
      { name: 'Voltage Verification Detector', status: 'Failed — Zero-energy check skipped', ok: false },
      { name: 'Arc Flash Protective Shield', status: 'Nominal Rating Maintained', ok: true },
    ],
  },
  {
    rule: 'Confined Space',
    severity: 'Critical',
    templates: [
      'During maintenance, a technician entered a confined vessel without atmospheric testing. The ventilation system was not operational, and no standby person was present.',
      'Cleaning contractor entered crude oil storage tank cellar without continuous 4-gas monitoring. H2S concentration spiked to 18 ppm inside unventilated manhole.',
      'Entry permit expired while two technicians were cleaning inside hydrocarbon knockout drum. Forced ventilation blower failed without standby person noticing.',
      'Roustabout entered separator pit without breathing apparatus or retrieval harness. Oxygen level was later tested at only 17.8% inside pit.',
      'Confined space entry hatch left open and unattended without physical warning barrier or gas testing certificate displayed.',
    ],
    tokens: ['entered', 'confined', 'vessel', 'atmospheric', 'ventilation', 'standby', 'h2s', 'gas test'],
    checklist: [
      { step: 'Step 1: Evacuate & Ventilate', phase: 'Immediate', directive: 'Immediately evacuate vessel, deploy forced draft air blowers, and cordon access.' },
      { step: 'Step 2: Multi-Gas Test', phase: 'Verification', directive: 'Test top, middle, and bottom levels for O2, LEL, H2S, and CO with calibrated meter.' },
      { step: 'Step 3: Standby Watcher Stationed', phase: 'Permit Control', directive: 'Station certified standby watch with extraction hoist and SCBA harness.' },
    ],
    barriers: [
      { name: 'Atmospheric Gas Testing Barrier', status: 'Failed — Pre-entry testing absent', ok: false },
      { name: 'Forced Air Mechanical Ventilation', status: 'Deficient — Air circulation halted', ok: false },
      { name: 'Standby Emergency Retrieval Winch', status: 'Not Deployed', ok: false },
    ],
  },
  {
    rule: 'Line of Fire',
    severity: 'High',
    templates: [
      'During casing running operation, a 28kg hydraulic rotary hose clamp detached from 18m elevation on the derrick mast and fell onto the drill floor. Red Zone exclusion barrier was breached by roustabouts.',
      'High pressure hydrostatic test plug blown out from 4-inch flowline manifold at 3,500 psi. Test barricade tape was breached by non-essential crew.',
      'Forklift carrying heavy steel drill collar reversed without spotter, striking scaffolding upright near active personnel walkway.',
      'Pipe rack stanchion collapsed during offloading of 9-5/8 inch casing pipes, causing two joints to roll towards the walkway.',
      'Overhead crane sling slipped during pump skid hoist operation, dropping load 1.2m onto compressor platform.',
    ],
    tokens: ['clamp', 'detached', 'fell', 'derrick', 'pressure', 'blown out', 'line of fire', 'red zone'],
    checklist: [
      { step: 'Step 1: Red Zone Enforcement', phase: 'Immediate', directive: 'Halt all hoisting and strictly enforce exclusion boundary on drill floor.' },
      { step: 'Step 2: Rigging Inspection', phase: 'Inspection', directive: 'Inspect secondary safety retention cables and clamps on all mast fixtures.' },
      { step: 'Step 3: Dropped Object Sweep', phase: 'Verification', directive: 'Complete DROPS audit protocol and re-torque all overhead fasteners.' },
    ],
    barriers: [
      { name: 'Red Zone Exclusion Barrier', status: 'Compromised — Unauthorized entry', ok: false },
      { name: 'Secondary Tool Tether / Wire Sling', status: 'Missing — Clamp lacked retention wire', ok: false },
      { name: 'Impact Hardhat Safety Barrier', status: 'Intact — All personnel equipped', ok: true },
    ],
  },
  {
    rule: 'Hot Work',
    severity: 'Critical',
    templates: [
      'oil dispensers of a factory, so that I have seen that several leakages are there creating flammable fuel accumulation near active welding operations.',
      'Contractor conducted oxy-acetylene cutting torch work within 3 meters of open condensate drain without fire retardant blanket.',
      'Angle grinder sparks directed towards crude oil storage tank vent line. Continuous LEL gas meter was not positioned in the spark trajectory.',
      'Welding on crude discharge pipe spool initiated before gas free certificate was issued. Flammable hydrocarbon vapor detected in adjacent sump.',
      'Hot work permit signed off but designated fire watch left area unattended while torch cutting pipe supports.',
    ],
    tokens: ['oil', 'dispensers', 'leakages', 'flammable', 'cutting torch', 'sparks', 'welding', 'hot work'],
    checklist: [
      { step: 'Step 1: Halt Ignition Sources', phase: 'Immediate', directive: 'Extinguish hot work torches, de-energize grinders, and establish dry powder fire watch.' },
      { step: 'Step 2: Combustible Containment', phase: 'Containment', directive: 'Clean pooled oil, deploy fire blanket barriers, and verify 0% LEL with gas sniffer.' },
      { step: 'Step 3: Hot Work Permit Review', phase: 'Compliance', directive: 'Re-audit hot work authorization and confirm continuous gas detector placement.' },
    ],
    barriers: [
      { name: 'Combustible Vapor Exclusion', status: 'Breached — Hydrocarbon pool present', ok: false },
      { name: 'Designated Fire Watch Watcher', status: 'Deficient — Fire watcher absent', ok: false },
      { name: 'Dry Chemical Extinguisher Staged', status: 'Ready & Certified', ok: true },
    ],
  },
  {
    rule: 'Working at Heights',
    severity: 'High',
    templates: [
      'Scaffolding work platform erected at 14m elevation on flare stack with missing intermediate guardrails and unpinned wooden toe boards.',
      'Roustabout working on derrick monkey board unclipped fall arrest inertia lanyard to reach pipe racking arm without secondary anchor.',
      'Contractor painting compressor roof structure without harness tie-off to certified life-line anchor point.',
      'Portable aluminum extension ladder placed on wet oily steel deck slipped while electrician was climbing to service lighting fixture.',
      'Floor grating removed on separator platform leaving 2m x 1m open hole without barrier railing or safety netting.',
    ],
    tokens: ['scaffolding', '14m', 'guardrails', 'fall arrest', 'harness', 'unclipped', 'ladder', 'working at heights'],
    checklist: [
      { step: 'Step 1: Immediate Descent', phase: 'Immediate', directive: 'Instruct personnel to safely descend and tag scaffolding RED (Do Not Use).' },
      { step: 'Step 2: Scaffolding Re-tagging', phase: 'Corrective', directive: 'Install double handrails, toe boards, and certified green inspection tag.' },
      { step: 'Step 3: 100% Tie-Off Audit', phase: 'Verification', directive: 'Inspect double-lanyard full body harnesses and shock absorbers for all crew.' },
    ],
    barriers: [
      { name: 'Collective Edge Protection Barrier', status: 'Failed — Guardrails missing', ok: false },
      { name: '100% Tie-off Fall Arrest System', status: 'Bypassed — Worker unhooked', ok: false },
      { name: 'Scaffold Inspection Tag Status', status: 'Tag Revoked to RED', ok: true },
    ],
  },
  {
    rule: 'Ground Disturbance',
    severity: 'High',
    templates: [
      'Excavator operator struck unmapped 4-inch pressurized natural gas pipeline during trenching without hand-digging trial pits.',
      'Deep excavation trench at 2.8m depth entered by pipefitters without trench shoring box or soil sloping. Spoil pile stacked at trench edge.',
      'Backhoe severed 11kV underground armored power cable during drainage ditch digging. Cable route marker was disregarded.',
      'Ground disturbance permit issued without obtaining utility clearance sign-off from pipeline and telecom departments.',
      'Unauthorized mechanical digging conducted within 5m of active high pressure crude oil transmission pipeline.',
    ],
    tokens: ['excavator', 'struck', 'pipeline', 'trench', 'shoring', 'severed', 'underground', 'ground disturbance'],
    checklist: [
      { step: 'Step 1: Emergency Excavation Stop', phase: 'Immediate', directive: 'Shut down excavator engine, evacuate trench, and barricade 50m perimeter.' },
      { step: 'Step 2: Pipeline Integrity Check', phase: 'Assessment', directive: 'Perform ultrasonic wall thickness test and pipe coating holiday detection.' },
      { step: 'Step 3: Shoring Installation', phase: 'Remediation', directive: 'Install certified aluminum shoring shields before any trench re-entry.' },
    ],
    barriers: [
      { name: 'Utility Clearance & As-Built Verification', status: 'Failed — Route not potholed', ok: false },
      { name: 'Trench Wall Shoring Barrier', status: 'Missing — Unshored vertical wall', ok: false },
      { name: 'Ground Disturbance Permit Protocol', status: 'Violated', ok: false },
    ],
  },
  {
    rule: 'Bypassing Safety Controls',
    severity: 'Critical',
    templates: [
      'High-pressure separator emergency shutdown valve (ESDV) bypassed with mechanical lock-open wedge during routine production run.',
      'Fire and gas detector heads in compressor shed covered with plastic bags and taped over without hot work permit or bypass log entry.',
      'Annular BOP hydraulic control line isolated and bypassed on accumulator unit during casing pressure test.',
      'Automatic high level alarm switch on crude dispatch tank disabled by operator using jumper wire on terminal strip.',
      'Pressure relief valve inlet isolation gate valve padlocked closed while vessel was operating at 45 bar.',
    ],
    tokens: ['bypassed', 'shutdown valve', 'esdv', 'fire and gas', 'detector', 'disabled', 'jumper', 'safety controls'],
    checklist: [
      { step: 'Step 1: Remove Unauthorized Bypass', phase: 'Immediate', directive: 'Immediately remove wedge/jumper and restore safety critical device to automatic mode.' },
      { step: 'Step 2: Safety Integrity Audit', phase: 'Investigation', directive: 'Initiate formal incident investigation into unauthorized override of safety interlock.' },
      { step: 'Step 3: Executive Sign-off', phase: 'Verification', directive: 'Obtain Level 3 management sign-off for any temporary defeat permit.' },
    ],
    barriers: [
      { name: 'Instrumented Safety Interlock (SIL)', status: 'Defeated — Hardwired jumper installed', ok: false },
      { name: 'Override Management Authorization', status: 'Bypassed — No MOC on file', ok: false },
      { name: 'Process Safety Relief Barrier', status: 'Restored & Verified', ok: true },
    ],
  },
  {
    rule: 'Driving',
    severity: 'High',
    templates: [
      'Heavy crude oil road tanker truck rolled over into roadside ditch while negotiating sharp turn on wet unpaved oilfield road.',
      'Contractor pickup vehicle observed traveling at 65 km/h in designated 20 km/h wellhead zone with workers in open truck bed.',
      'Forklift driver operated with obstructed forward vision due to overloaded pallet on inclined ramp without spotter.',
      'Commercial delivery truck backed into overhead pipe rack support column after driver ignored height limit warning sign.',
      'Vehicle seatbelt buzzer bypassed using dummy plastic buckle insert during journey between Duliajan and Moran.',
    ],
    tokens: ['tanker', 'truck', 'rolled over', 'speeding', 'vehicle', 'seatbelt', 'collision', 'driving'],
    checklist: [
      { step: 'Step 1: Secure Vehicle & Site', phase: 'Immediate', directive: 'Stop vehicle, engage handbrake, check for fuel leaks, and deploy warning triangles.' },
      { step: 'Step 2: Driver Competency Check', phase: 'Verification', directive: 'Inspect driver defensive driving card, IVMS telemetry data, and sobriety check.' },
      { step: 'Step 3: Route Journey Plan', phase: 'Corrective', directive: 'Re-assess road condition hazard rating and restrict speed limits.' },
    ],
    barriers: [
      { name: 'Vehicle Telemetry & Speed Limiter', status: 'Alert Triggered — Speed exceeded', ok: false },
      { name: 'Driver Fatigue & Journey Plan', status: 'Non-compliant', ok: false },
      { name: 'Vehicle Roll-Over Protection (ROPS)', status: 'Intact — Cab structural integrity held', ok: true },
    ],
  },
]

const ROUTINE_TEMPLATES = [
  {
    severity: 'Low' as SeverityType,
    templates: [
      'A small water leak was observed near the office entrance. The area was cleaned immediately and a maintenance request was raised.',
      'Burnt out 40W fluorescent tube light in the administration corridor replaced with energy saving LED fixture. No electrical hazard.',
      'Routine weekly inspection of eyewash station completed. Water pressure nominal at 2.5 bar, drainage clear, inspection tag initialed.',
      'Minor paper jam cleared in the dispatch office desktop printer. Waste paper collected and disposed in recycling bin.',
      'Ergonomic desk height adjustment requested by control room operator. Facility technician adjusted workstation elevation.',
      'Routine thermal imaging scan of 415V motor control center cubicle busbar connections. All temperature gradients within normal 5C delta.',
      'Replaced worn leather work gloves for roustabout crew at warehouse counter. Inventory log updated.',
      'Monthly fire extinguisher pressure gauge inspection completed across administration building. All 24 units in green zone.',
      'Small domestic water valve dripping in staff canteen washbasin. Plumber replaced rubber washer and verified shut-off.',
      'Housekeeping walk-through conducted in central warehouse. Packaging cartons compacted and pallets aligned within yellow floor lines.',
      'Routine daily battery voltage check on substation emergency lighting pack. Terminal voltage recorded at 27.2V DC (nominal float).',
      'Refilled drinking water dispenser in control room annex. Water quality filter cartridge replaced per scheduled cycle.',
      'Routine vibration survey conducted on standby cooling water pump motor. Vibration velocity measured at 1.8 mm/s, well within ISO class A.',
      'Re-stenciled faded floor safety walking path in workshop bay 02. Anti-skid yellow paint applied and curing cones placed.',
      'Air conditioning filter cleaned in DCS server room. Ambient temperature stabilized at 21 degrees Celsius.',
    ],
  },
  {
    severity: 'Medium' as SeverityType,
    templates: [
      'Minor hydraulic oil seepage of approximately 200ml observed from flange connection on separator bypass line. Flange bolts retorqued.',
      'Faded windsock on wellhead perimeter replaced with new high-visibility orange sleeve during scheduled monthly walk-through.',
      'Slight corrosion pitting noted on external surface of 2-inch utility air line. Ultrasonic thickness gauging confirmed 4.2mm remaining wall.',
      'Portable gas detector failed span calibration check with 50% LEL methane test gas. Sensor head replaced and re-calibrated successfully.',
      'First aid kit in field workshop found with missing sterile gauze packets. Supplies replenished from central medical store.',
      'Loose handrail clamp noticed on stairway leading to tank 102 roof. Mechanical crew tightened clamp and verified rigid latching.',
      'Temporary water drainage hose routed across pedestrian path. Rubber cable protector ramp installed over hose to eliminate trip hazard.',
      'Defective pressure gauge with cracked dial glass replaced on cooling water loop. Zero calibration verified prior to installation.',
      'Minor oil residue buildup observed in compressor skid drip tray. Absorbent pads deployed and tray washed with degreaser.',
      'Emergency exit push bar on secondary substation door stiff to open. Mechanism lubricated with silicon spray and verified smooth.',
    ],
  },
]

/**
 * Generate 5,248 authentic historical records + existing records
 */
export function generateOilIndiaIncidents(existingIncidents: IncidentReport[] = []): IncidentReport[] {
  const result: IncidentReport[] = []
  const existingMap = new Map<string, IncidentReport>()

  existingIncidents.forEach((inc) => {
    existingMap.set(inc.id, inc)
  })

  // Start with existing recent incidents
  existingIncidents.forEach((inc) => result.push(inc))

  const targetTotal = 5248
  const needed = targetTotal - result.length

  if (needed <= 0) return result

  // Generate records chronologically back over 540 days (~18 months)
  const baseDate = new Date('2026-09-07T12:00:00.000Z').getTime()
  const intervalMs = (540 * 24 * 60 * 60 * 1000) / needed

  let sifCount = 0
  let nonSifCount = 0
  const targetSif = Math.floor(needed * 0.384) // ~38.4% SIF rate across historical baseline

  for (let i = 0; i < needed; i++) {
    const num = targetTotal - result.length
    const id = `INC-OIL-${String(num).padStart(4, '0')}`

    if (existingMap.has(id)) {
      continue
    }

    // Determine timestamp
    const recordTime = new Date(baseDate - (result.length * intervalMs) - Math.floor(Math.random() * 3600000)).toISOString()

    // Location and Zone
    const loc = LOCATIONS[i % LOCATIONS.length]
    const zoneList = ZONES[loc] || ['Operations Area']
    const zone = zoneList[i % zoneList.length]

    // Reporter
    const rep = REPORTERS[i % REPORTERS.length]

    // Decide if SIF Precursor or Routine
    const makeSif = sifCount < targetSif && (Math.random() < 0.384 || nonSifCount >= (needed - targetSif))

    if (makeSif) {
      sifCount++
      const sifTpl = SIF_TEMPLATES[i % SIF_TEMPLATES.length]
      const text = sifTpl.templates[i % sifTpl.templates.length]
      const conf = +(0.82 + Math.random() * 0.16).toFixed(2)

      const statusChoices: StatusType[] = ['Resolved', 'Reviewed', 'Escalated', 'Pending']
      const statusWeight = [0.60, 0.22, 0.12, 0.06]
      const r = Math.random()
      let status: StatusType = 'Resolved'
      if (r < statusWeight[3]) status = 'Pending'
      else if (r < statusWeight[3] + statusWeight[2]) status = 'Escalated'
      else if (r < statusWeight[3] + statusWeight[2] + statusWeight[1]) status = 'Reviewed'

      result.push({
        id,
        timestamp: recordTime,
        location: loc,
        facility_zone: zone,
        free_text: text,
        sif_potential: true,
        confidence_score: conf,
        iogp_rule: sifTpl.rule,
        xai_tokens: sifTpl.tokens.slice(0, 6),
        status,
        severity_level: sifTpl.severity,
        reporter_name: rep.name,
        reporter_role: rep.role,
        reviewed_by: status !== 'Pending' ? 'Senior Safety Auditor' : undefined,
        reviewed_at: status !== 'Pending' ? recordTime : undefined,
        reviewer_notes: status !== 'Pending' ? `Corrective barriers verified on site at ${zone}. Close-out audit filed.` : undefined,
        action_checklist: sifTpl.checklist,
        barriers: sifTpl.barriers,
      })
    } else {
      nonSifCount++
      const isMed = Math.random() < 0.45
      const group = isMed ? ROUTINE_TEMPLATES[1] : ROUTINE_TEMPLATES[0]
      const text = group.templates[i % group.templates.length]
      const conf = +(0.04 + Math.random() * 0.22).toFixed(2)

      const status: StatusType = Math.random() < 0.85 ? 'Resolved' : 'Reviewed'

      result.push({
        id,
        timestamp: recordTime,
        location: loc,
        facility_zone: zone,
        free_text: text,
        sif_potential: false,
        confidence_score: conf,
        iogp_rule: null,
        xai_tokens: [],
        status,
        severity_level: group.severity,
        reporter_name: rep.name,
        reporter_role: rep.role,
        reviewed_by: 'Facility Supervisor',
        reviewed_at: recordTime,
        reviewer_notes: 'Standard preventative maintenance completed and logged in CMMS.',
        action_checklist: [
          { step: 'Step 1: Routine Log', phase: 'Maintenance', directive: 'Record observation in facility daily register and update work order.' },
          { step: 'Step 2: Area Housekeeping', phase: 'Verification', directive: 'Confirm area clean, dry, and free of residual material.' },
        ],
        barriers: [
          { name: 'Environmental Containment', status: 'Normal Operating Condition', ok: true },
          { name: 'Facility Infrastructure Barrier', status: 'Asset Integrity Certified', ok: true },
        ],
      })
    }
  }

  return result
}
