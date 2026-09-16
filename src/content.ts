export type SetupId = 'planning-team' | 'promote' | 'delivery-team'
export type LessonId = 'start' | 'prepare' | 'product' | 'federation' | 'implementation' | 'resume' | 'discussion'
export type Prompt = {
  title: string
  text: string
  entry?: 'squad' | 'squad-federation'
  shell?: boolean
  lifecycle?: 'init' | 'promote'
  requiresSetup?: SetupId[]
  squadTarget?: 'implementation' | 'publication'
  publicationTarget?: boolean
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
export const apmVersion = '0.29.0'
export const apmReleaseUrl = 'https://github.com/microsoft/apm/releases/tag/v0.29.0'
export const observationNote: string = 'Expected behaviors to observe, not instructions to paste. Record what actually happens. If a check or proposal is missing, record that gap before intervening; do not quietly prescribe it and then present it as automatic. Consent is still required.'
export const prompts = {
  readiness: "Read business-brief.txt, solution-scope.txt and architecture.png in knowledge-docs at the root of this repository. Summarize the business objective and all required delivery components, their ownership and interfaces, with section references. Confirm that the scope includes Word and PowerPoint add-ins, an ASP.NET Core .NET 10 backend using Aspose.Words and Aspose.Slides for Azure App Service, IaC and CI/CD. Explain what synthetic data replaces and what it must not replace. Report unreadable or missing inputs and contradictions; do not guess image content. For now, only answer: do not start planning or development.",
  planningInit: "init\n\nUse business-brief.txt, solution-scope.txt and architecture.png in knowledge-docs at the root of this repository. We need to define the complete Office reporting solution: Word and PowerPoint add-ins, an ASP.NET Core .NET 10 generation backend using Aspose.Words and Aspose.Slides on Azure App Service, infrastructure as code and CI/CD with security checks. Set up a team for business and product requirements, architecture decisions, uncertainty testing and prioritization across this scope. Let the stated delivery needs guide the expertise proposed. Stop once the team is ready; I will send the work request next.",
  product: "Read business-brief.txt, solution-scope.txt and architecture.png in knowledge-docs. Treat the written solution scope as the workshop delivery baseline: Word and PowerPoint add-ins, an ASP.NET Core .NET 10 generation backend using Aspose.Words and Aspose.Slides on Azure App Service, IaC and CI/CD with security checks. Prepare business requirements, product requirements, architecture decisions and a prioritized backlog covering each component, its interfaces, dependencies and acceptance criteria. Distinguish what we build from external services we integrate with. Propose a thin end-to-end first release that includes a meaningful artifact for every required component; Word-first may order the work but must not remove PowerPoint, backend, IaC or pipelines. Synthetic data may replace unavailable external data access behind the backend data interface, never the backend or Aspose generation. Include a small experiment for the most important compatibility, editability or licensing uncertainty. Flag conflicts and unsupported choices instead of silently substituting another architecture. Present the plan for review before implementation; no cloud resources, deployments or tenant changes.",
  promote: "promote\n\nEvolve the existing team so that it can coordinate planning and a separate delivery team. Preserve the documents, decisions and work items already produced. Stop after this change; do not initialize the delivery team yet or start development.",
  deliveryInit: "init\n\nWithin the existing federation, use the reviewed plan and the files in knowledge-docs to set up a delivery team for the complete agreed first release. The scope includes Word and PowerPoint add-ins, ASP.NET Core .NET 10, Aspose.Words and Aspose.Slides, Azure App Service infrastructure as code, CI/CD and security checks. Include the expertise needed for the add-ins, backend, Azure infrastructure and delivery automation. Synthetic data replaces external data access behind the backend, not the required components. Preserve existing decisions and record the team's registered name. Stop once the team is ready, without starting implementation.",
  implementation: "Implement the agreed first release from the reviewed backlog and solution-scope.txt in knowledge-docs. First present an implementation plan mapping every required component to concrete files, interfaces and acceptance evidence: Word and PowerPoint add-ins; an ASP.NET Core .NET 10 generation API using Aspose.Words and Aspose.Slides; Azure App Service IaC; and CI/CD with build, test, security, packaging and approval-controlled deployment stages. Keep the add-ins connected to the backend generation flow. Use local synthetic data behind the backend data interface when external services are unavailable; do not replace the backend or document generation with browser-only JavaScript. Include editable Word and PowerPoint output behavior, provenance, missing-data errors and the agreed preservation of manual additions. Author and locally validate IaC and pipeline definitions without creating resources, deploying or changing a tenant; a later real deployment requires separate explicit approval. Report compatibility, licensing and access blockers rather than silently substituting libraries or claiming incomplete stubs work. Preserve useful existing code and reconcile earlier frontend-only work with the revised plan. Distinguish authored, locally executed, simulated and not-executed results, and keep unfinished work visible.",
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
  status: 'Required workshop delivery baseline; detailed behavior and evidence thresholds remain subject to review',
  name: 'Report Studio',
  firstSlice: "A thin end-to-end report-generation slice spans the Word and PowerPoint add-in shells and their API contract, an ASP.NET Core .NET 10 service using Aspose.Words and Aspose.Slides to generate editable DOCX/PPTX output from a minimal template, synthetic data behind the backend data interface, Azure App Service IaC and CI/CD definitions. Select an available period, request generation through the backend, retrieve the output in the appropriate Office workflow, and verify values, provenance and the agreed manual-edit preservation behavior.",
  extension: "Word-first is sequencing, not a reduced architecture. Every required component must have an explicit first-release artifact and acceptance criterion. If a component is blocked or unfinished, retain its work and mark its real status rather than dropping it. Real Fabric/Power BI, SharePoint and identity integration and deployment are separate approval-dependent milestones, not reasons to omit infrastructure or pipeline authoring.",
  outOfScope: ['Unapproved access to production Fabric, Power BI, SharePoint or other customer services', 'Administrator consent or tenant configuration changes during the exercise', 'Creating Azure resources or executing deployment without separate explicit approval', 'Pretending mock data, pipeline YAML or a deployment plan proves a live integration', 'A promise to finish a production-ready MVP within the half day'],
  mve: "Use the .NET 10 backend with Aspose.Words and Aspose.Slides to generate a minimal editable Word document and PowerPoint presentation from synthetic data. Check host/API compatibility, output editability and library licensing or evaluation limitations. Then test the agreed regeneration rule after a manual addition. Proposed thresholds: all selected values exact, no silently substituted missing values, and no lost manual additions. Record which tests ran, which were blocked, and whether the outcome justifies the chosen generation approach; the experiment is not pre-executed.",
  acceptance: [
    'The reviewed plan covers Word and PowerPoint add-ins, the .NET 10/Aspose backend, Azure App Service IaC and CI/CD, with interfaces, dependencies and acceptance criteria for each',
    'Add-in manifests and host adapters are authored for both Word and PowerPoint, using a shared generation API contract; actual host tests are recorded separately',
    'ASP.NET Core .NET 10 generation code uses Aspose.Words and Aspose.Slides; generated DOCX/PPTX editability, compatibility and licensing limitations are evidenced rather than assumed',
    'Synthetic values come from the backend data-provider boundary and match the selected period; source, scope and template version are traceable',
    'Regeneration preserves manual additions according to an agreed rule; missing periods and null values produce explicit errors without invented replacements',
    'IaC describes the required Azure App Service hosting and supporting configuration, with environment parameters and secret references; validation or plan results are recorded without applying changes',
    'CI/CD definitions cover build, test, security checks including SAST/DAST where applicable, packaging and approval-controlled deployment; unexecuted stages and prerequisites are explicit',
    'A component-to-evidence matrix distinguishes authored, locally executed, simulated, blocked and not-executed work; no required component is silently omitted',
  ],
}
export const architecture = [
  'Delivery ownership: build Word and PowerPoint add-ins, an ASP.NET Core .NET 10 generation backend using Aspose.Words and Aspose.Slides for Azure App Service, IaC and CI/CD. The written scope supersedes the earlier native-Word-table-only simplification, not organizational policies or required approvals. Raise source conflicts before implementation.',
  'Fabric/Power BI data and report endpoints, Entra ID, SharePoint and Key Vault are integration dependencies, not platforms to rebuild. Describe and configure approved application-side integration without assuming authority over a tenant. In the authorized private diagram, purple dashed outlines indicate delivery ownership, not security or deployment boundaries.',
  'Synthetic fixtures replace only unavailable external data or service responses behind explicit interfaces. Keep the actual .NET backend, Aspose generation, Office/API contracts, IaC source and pipeline source. The browser preview illustrates a data contract, not the target implementation.',
  'No deployment is an execution boundary, not an authoring exclusion. Author Azure App Service IaC with environment parameters and secret references, plus CI/CD build, test, SAST/DAST where applicable, packaging and approval-controlled deployment stages. Record authorized local validation separately from cloud plans requiring tenant reads, hosted CI and apply/deploy, which need their actual permissions and approvals.',
  'Confirm Aspose package versions and licensing or evaluation limitations, supported .NET 10 runtime and hosting, template formats and manual-edit preservation. Choose Bicep/AVM or Terraform and GitHub Actions or Azure Pipelines explicitly; optional Azure DevOps work-item publication does not select the CI/CD host.',
  'Distinguish Power BI/RDL paginated reports, Power BI exports and editable DOCX/PPTX documents. Do not silently substitute another generation architecture when support or licensing is blocked.',
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
    title: 'Install HVE Squad with APM v0.29.0', shell: true,
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
    '  Write-Output "Place business-brief.txt, solution-scope.txt and authorized architecture.png in knowledge-docs before installation; report a missing image."',
    '}',
  ].join('\n'),
}
export const pdfReadiness = {
  title: 'Check that your actual client can read all three knowledge inputs',
  requirement: 'Read business-brief.txt, solution-scope.txt and architecture.png together. Compare the objective, every component, ownership and interfaces with section references. Confirm Word, PowerPoint, ASP.NET Core .NET 10, Aspose.Words, Aspose.Slides, Azure App Service, IaC and CI/CD. The public written scope is complete; the facilitator supplies the authorized private pack. If architecture.png is missing or unreadable, report it and request an authorized copy or explicit acceptance of the written-scope route. Never claim an unseen image was read. The TXT route avoids making Python mandatory.',
  python: 'Python is optional if the client already reads the document. For an authorized text PDF, pypdf can help: use the same Python environment as the client, and check its executable and reader version. An installation in another terminal is not necessarily visible in the App.',
  fallback: 'pypdf does not perform OCR. For a scan, complex layout or protected file, request an accessible, authorized text copy in knowledge-docs; record its source and version. Do not bypass protection or use an external converter.',
  checkpoint: 'I compared every delivery component with the three inputs, or recorded the missing image and explicit written-scope acceptance.',
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
      { title: 'Preserve the complete architecture', body: 'Word and PowerPoint add-ins, .NET 10/Aspose backend, Azure App Service IaC and CI/CD are required. Word-first orders the work; it does not remove components. Synthetic data replaces external access behind the backend. Detailed behavior and experiment thresholds need review.' },
    ],
    evidence: ['The workshop outcome understood', 'Scope questions ready for the live product work at 09:00'],
    checks: ['I distinguish the learning outcome from the complete MVP.', 'I distinguish team setup from a work request.'],
    recovery: 'If you opened this guide repository, change folders before taking any action. Complete the method and preparation at your own pace before Thursday; live work starts in Part 03 at 09:00. The site runs no commands and does not inspect your workstation.',
  },
  {
    id: 'prepare', number: '02', title: 'Environment and context', eyebrow: 'Self-paced preparation', time: 'Before the workshop', minutes: 0,
    goal: 'Have readable context and a consistent installation in the client you actually use.',
    inputs: ['Git, PowerShell and authorized Copilot access', '.NET 10 SDK, Aspose.Words/Slides package access and licensing/evaluation status, Node/Office and chosen IaC tooling', 'Identified Word/PowerPoint hosts and versions; sideloading authorization to confirm'],
    concept: 'Create knowledge-docs at the repository root before installing the plug-in or APM resources. This guide is neither a delivery repository nor a preinitialized team state.',
    beforeInstall: [
      { title: '1. Create the participant repository', body: 'From a parent folder chosen for your projects, this example creates onepoint-workshop-project and moves to its root. It stops if the folder exists. For an existing participant repository, open its root and check knowledge-docs without reinitializing the project.', prompt: repositorySetup },
      { title: '2. Place the three current inputs in knowledge-docs', body: 'Use the facilitator pack: business-brief.txt, solution-scope.txt and architecture.png together at the repository root. Keep data\\report-studio-fixture.json outside knowledge-docs. Archive obsolete frontend-only briefs. For the public synthetic route, save the exercise brief as business-brief.txt and download solution-scope.txt; request an authorized diagram or explicit acceptance of the written-scope route. Never claim an unavailable image was read. Do not copy private inputs into this site.' },
    ],
    steps: [
      { title: 'Check versions and client', body: 'For the plug-in, confirm both active entries in the actual client. For APM, use exactly v0.29.0, not latest. Run apm --version and confirm 0.29.0 before authenticating to GitHub and installing from the participant repository. If another version is reported, install the required release first. HVE Squad v0.16.2 is a separate package version, not the APM CLI version or proof of workstation readiness.' },
      { title: 'Check all implementation prerequisites', body: 'Record .NET 10 SDK, authorized Aspose package/license status, Office hosts/versions, Node, HTTPS and sideloading, plus the selected IaC tools and pipeline host. A missing license or unsupported runtime is a blocker to record, not a reason to silently substitute another stack. No production connector is required for the backend synthetic provider.' },
      { title: 'Have the client read the context', body: 'After installation, choose Squad Coordinator in the App agent list or via /agent in the CLI; in VS Code confirm the /squad prompt entry in GitHub Copilot Chat. Compare the response below with the document. If the client misses knowledge-docs, explicitly provide the authorized local path.', prompt: { title: 'Check understanding without starting work', entry: 'squad', text: prompts.readiness } },
    ],
    evidence: ['Local repository and readable scoping document in knowledge-docs', 'Actual installed versions and client used', 'Office readiness or an explicitly recorded blocker'],
    checks: ['knowledge-docs is at the root of my participant repository.', 'My two paired entries are checked, or apm --version reports the required APM v0.29.0.', 'I recorded the host and limitations of my Office environment.', pdfReadiness.checkpoint],
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
      { title: 'Backlog: cover every required component', body: 'Review concrete first-release artifacts for both add-ins, .NET 10/Aspose API, App Service IaC and CI/CD, plus interfaces and acceptance evidence. Narrow behavior, not architecture. If earlier work is JavaScript-only, retain useful add-in code and repair the plan before continuing. Existing checkmarks do not prove the corrected scope.' },
    ],
    evidence: ['Reviewed BRD and PRD at the paths actually produced', 'Designed MVE, threshold approved or pending, explicit execution status', 'Prioritized backlog and identified first slice'],
    checks: ['I distinguish BRD, PRD, MVE and MVP.', 'I challenged an assumption or criterion.', 'The slice and its dependencies were reviewed and accepted.', 'Both add-ins, .NET/Aspose, Azure IaC and CI/CD have explicit first-release artifacts and criteria.'],
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
        expected: ['Expertise covers Office, .NET/Aspose, Azure infrastructure and delivery automation.', 'The team is registered alongside planning with distinct responsibilities.', 'Initialization finishes without starting development.'],
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
    concept: 'The thin slice preserves the complete stack: both add-ins, actual .NET 10/Aspose generation, Azure App Service IaC and CI/CD. Synthetic data is behind the backend, not a replacement for it. Authoring infrastructure and deployment stages is required even when executing deployment is not authorized.',
    launchHint: '3. After both confirmations, send this separate request. Review and approve the proposed implementation plan before it is executed.',
    launch: { title: 'Implement the agreed first release', entry: 'squad-federation', requiresSetup: ['delivery-team'], squadTarget: 'implementation', text: prompts.implementation },
    behaviors: ['Implementation follows the slice and its dependencies without silently expanding scope.', 'Business ambiguities and significant changes require a human decision.', 'The summary distinguishes executed, simulated, blocked and not executed; errors do not become zeros.'],
    steps: [
      { title: '10:40–11:00 · Approve the plan', body: 'Confirm the backlog items and host. Without reviewed scope, agree a slice before building. Download the Report Studio dataset and place it in data\\report-studio-fixture.json at the participant repository root; create data if needed. Define the contract: period, scope, three numbers, provenance, date and version.' },
      { title: '11:00–11:25 · Build the slice', body: lab.firstSlice + ' Keep a clear boundary between content generation and the Office adapter. Do not connect to a customer environment; the exercise attests no real Fabric or Power BI operation.' },
      { title: '11:25–11:40 · Test generation and validate delivery artifacts', body: 'Use the .NET/Aspose path for both nominal periods and editable DOCX/PPTX outputs. Test manual-edit preservation, null data and missing periods. Validate IaC and pipeline definitions locally where authorized; record evaluation/license limits and unexecuted stages. The browser lab is not the implementation.' },
      { title: '11:40–11:45 · Review component evidence', body: 'For each of the four components, record concrete files, expected/observed results, commands, versions, blockers and next work. Authored YAML is not an executed pipeline; IaC is not deployed infrastructure. Do not remove unfinished components from scope.' },
    ],
    evidence: ['Agreed slice and changes actually produced', 'Results for both periods and both negative cases', 'Office editing/reinsertion test or explicit not-executed status', 'Gaps, remaining items and next action'],
    checks: ['I approved a plan covering all required components before execution.', 'I compared the backend-generated values and output behavior with the synthetic source.', 'I recorded the add-in/.NET/Aspose results plus IaC and pipeline validation status.', 'I distinguish authored, tested, simulated, blocked and not executed for every component.'],
    recovery: 'At 11:45, stop adding items. If Office is blocked, continue .NET/Aspose tests and IaC/pipeline authoring where possible; mark the host test unexecuted. Do not substitute browser-only generation or consume the discussion.',
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
  { name: 'APM v0.29.0 — required CLI release, not latest', url: apmReleaseUrl },
] as const
