import type { Prompt } from './content'
import type { Locale } from './language'
import type { DestinationField } from './state'

export const optionalCheckIds = ['ado-0', 'ado-1', 'ado-2'] as const
const copy = {
  title: ['Publish to Azure DevOps · optional', 'Publier dans Azure DevOps · facultatif'],
  badge: ['OPTIONAL BRANCH · NOT A PREREQUISITE', 'PARCOURS FACULTATIF · AUCUN PRÉREQUIS POUR LA SUITE'],
  intro: ['After reviewing the local backlog in Part 03, choose with the facilitator: publish it to Azure DevOps, or continue directly to federation and implementation. Creating a reviewed local backlog is still required; publishing it is not.', 'Après la revue du backlog local en partie 03, choisissez avec l’animateur : le publier dans Azure DevOps, ou poursuivre directement vers la fédération et l’implémentation. Un backlog local revu reste nécessaire ; sa publication ne l’est pas.'],
  timing: ['Allow about 15–20 minutes only if selected during practice. No additional fixed agenda slot, no effect on core progress, and no reduction of the 12:00–12:30 discussion.', 'Prévoyez environ 15–20 minutes uniquement si ce parcours est choisi pendant la pratique. Aucun créneau fixe supplémentaire, aucun effet sur la progression principale et aucune réduction de la discussion 12:00–12:30.'],
  split: ['Some participants can publish while others advance to implementation. If sharing a repository or tracker, agree ownership, separate working copies and participant prefixes before parallel work to avoid conflicting edits or duplicate items.', 'Certains participants peuvent publier pendant que d’autres avancent vers l’implémentation. Si vous partagez un dépôt ou un outil de suivi, convenez des responsabilités, de copies de travail séparées et de préfixes participants avant de travailler en parallèle afin d’éviter conflits et doublons.'],
  prerequisites: ['Have a reviewed backlog and batch, approved organization/project and document destination, participant scope, and authenticated access through the approved Azure DevOps capability in your actual client. Confirm read/write permissions and the project process. Do not use another person’s credentials or a PAT/REST workaround.', 'Préparez un backlog et un lot revus, une organisation/un projet et une destination documentaire autorisés, un périmètre participant et un accès authentifié via la capacité Azure DevOps approuvée dans votre client réel. Confirmez les permissions et le processus du projet. N’utilisez pas les identifiants d’autrui ni un contournement PAT/REST.'],
  privacy: ['Destination fields stay in this browser and are included in progress exports and copied requests. Enter no credentials. Review before sharing. This guide does not authenticate or write to Azure DevOps; checking a box is not publication approval.', 'Les destinations restent dans ce navigateur et figurent dans les exports de progression et les demandes copiées. Ne saisissez aucun identifiant secret. Relisez avant partage. Ce guide ne s’authentifie pas et n’écrit pas dans Azure DevOps ; cocher une case n’approuve pas une publication.'],
  beforePromotion: ['Use your existing planning team in the participant project. If you have already promoted it, confirm the promotion checkpoint so this page routes through the federation and asks for the registered planning squad name. Never reinitialize moved team state.', 'Utilisez votre équipe de planification existante dans le dépôt participant. Si elle a déjà été promue, confirmez le jalon de promotion pour que cette page utilise la fédération et demande le nom enregistré de l’équipe de planification. Ne réinitialisez jamais un état d’équipe déplacé.'],
  afterPromotion: ['Promotion is confirmed: route this optional request to the existing registered planning squad through the federation. Use its actual name, not the delivery-team name unless that is genuinely the owner of this work.', 'La promotion est confirmée : adressez cette demande facultative à l’équipe de planification enregistrée via la fédération. Utilisez son nom réel, pas celui de l’équipe de réalisation sauf si elle est réellement responsable de ce travail.'],
  destination: ['Azure DevOps destination · required only here', 'Destination Azure DevOps · obligatoire uniquement ici'],
  requestTitle: ['Preview the publication batch before approval', 'Prévisualiser le lot avant approbation'],
  request: ['We have reviewed this local backlog and want the team to work from it in Azure DevOps. Prepare the backlog items in the specified project, store the reviewed requirements and experiment plan in the agreed documentation location, and link them to the relevant work items. First show the exact proposed changes, including the destination, item count, hierarchy, document changes and possible duplicates. Do not write anything until I approve the specific batch. Preserve real identifiers and report any partial completion so we can resume without duplicating completed work.', 'Nous avons revu ce backlog local et souhaitons que l’équipe l’utilise dans Azure DevOps. Préparez les éléments du backlog dans le projet indiqué, les exigences et le plan d’expérimentation revus dans la destination documentaire convenue, et leurs liens vers les éléments concernés. Présentez d’abord les modifications exactes : destination, nombre d’éléments, hiérarchie, documents et doublons éventuels. N’écrivez rien avant mon approbation du lot précis. Conservez les identifiants réels et signalez toute réalisation partielle pour reprendre sans recréer les éléments déjà terminés.'],
  review: ['Review and evidence', 'Revue et preuves'],
  preview: ['Inspect the exact batch, hierarchy, duplicate findings and document links. Consent to add a missing capability is separate from approval of the publication batch. Approve only the reviewed content and destination in the agent conversation.', 'Inspectez le lot exact, la hiérarchie, les doublons et les liens documentaires. Le consentement à ajouter une capacité manquante est distinct de l’approbation du lot. Approuvez uniquement le contenu et la destination revus dans la conversation avec l’agent.'],
  evidence: ['After approval, inspect actual work-item IDs, links and hierarchy. Record which document changes succeeded. On partial failure, preserve completed operations and the remaining batch; do not replay everything or claim completion.', 'Après approbation, vérifiez les identifiants réels, les liens et la hiérarchie. Consignez les modifications documentaires réussies. En cas d’échec partiel, conservez les opérations réalisées et le lot restant ; ne rejouez pas tout et ne déclarez pas une réussite fictive.'],
  optionalProgress: ['Optional evidence only — excluded from the main progress bar', 'Preuves facultatives uniquement — exclues de la progression principale'],
  check0: ['I reviewed the exact destination and batch before authorizing it.', 'J’ai revu la destination et le lot exacts avant de les autoriser.'],
  check1: ['I can open the real items and inspect their hierarchy and document links.', 'Je peux ouvrir les éléments réels et vérifier leur hiérarchie et leurs liens documentaires.'],
  check2: ['I recorded completed operations, outstanding work or the actual blocker.', 'J’ai consigné les opérations réalisées, le travail restant ou le blocage réel.'],
  fallback: ['Skip, blocked or partially completed? Keep the reviewed local backlog and continue. No Azure DevOps field, approval or optional checkbox is required for Parts 04–07. Never weaken an existing team-setup checkpoint to skip publication.', 'Parcours ignoré, bloqué ou partiellement terminé ? Conservez le backlog local revu et continuez. Aucun champ Azure DevOps, accord ou jalon facultatif n’est requis pour les parties 04–07. Ne supprimez pas un prérequis de constitution d’équipe pour ignorer la publication.'],
  continue: ['Continue to Part 04 · federation', 'Continuer vers la partie 04 · fédération'],
  implement: ['Delivery team ready? Go to Part 05', 'Équipe de réalisation prête ? Partie 05'],
  local: ['Use the reviewed local backlog if publication was skipped or blocked; use real Azure DevOps IDs when available. You do not need to finish the optional activity first.', 'Utilisez le backlog local revu si la publication est ignorée ou bloquée ; utilisez les identifiants Azure DevOps réels s’ils existent. Il n’est pas nécessaire de terminer l’activité facultative avant de poursuivre.'],
  squad: ['Registered implementation squad name', 'Nom enregistré de l’équipe de réalisation'],
  planningSquad: ['Registered planning squad name · optional publication only', 'Nom enregistré de l’équipe de planification · publication facultative uniquement'],
  planningHint: ['Use the exact registered planning-team name preserved during promotion. This target applies only to optional publication, not implementation. The guide checks syntax, not federation membership.', 'Utilisez le nom exact enregistré de l’équipe de planification préservée lors de la promotion. Cette cible concerne uniquement la publication facultative, pas l’implémentation. Le guide vérifie le format, pas l’appartenance à la fédération.'],
  squadHint: ['Enter the exact name chosen during delivery-team initialization, not a profile label. Lowercase letters, digits and hyphens only. This guide checks the format, not membership of your federation. No team name is preselected.', 'Saisissez le nom exact choisi lors de l’initialisation de l’équipe de réalisation, pas un profil. Lettres minuscules, chiffres et tirets uniquement. Le guide vérifie le format, pas l’appartenance à votre fédération. Aucun nom n’est présélectionné.'],
  example: ['Example only: delivery', 'Exemple uniquement : delivery'],
  blocked: ['Request not ready to copy', 'Demande non prête à copier'],
  required: ['Required', 'Obligatoire'],
  optional: ['Optional', 'Facultatif'],
} as const satisfies Record<string, readonly [string, string]>
export type OptionalKey = keyof typeof copy
export const optionalText = (locale: Locale) => (key: OptionalKey): string => copy[key][locale === 'fr' ? 1 : 0]
export const destinationLabels: Record<DestinationField, readonly [string, string]> = {
  organization: ['Organization', 'Organisation'], project: ['Project', 'Projet'],
  participant: ['Participant prefix / scope', 'Préfixe / périmètre participant'],
  documentTarget: ['Documentation destination (repository or Wiki)', 'Destination documentaire (dépôt ou Wiki)'],
  process: ['Project process', 'Processus du projet'], area: ['Area path', 'Chemin de zone'], iteration: ['Iteration', 'Itération'],
}
export function publicationPrompt(locale: Locale, promoted: boolean): Prompt {
  const t = optionalText(locale)
  return {
    title: t('requestTitle'), text: t('request'), publicationTarget: true,
    entry: promoted ? 'squad-federation' : 'squad',
    requiresSetup: promoted ? ['promote'] : ['planning-team'],
    ...(promoted ? { squadTarget: 'publication' as const } : {}),
  }
}
