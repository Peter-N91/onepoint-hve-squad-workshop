export type SetupId = 'planning-team' | 'promote' | 'delivery-team'
export type LessonId = 'start' | 'prepare' | 'product' | 'federation' | 'implementation' | 'resume' | 'discussion'
export type Prompt = {
  title: string
  text: string
  entry?: 'squad' | 'squad-federation'
  shell?: boolean
  lifecycle?: 'init' | 'promote'
  requiresSetup?: SetupId[]
}
export type LifecycleStep = {
  id: SetupId
  title: string
  description: string
  request: Prompt
  expected: string[]
  checkpoint: string
}
export type LessonStep = { title: string; body: string; prompt?: Prompt }
export type Lesson = {
  id: LessonId; number: string; title: string; eyebrow: string; time: string; minutes: number
  goal: string; inputs: string[]; concept: string
  launch?: Prompt; launchHint?: string; behaviors?: string[]
  setup?: LifecycleStep[]; beforeInstall?: LessonStep[]
  steps: LessonStep[]; evidence: string[]; checks: string[]; recovery: string
}

export const baseline = '0.16.2'
export const observationNote: string = 'Expected behaviors to observe, not instructions to paste. Record what actually happens. If a check or proposal is missing, record that gap before intervening; do not quietly prescribe it and then present it as automatic. Consent is still required.'
export const prompts = {
  readiness: "Read the scoping document in knowledge-docs at the root of this repository. Summarize the business objective and three requirements, with their section references. Distinguish requirements from proposed workshop choices. For now, only answer: do not start planning or development.",
  planningInit: "init\n\nUse the scoping document in knowledge-docs at the root of this repository. We need to understand the need, define business and product requirements, test uncertainties and prioritize the work before development. Set up a team for this planning work. Stop once the team is ready; I will send the work request next.",
  product: "Using the scoping document in knowledge-docs, prepare business requirements, product requirements and a prioritized backlog with acceptance criteria and a proposed first release. Include a small experiment to test the most important uncertainty. Users must be able to enrich the reports in Word and PowerPoint. Separate facts, assumptions and pending decisions. Present the plan for review before any implementation.",
  promote: "promote\n\nEvolve the existing team so that it can coordinate planning and a separate delivery team. Preserve the documents, decisions and work items already produced. Stop after this change; do not initialize the delivery team yet or start development.",
  deliveryInit: "init\n\nWithin this existing organization, set up a delivery team for the first release agreed in the backlog. The context is an Office add-in for Word and PowerPoint, with Fabric and Power BI data as the eventual target, and synthetic data for the local exercise. Use the reviewed plan and existing decisions to propose suitable expertise. Stop when the team is ready, without starting implementation.",
  implementation: "Implement the first release we agreed in the backlog, using the reviewed requirements and decisions. First propose an implementation plan for approval. For this workshop, use only local synthetic data; do not connect to the customer tenant or deploy anything. The result must produce editable content in the selected Office host and preserve manual additions according to the agreed rule. Surface errors without inventing or substituting missing data. Provide the available evidence and clearly distinguish what was executed, simulated or remains to be done.",
  resume: "Resume the existing work without reinitializing teams or overwriting decisions. Summarize the agreed scope, completed items with their evidence, unexecuted tests and blockers. Propose the next useful backlog action and wait for my approval before continuing.",
}

export const prework = [
  { id: 'start', number: '01', title: 'Outcome and method', time: 'Before the workshop', minutes: 0, output: 'Understand the learning outcome and separate team setup from business work' },
  { id: 'prepare', number: '02', title: 'Environment and context', time: 'Before the workshop', minutes: 0, output: 'Prepare the participant repository, readable knowledge-docs, client and tools before Thursday' },
]
export const agenda = [
  { time: '09:00', end: '10:00', title: 'Product scope and first release', lesson: 'product', minutes: 60, output: 'Reviewed BRD, PRD, MVE and backlog; agreed delivery scope' },
  { time: '10:00', end: '10:30', title: 'Federation and technical decisions', lesson: 'federation', minutes: 30, output: 'Delivery team initialized; explicit Office and data decisions' },
  { time: '10:30', end: '10:40', title: 'Break', lesson: '', minutes: 10, output: '' },
  { time: '10:40', end: '11:45', title: 'First slice and evidence', lesson: 'implementation', minutes: 65, output: 'Backlog slice started, executed where possible and reviewed' },
  { time: '11:45', end: '12:00', title: 'Review and independent resumption', lesson: 'resume', minutes: 15, output: 'Actual state, gaps and next action saved' },
  { time: '12:00', end: '12:30', title: 'Discussion and next steps', lesson: 'discussion', minutes: 30, output: 'Decisions, owners to confirm and the next evidence to collect' },
]
export const lab = {
  status: 'Teaching proposal to confirm at the start, not an approved customer requirement',
  name: 'Report Studio',
  firstSlice: "In Word, select an available period, preview three synthetic indicators, then insert an editable native table and data provenance. A second insertion must not remove manual comments: agree and test the intended behavior.",
  extension: "In PowerPoint, insert an editable summary using the same data if time and host APIs allow. Otherwise, keep the criteria and remaining work in the backlog.",
  outOfScope: ['Production Fabric/Power BI connectivity', 'Administrator consent during the session', 'Customer deployment', 'Complete scheduled automation', 'A promise to finish the Word and PowerPoint MVP'],
  mve: "Test in the selected host whether generated content remains editable and manual additions survive a new insertion. Two datasets, three indicators, zero invented values and zero lost comments. Proposed threshold to approve; the experiment has not been executed during preparation.",
  acceptance: [
    'Period and scope are visible; all three values exactly match the selected synthetic dataset',
    "An editable native Word table, not only a screenshot or PDF",
    'Synthetic source, reference date and template version are displayed',
    'Reinsertion follows the selected rule; no user comment is lost',
    'Missing period or null value: an explicit message, never zero or invented data',
    'Office host, version and observed outcome are recorded; an unrun test is marked not executed',
  ],
}
export const architecture = [
  'Distinguish Power BI/RDL paginated reports, Power BI exports and editable Office documents: the source thread does not specify the technical format.',
  'An add-in combines a manifest, an HTTPS web application and Office.js APIs. Shared business logic does not make Word and PowerPoint APIs identical.',
  'Choose hosts, versions, manifest and requirement sets after checking support. Sideloading and development certificates must be authorized.',
  'Define the data contract and output templates before the real connector. Fabric/OneLake access and a Power BI semantic model are not interchangeable.',
  'Choose supported authentication and least-privilege permissions. No client secret in the add-in or Git; preserve RLS and authorization boundaries.',
  'Execute Queries requires the tenant setting and Read/Build permissions; HTTP 200 responses can include errors or limited data. This endpoint does not support service principals for models with RLS or SSO.',
  'A Power BI export does not guarantee editable Office elements. Assess value accuracy, formatting, pagination and editability separately.',
]
export const installation: Record<'plugin' | 'apm', Prompt> = {
  plugin: {
    title: 'Install both plug-in entries in Copilot CLI', shell: true,
    text: 'copilot plugin marketplace add Peter-N91/hve-squad-plugin\ncopilot plugin install hve-squad@hve-squad-plugin\ncopilot plugin install hve-squad-hve-core@hve-squad-plugin\ncopilot plugin list',
  },
  apm: {
    title: 'Install in the repository with APM, pinned reference', shell: true,
    text: 'apm install "Peter-N91/hve-squad#v0.16.2" --target copilot',
  },
}
export const repositorySetup: Prompt = {
  title: 'Create a new participant repository — PowerShell', shell: true,
  text: [
    '& {',
    '  $ErrorActionPreference = "Stop"',
    '  Get-Command git -ErrorAction Stop | Out-Null',
    '  $repo = Join-Path (Get-Location) "onepoint-workshop-project"',
    '  if (Test-Path -LiteralPath $repo) {',
    '    throw "This folder already exists. Inspect it or choose another parent; do not overwrite it."',
    '  }',
    '  New-Item -ItemType Directory -Path $repo | Out-Null',
    '  Set-Location -LiteralPath $repo',
    '  git init -b main',
    '  if ($LASTEXITCODE -ne 0) { throw "Git failed. Stop and resolve the error." }',
    '  New-Item -ItemType Directory -Path ".\\knowledge-docs" | Out-Null',
    '  $exclusions = @("knowledge-docs/", "private/", "inputs/", ".env", ".env.*", "*.docx", "*.pptx", "*.pdf")',
    '  Set-Content -LiteralPath ".\\.gitignore" -Value $exclusions -Encoding utf8',
    '  Write-Output "Place the scoping document in knowledge-docs before any installation."',
    '}',
  ].join('\n'),
}
export const pdfReadiness = {
  title: 'Check that your actual client can read the scoping document',
  requirement: 'The client must summarize the objective and three requirements with section references. Compare its answer with the source. Finding the file or importing a library does not prove understanding. The synthetic TXT brief in Resources avoids making Python mandatory.',
  python: 'Python is optional if the client already reads the document. For an authorized text PDF, pypdf can help: use the same Python environment as the client, and check its executable and reader version. An installation in another terminal is not necessarily visible in the App.',
  fallback: 'pypdf does not perform OCR. For a scan, complex layout or protected file, request an accessible, authorized text copy in knowledge-docs; record its source and version. Do not bypass protection or use an external converter.',
  checkpoint: 'My client read the objective and three requirements; I compared them with the source.',
  setup: {
    title: 'Optional: check the PDF reader in the selected Python environment', shell: true,
    text: '& {\n  $ErrorActionPreference = "Stop"\n  Get-Command python -ErrorAction Stop | Out-Null\n  python -c "import sys; print(sys.executable); print(sys.version)"\n  if ($LASTEXITCODE -ne 0) { throw "Python unavailable." }\n  python -m pip install pypdf\n  if ($LASTEXITCODE -ne 0) { throw "pypdf installation failed." }\n  python -c "import sys, pypdf; print(sys.executable); print(pypdf.__version__)"\n  if ($LASTEXITCODE -ne 0) { throw "Reader unavailable in this environment." }\n}',
  } satisfies Prompt,
}

export const lessons: Lesson[] = [
  {
    id: 'start', number: '01', title: 'Outcome and method', eyebrow: 'From need to evidence', time: 'Before the workshop', minutes: 0,
    goal: 'Learn to scope and start an Office add-in, not promise a complete MVP in one morning.',
    inputs: ['Your own participant repository, separate from this guide', 'The Report Studio exercise brief, or an authorized scoping document kept locally'],
    concept: 'You express a business outcome, answer questions and assess evidence. Specialist selection and review are behaviors to observe, not an internal procedure to dictate in every request.',
    steps: [
      { title: 'Follow the complete sequence', body: 'Read Parts 01 and 02 at your own pace before Thursday. Part 03 starts with a readiness check-in from 09:00 to 09:10, then planning initialization → confirmation → product work → scope review → promotion → confirmation → delivery initialization → confirmation → implementation. Lifecycle commands and business requests are separate messages. The check-in fits inside the existing product slot, not a live installation session.' },
      { title: 'Define success', body: 'By noon, be able to explain the scope, decisions, tests actually executed and next action. A browser preview does not validate the add-in in Office. A designed experiment has no result yet.' },
      { title: 'Separate target and exercise', body: 'Word and PowerPoint both remain targets. Starting in Word, using synthetic data and adopting the proposed thresholds are teaching proposals to approve. Real Fabric and Power BI connectivity comes later.' },
    ],
    evidence: ['The workshop outcome understood', 'Scope questions ready for the live product work at 09:00'],
    checks: ['I distinguish the learning outcome from the complete MVP.', 'I distinguish team setup from a work request.'],
    recovery: 'If you opened this guide repository, change folders before taking any action. Complete the method and preparation at your own pace before Thursday; live work starts in Part 03 at 09:00. The site runs no commands and does not inspect your workstation.',
  },
  {
    id: 'prepare', number: '02', title: 'Environment and context', eyebrow: 'Self-paced preparation', time: 'Before the workshop', minutes: 0,
    goal: 'Have readable context and a consistent installation in the client you actually use.',
    inputs: ['Git, PowerShell and authorized Copilot access', 'Approved Node and Office development toolchain if testing the add-in', 'Identified Word/PowerPoint hosts and versions; sideloading authorization to confirm'],
    concept: 'Create knowledge-docs at the repository root before installing the plug-in or APM resources. This guide is neither a delivery repository nor a preinitialized team state.',
    beforeInstall: [
      { title: '1. Create the participant repository', body: 'From a parent folder chosen for your projects, this example creates onepoint-workshop-project and moves to its root. It stops if the folder exists. For an existing participant repository, open its root and check knowledge-docs without reinitializing the project.', prompt: repositorySetup },
      { title: '2. Place the scoping document in knowledge-docs', body: 'Before any installation, save the synthetic TXT brief from Resources in knowledge-docs at the root. An authorized working document can stay local; never copy it into this site. The .gitignore excludes private inputs but is not an access control: check tracked files before sharing.' },
    ],
    steps: [
      { title: 'Check versions and client', body: 'For the plug-in, confirm both active entries in the actual client. For APM, authenticate to GitHub, then install from the participant repository. v0.16.2 is the Qubix rehearsal baseline, not a guarantee of installed versions or validation of the Onepoint workstation.' },
      { title: 'Check the Office environment', body: 'Record OS, hosts, versions, manifest type, requirement sets, local HTTPS server and sideloading authorization. Do not request administrator consent during the session. No production connector is needed for synthetic data.' },
      { title: 'Have the client read the context', body: 'After installation, choose Squad Coordinator in the App agent list or via /agent in the CLI; in VS Code confirm the /squad prompt entry in GitHub Copilot Chat. Compare the response below with the document. If the client misses knowledge-docs, explicitly provide the authorized local path.', prompt: { title: 'Check understanding without starting work', entry: 'squad', text: prompts.readiness } },
    ],
    evidence: ['Local repository and readable scoping document in knowledge-docs', 'Actual installed versions and client used', 'Office readiness or an explicitly recorded blocker'],
    checks: ['knowledge-docs is at the root of my participant repository.', 'My two paired entries or APM installation are checked.', 'I recorded the host and limitations of my Office environment.', pdfReadiness.checkpoint],
    recovery: 'Resolve preparation blockers before Thursday where possible. If still blocked at 09:00, pair up in an approved environment and join Part 03; do not add a live installation block. After five minutes blocked, pair up rather than delaying the group. The individual workstation is still not ready; do not bypass a proxy, protection or approved-source policy.',
  },
  {
    id: 'product', number: '03', title: 'Product scope and first release', eyebrow: 'A business outcome, a reviewed plan', time: '09:00–10:00 CEST', minutes: 60,
    goal: 'Obtain reviewed business and product requirements, a minimum experiment and a backlog.',
    inputs: ['Scoping document in knowledge-docs', 'Human answers to questions; no invented requirements'],
    concept: 'Initializing the team does not yet ask it to produce documents. Confirm its proposal, then send one complete business request. BRD: business requirements. PRD: product behaviors. MVE: minimum viable experiment. MVP: minimum viable product.',
    setup: [{
      id: 'planning-team', title: '1. Initialize the planning team',
      description: '09:00–09:10: confirm readiness (repository, readable context, client entries and remaining blockers); pair up in an approved environment if needed. From 09:10, select the planning entry for your client, send the message below, review the proposed team and confirm its creation, then request product work within this same hour. Parts 01 and 02 remain self-paced pre-work, not a live installation session. If a suitable team already exists, inspect and reuse it rather than overwriting it.',
      request: { title: 'Initialize for planning', entry: 'squad', lifecycle: 'init', text: prompts.planningInit },
      expected: ['Proposed expertise follows from the planning context, without a profile prescribed in the request.', 'You confirm and check the team state in the correct repository.', 'Initialization finishes without starting the BRD, PRD, experiment or backlog.'],
      checkpoint: 'I confirmed the planning team and checked that its initialization is complete.',
    }],
    launchHint: '2. After actually confirming the team, send the work request, then answer useful questions.',
    launch: { title: 'Prepare a business and product plan for review', entry: 'squad', requiresSetup: ['planning-team'], text: prompts.product },
    behaviors: ['Planning triggers analysis of missing or conflicting requirements.', 'The team proposes additional expertise and requests the necessary consent.', 'Facts, assumptions, decisions and unexecuted experiments are distinguished; the review is identifiable.'],
    steps: [
      { title: 'BRD: check the need', body: 'Link objectives, scope and constraints to sections of the scoping document. Word and PowerPoint are the targets; the first slice does not cover the whole need. Challenge at least one assumption without imposing an internal allocation of roles.' },
      { title: 'MVE: choose the uncertainty', body: lab.mve + ' Record the hypothesis, protocol, threshold, expected observation and possible decision. Do not turn the proposed threshold into an approved requirement by omission.' },
      { title: 'PRD: make expectations testable', body: 'Define native editing, provenance, period, errors and preservation of manual additions. For reinsertion, consider a new section rather than uncontrolled replacement. Decide, then test; do not assume the rule is agreed.' },
      { title: 'Backlog: choose a coherent slice', body: 'Review priorities, dependencies and acceptance criteria. Explicitly approve first-release items before implementation; keep PowerPoint and the real connector visible if deferred. Without approved scope, development cannot start.' },
    ],
    evidence: ['Reviewed BRD and PRD at the paths actually produced', 'Designed MVE, threshold approved or pending, explicit execution status', 'Prioritized backlog and identified first slice'],
    checks: ['I distinguish BRD, PRD, MVE and MVP.', 'I challenged an assumption or criterion.', 'The slice and its dependencies were reviewed and accepted.', 'Word and PowerPoint remain visible in the target scope.'],
    recovery: 'If the plan is incomplete, record the gaps. Reduce the amount of writing rather than removing review. No Azure DevOps publication is required.',
  },
  {
    id: 'federation', number: '04', title: 'Federation and technical decisions', eyebrow: 'Preserve, then extend', time: '10:00–10:30 CEST', minutes: 30,
    goal: 'Preserve planning and prepare a separate delivery team, without starting development.',
    inputs: ['Existing planning team', 'Reviewed documents, agreed decisions and backlog scope', 'Actual state of Office and data tools'],
    concept: 'promote adopts the existing team into a federation. After confirmation, init prepares another team in that organization. The operations are separate and neither authorizes implementation.',
    setup: [
      {
        id: 'promote', title: '1. Promote while preserving the work',
        description: 'Select Squad Federation Coordinator (App/CLI) or the /squad-federation prompt (VS Code) after the product review. Inspect proposed changes and paths before confirming. An existing federation must be inspected, not recreated.',
        request: { title: 'Evolve the existing organization', entry: 'squad-federation', lifecycle: 'promote', requiresSetup: ['planning-team'], text: prompts.promote },
        expected: ['The planning team is adopted, not rebuilt.', 'Requirements, decisions, backlog and evidence are preserved; new paths are recorded.', 'knowledge-docs stays at the root and no delivery team is initialized yet.'],
        checkpoint: 'I confirmed promotion and checked that planning work is preserved.',
      },
      {
        id: 'delivery-team', title: '2. Initialize the delivery team',
        description: 'Stay with the federation entry for your client. After confirmed promotion, send the init request with the Office context. Confirm the proposed team without requesting implementation yet.',
        request: { title: 'Prepare delivery of the agreed slice', entry: 'squad-federation', lifecycle: 'init', requiresSetup: ['promote'], text: prompts.deliveryInit },
        expected: ['Office and data expertise is proposed from the need and available capabilities.', 'The team is registered alongside planning with distinct responsibilities.', 'Initialization finishes without starting development.'],
        checkpoint: 'I confirmed the delivery team and checked its initialization in the federation.',
      },
    ],
    behaviors: ['Promotion and extension are proposed and confirmed separately.', 'Required expertise is inferred from the need; tool availability and consent remain separate.', 'Host support constraints and the absence of a real connector are explicit.'],
    steps: [
      { title: 'Preserve traceability', body: 'Check the inventory and paths actually reported. Planning documents must remain accessible to delivery. Do not create team.md or federation.md manually.' },
      { title: 'Decide the Office foundation', body: 'Manifest + HTTPS application + Office.js. Check manifest and requirement set support in the target versions. Word and PowerPoint can share the business contract, not all their APIs. Consult the lab technical decisions.' },
      { title: 'Contract before connector', body: 'Choose data and output templates before real authentication. An RDL paginated report, a Power BI export and an editable Office document are not equivalent. Break at 10:30; implementation at 10:40.' },
    ],
    evidence: ['Two separate confirmations', 'Actual team names and paths; planning preserved', 'Host, data and manifest decisions and open limitations'],
    checks: ['Planning deliverables are preserved.', 'I distinguish the responsibilities of the two teams.', 'Office choices are documented with remaining checks.'],
    recovery: 'On a collision or incomplete move, stop and inspect the actual state. Do not erase work to hide the gap. Do not confuse installed expertise with a review actually performed.',
  },
  {
    id: 'implementation', number: '05', title: 'First slice and evidence', eyebrow: 'Build, execute, compare', time: '10:40–11:45 CEST', minutes: 65,
    goal: 'Start the agreed backlog slice and compare evidence with its acceptance criteria.',
    inputs: ['Initialized delivery team', 'Reviewed backlog and decisions, approved slice', 'Downloaded synthetic JSON dataset; no production access required'],
    concept: 'The small Word slice is a teaching proposal to approve, not an imposed complete product. Keep both Office targets. Implementation, engine testing, web preview and host validation are four distinct states.',
    launchHint: '3. After both confirmations, send this separate request. Review and approve the proposed implementation plan before it is executed.',
    launch: { title: 'Implement the agreed first release', entry: 'squad-federation', requiresSetup: ['delivery-team'], text: prompts.implementation },
    behaviors: ['Implementation follows the slice and its dependencies without silently expanding scope.', 'Business ambiguities and significant changes require a human decision.', 'The summary distinguishes executed, simulated, blocked and not executed; errors do not become zeros.'],
    steps: [
      { title: '10:40–11:00 · Approve the plan', body: 'Confirm the backlog items and host. Without reviewed scope, agree a slice before building. Download the Report Studio dataset and place it in data\\report-studio-fixture.json at the participant repository root; create data if needed. Define the contract: period, scope, three numbers, provenance, date and version.' },
      { title: '11:00–11:25 · Build the slice', body: lab.firstSlice + ' Keep a clear boundary between content generation and the Office adapter. Do not connect to a customer environment; the exercise attests no real Fabric or Power BI operation.' },
      { title: '11:25–11:40 · Test happy paths and negative cases', body: 'Run both nominal periods. Edit the native table, add a comment, then reinsert using the approved rule. Test the null value and missing period separately: explicit message, insertion blocked under the exercise convention, no invented data. The lab demonstrates the contract, not Office.' },
      { title: '11:40–11:45 · Review the evidence', body: 'For each criterion, record expected and observed outcomes, host/version, command or action, and evidence. A screenshot does not prove native editing. If PowerPoint is deferred, keep criteria and remaining work; do not announce a completed MVP.' },
    ],
    evidence: ['Agreed slice and changes actually produced', 'Results for both periods and both negative cases', 'Office editing/reinsertion test or explicit not-executed status', 'Gaps, remaining items and next action'],
    checks: ['I approved the implementation plan before execution.', 'I compared all three indicators with the synthetic source.', 'I recorded the actual editing and reinsertion status.', 'I distinguish tested, simulated, blocked and not executed.'],
    recovery: 'At 11:45, stop adding items. If Office or sideloading is blocked, test the engine in the browser and mark Office integration as unvalidated. Do not consume the thirty-minute discussion.',
  },
  {
    id: 'resume', number: '06', title: 'Review and independent resumption', eyebrow: 'Make the next step possible', time: '11:45–12:00 CEST', minutes: 15,
    goal: 'Save the actual state and resume without reinitializing or overwriting decisions.',
    inputs: ['Same project, existing history and deliverables', 'Actually observed evidence, blockers and decisions'],
    concept: 'A new conversation does not mean a new team. Resumption should recognize the agreed scope and propose the next useful action, without prescribing internal state paths.',
    behaviors: ['Existing context is recovered and evidence is distinguished from claims.', 'The next action is proposed, not executed without your approval.'],
    steps: [
      { title: '11:45–11:50 · Resume in the same repository', body: 'Open a new conversation and select the federation entry for your client. If you could not form the federation, stay with the coordinator of the team that actually exists (or /squad in VS Code); do not create one just to tick a guide checkbox.', prompt: { title: 'Recover the work and propose next steps', entry: 'squad-federation', text: prompts.resume } },
      { title: '11:50–11:55 · Write your own request', body: 'Formulate a useful next business question. Explain the desired outcome, constraints and expected decision without prescribing internal roles. Compare the proposed next step with the existing backlog.' },
      { title: '11:55–12:00 · Prepare the handoff', body: 'Download the blank handoff worksheet and complete it in your private repository with actual paths, criteria, blockers and next action. Export progress if useful; it remains self-reporting, not project evidence.' },
    ],
    evidence: ['Resumption that recognizes existing work', 'Handoff with next action and gaps', 'Personal request expressed as an outcome'],
    checks: ['I can resume without reinitializing.', 'My handoff distinguishes facts from unexecuted tests.', 'The next action is specific and I stopped implementation at noon.'],
    recovery: 'If context is missing, check the repository and access before creating anything. Preserve existing decisions; a resumption error does not justify overwriting state.',
  },
  {
    id: 'discussion', number: '07', title: 'Discussion and next steps', eyebrow: 'Thirty protected minutes', time: '12:00–12:30 CEST', minutes: 30,
    goal: 'Compare evidence, limitations and conditions for future independent use.',
    inputs: ['One useful outcome and one concrete gap', 'A decision improved through human review'],
    concept: 'The final discussion is not spare development time. Separate spontaneous behavior, human intervention and unmet expectations. An incomplete application can still accompany successful learning.',
    steps: [
      { title: '12:00–12:10 · Compare observations', body: 'Which checks and proposals appeared without being dictated? What was missing? Show a document, a correction and real evidence rather than a confident summary.' },
      { title: '12:10–12:20 · Assess transfer to future work', body: 'What should be standardized: preparation, sources, review, traceability? What remains to test for Word and PowerPoint, Fabric/Power BI, authentication, permissions/RLS and continued editability? Distinguish access difficulties from method quality.' },
      { title: '12:20–12:30 · Decide next steps', body: 'Choose a realistic next use, an owner to designate and the expected evidence. Azure DevOps publication is optional, only with an authorized destination and access, an exact batch preview and confirmation before writing; otherwise keep a local backlog.' },
    ],
    evidence: ['One evidenced lesson and limitation', 'Decisions and responsibilities to assign', 'Next evidence to collect'],
    checks: ['I can explain a decision improved by review.', 'I know where to reuse the method and which checks are missing.'],
    recovery: 'Bring blockers and missing behaviors too. Do not credit tools with an integration or outcome that was not executed.',
  },
]
export const lifecycleSteps = lessons.flatMap(lesson => (lesson.setup ?? []).map(step => ({ ...step, lessonId: lesson.id })))
export const troubleshooting = [
  ['Installation blocked', 'After five minutes, pair up in an approved environment. Record that the individual workstation is still not ready; do not bypass the proxy or install from an unauthorized source.'],
  ['No team state in the folder', 'Check the current repository, select Squad Coordinator, then send the init request. Missing team.md/federation.md before this step is normal. Do not create these files manually.'],
  ['Unreadable document', 'Request an accessible, authorized copy in knowledge-docs; compare the objective and three requirements with the source. Do not bypass protection.'],
  ['Office or sideloading blocked', 'Work on the contract and generation-engine tests in the browser. Mark Office integration as unvalidated: a web preview is not a working add-in.'],
  ['Fabric/Power BI unavailable', 'Stay on synthetic datasets. Track the real connector, permissions and RLS tests in the backlog.'],
  ['Not enough time', 'At 11:45, stop adding scope, preserve the work and record real evidence. Do not consume the thirty-minute discussion.'],
  ['Azure DevOps publication requested', 'Optional extension only when the target, access and approval are available. Preview the exact batch and obtain confirmation before writing; otherwise keep a local backlog.'],
  ['I see a skill rather than the agent', 'Use the App agent list or /agent in the CLI. Choose Squad Coordinator for planning, Squad Federation Coordinator for federation. VS Code instead uses the verified /squad and /squad-federation prompt files installed by repository-scoped APM, not a similarly named skill.'],
  ['The agent or prompt is missing', 'Check the repository, installation and current client. App and CLI may use different plug-in directories. In VS Code verify .github/prompts/squad and the slash entries in GitHub Copilot Chat after APM installation. Terminal or MCP-only installation does not prove prompt availability. Avoid duplicate plug-in resources; a copied command does not install anything.'],
  ['An expected check is missing', 'Record the gap before intervening. A checked box on this site is neither execution, authorization nor automatic evidence.'],
  ['Where do I send init and promote?', 'In the selected App/CLI agent conversation, with full context; in VS Code use the complete prompt-file command shown. These are not standalone PowerShell commands. Single-squad initialization has no standalone init flag in VS Code. Confirm each outcome before the next message.'],
  ['Pre-work unfinished at 09:00', 'Parts 01 and 02 are self-paced before the workshop, with zero live minutes. Join an approved partner environment. Part 03 has a 09:00–09:10 readiness check-in, then planning init and product work from 09:10. Record your readiness gap; do not add a live installation session or shorten the final discussion.'],
]
export const sources = [
  { name: 'HVE Squad v0.16.2 — usage', url: 'https://github.com/Peter-N91/hve-squad/blob/v0.16.2/docs/usage.html' },
  { name: 'CLI plug-in installation', url: 'https://peter-n91.github.io/hve-squad-plugin/install-cli.html' },
  { name: 'App plug-in installation', url: 'https://peter-n91.github.io/hve-squad-plugin/install-desktop.html' },
  { name: 'Office Add-ins — overview', url: 'https://learn.microsoft.com/en-us/office/dev/add-ins/overview/office-add-ins' },
  { name: 'Requirement set support', url: 'https://learn.microsoft.com/en-us/office/dev/add-ins/develop/office-versions-and-requirement-sets' },
  { name: 'Word API', url: 'https://learn.microsoft.com/en-us/office/dev/add-ins/word/word-add-ins-programming-overview' },
  { name: 'PowerPoint API', url: 'https://learn.microsoft.com/en-us/office/dev/add-ins/powerpoint/powerpoint-add-ins' },
  { name: 'Power BI Execute Queries', url: 'https://learn.microsoft.com/en-us/rest/api/power-bi/datasets/execute-queries' },
  { name: 'Official Copilot CLI installation', url: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/install-copilot-cli' },
  { name: 'APM quickstart', url: 'https://microsoft.github.io/apm/quickstart/' },
  { name: 'HVE Core — minimum viable experiment design', url: 'https://github.com/microsoft/hve-core/blob/7cc6dc42caf7f842e1f7aa9f3d41cb4581538f33/.github/skills/project-planning/experiment-design/SKILL.md' },
  { name: 'VS Code /squad prompt — v0.16.2 inputs', url: 'https://github.com/Peter-N91/hve-squad/blob/v0.16.2/squad-src/.github/prompts/squad/squad.prompt.md' },
  { name: 'VS Code /squad-federation prompt — v0.16.2 inputs', url: 'https://github.com/Peter-N91/hve-squad/blob/v0.16.2/squad-src/.github/prompts/squad/squad-federation.prompt.md' },
  { name: 'APM manifest — v0.16.2 prompt-file distribution', url: 'https://github.com/Peter-N91/hve-squad/blob/v0.16.2/apm.yml' },
] as const
