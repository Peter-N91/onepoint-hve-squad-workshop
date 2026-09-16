import * as en from './content.ts'
import type { Lesson, LessonId, Prompt } from './content.ts'

export const observationNote = 'Comportements attendus à observer, pas des instructions à coller. Notez ce qui se passe réellement. Si une vérification ou une proposition manque, consignez cet écart avant d’intervenir ; ne la prescrivez pas discrètement pour la présenter ensuite comme automatique. Le consentement reste nécessaire.'
export const prompts = {
  readiness: 'Lisez business-brief.txt, solution-scope.txt et architecture.png dans knowledge-docs à la racine de ce dépôt. Résumez l’objectif métier et tous les composants à livrer, leurs responsabilités et interfaces, avec les références des sections. Confirmez que le périmètre comprend les compléments Word et PowerPoint, un backend ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides pour Azure App Service, l’IaC et la CI/CD. Expliquez ce que les données synthétiques remplacent et ce qu’elles ne doivent pas remplacer. Signalez les entrées illisibles ou manquantes et les contradictions ; ne devinez pas le contenu de l’image. Pour le moment, répondez uniquement : ne commencez ni la planification ni le développement.',
  planningInit: 'init\n\nUtilisez business-brief.txt, solution-scope.txt et architecture.png dans knowledge-docs à la racine de ce dépôt. Nous devons définir la solution complète de reporting Office : compléments Word et PowerPoint, backend de génération ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides sur Azure App Service, infrastructure en tant que code et CI/CD avec contrôles de sécurité. Constituez une équipe pour les exigences métier et produit, les décisions d’architecture, les tests d’incertitude et la priorisation sur tout ce périmètre. Laissez les besoins de réalisation guider les expertises proposées. Arrêtez-vous dès que l’équipe est prête ; j’enverrai ensuite la demande de travail.',
  product: 'Lisez business-brief.txt, solution-scope.txt et architecture.png dans knowledge-docs. Prenez le périmètre écrit comme référence de réalisation de l’atelier : compléments Word et PowerPoint, backend de génération ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides sur Azure App Service, IaC et CI/CD avec contrôles de sécurité. Préparez les exigences métier et produit, les décisions d’architecture et un backlog priorisé couvrant chaque composant, ses interfaces, dépendances et critères d’acceptation. Distinguez ce que nous construisons des services externes que nous intégrons. Proposez une première version fine de bout en bout avec un artefact significatif pour chaque composant requis ; commencer par Word peut ordonner le travail, mais ne doit supprimer ni PowerPoint, ni backend, ni IaC, ni pipelines. Les données synthétiques peuvent remplacer l’accès externe indisponible derrière l’interface de données du backend, jamais le backend ni la génération Aspose. Incluez une petite expérimentation pour la principale incertitude de compatibilité, de modification ou de licence. Signalez les conflits et les choix non pris en charge plutôt que substituer discrètement une autre architecture. Présentez le plan pour revue avant l’implémentation ; aucune ressource cloud, aucun déploiement ni changement de tenant.',
  promote: 'promote\n\nFaites évoluer l’équipe existante pour qu’elle puisse coordonner la planification et une équipe de réalisation distincte. Préservez les documents, les décisions et les éléments de travail déjà produits. Arrêtez-vous après ce changement ; n’initialisez pas encore l’équipe de réalisation et ne commencez pas le développement.',
  deliveryInit: 'init\n\nDans la fédération existante, utilisez le plan revu et les fichiers dans knowledge-docs pour constituer une équipe de réalisation de toute la première version convenue. Le périmètre comprend les compléments Word et PowerPoint, ASP.NET Core .NET 10, Aspose.Words et Aspose.Slides, l’infrastructure Azure App Service en tant que code, la CI/CD et les contrôles de sécurité. Incluez les expertises nécessaires aux compléments, au backend, à l’infrastructure Azure et à l’automatisation de la livraison. Les données synthétiques remplacent l’accès externe derrière le backend, pas les composants requis. Préservez les décisions existantes et consignez le nom enregistré de l’équipe. Arrêtez-vous dès que l’équipe est prête, sans commencer l’implémentation.',
  implementation: 'Implémentez la première version convenue à partir du backlog revu et de solution-scope.txt dans knowledge-docs. Présentez d’abord un plan d’implémentation reliant chaque composant requis à des fichiers concrets, des interfaces et des preuves d’acceptation : compléments Word et PowerPoint ; API de génération ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides ; IaC Azure App Service ; et CI/CD avec étapes de compilation, test, sécurité, packaging et déploiement soumis à approbation. Gardez les compléments connectés au flux de génération du backend. Utilisez des données synthétiques locales derrière l’interface de données du backend lorsque les services externes sont indisponibles ; ne remplacez pas le backend ni la génération documentaire par du JavaScript uniquement dans le navigateur. Incluez les sorties Word et PowerPoint modifiables, la provenance, les erreurs de données manquantes et la préservation convenue des ajouts manuels. Rédigez et validez localement les définitions IaC et de pipelines sans créer de ressources, déployer ni modifier un tenant ; un déploiement réel ultérieur exige une approbation explicite distincte. Signalez les blocages de compatibilité, de licence et d’accès plutôt que substituer discrètement des bibliothèques ou prétendre que des ébauches incomplètes fonctionnent. Préservez le code existant utile et réconciliez les travaux précédents limités au frontend avec le plan révisé. Distinguez les résultats rédigés, exécutés localement, simulés et non exécutés, et gardez les travaux inachevés visibles.',
  resume: 'Reprenez le travail existant sans réinitialiser les équipes ni écraser les décisions. Résumez le périmètre convenu, les éléments terminés avec leurs preuves, les tests non exécutés et les blocages. Proposez la prochaine action utile du backlog et attendez mon approbation avant de poursuivre.',
} satisfies typeof en.prompts
export const prework = [
  { id: 'start', number: '01', title: 'Objectif et méthode', time: 'Avant l’atelier', minutes: 0, output: 'Comprendre l’objectif pédagogique et séparer la constitution de l’équipe du travail métier' },
  { id: 'prepare', number: '02', title: 'Environnement et contexte', time: 'Avant l’atelier', minutes: 0, output: 'Préparer le dépôt participant, les documents lisibles dans knowledge-docs, le client et les outils avant jeudi' },
] satisfies typeof en.prework
export const agenda = [
  { time: '09:00', end: '10:00', title: 'Périmètre produit et première version', lesson: 'product', minutes: 60, output: 'BRD, PRD, MVE et backlog revus ; périmètre de réalisation convenu' },
  { time: '10:00', end: '10:30', title: 'Fédération et décisions techniques', lesson: 'federation', minutes: 30, output: 'Équipe de réalisation initialisée ; décisions Office et données explicites' },
  { time: '10:30', end: '10:40', title: 'Pause', lesson: '', minutes: 10, output: '' },
  { time: '10:40', end: '11:45', title: 'Premier incrément et preuves', lesson: 'implementation', minutes: 65, output: 'Incrément du backlog commencé, exécuté si possible et revu' },
  { time: '11:45', end: '12:00', title: 'Revue et reprise autonome', lesson: 'resume', minutes: 15, output: 'État réel, écarts et prochaine action enregistrés' },
  { time: '12:00', end: '12:30', title: 'Discussion et prochaines étapes', lesson: 'discussion', minutes: 30, output: 'Décisions, responsables à confirmer et prochaines preuves à recueillir' },
] satisfies typeof en.agenda
export const lab = {
  status: 'Périmètre de réalisation obligatoire de l’atelier ; comportements détaillés et seuils de preuve restent soumis à revue',
  name: 'Report Studio',
  firstSlice: 'Un incrément fin de génération de rapports de bout en bout couvre les structures des compléments Word et PowerPoint et leur contrat API, un service ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides pour générer des sorties DOCX/PPTX modifiables à partir d’un modèle minimal, des données synthétiques derrière l’interface de données du backend, l’IaC Azure App Service et les définitions CI/CD. Sélectionnez une période disponible, demandez la génération via le backend, récupérez la sortie dans le parcours Office adapté et vérifiez les valeurs, la provenance et la préservation convenue des modifications manuelles.',
  extension: 'Commencer par Word ordonne le travail, sans réduire l’architecture. Chaque composant requis doit avoir un artefact explicite de première version et un critère d’acceptation. Si un composant est bloqué ou inachevé, conservez son travail et son état réel plutôt que le supprimer. L’intégration réelle Fabric/Power BI, SharePoint et identité, ainsi que le déploiement, sont des jalons distincts soumis à approbation, pas des raisons d’omettre la rédaction de l’infrastructure ou des pipelines.',
  outOfScope: ['Accès non approuvé à Fabric, Power BI, SharePoint ou autres services client de production', 'Consentement administrateur ou changements de configuration du tenant pendant l’exercice', 'Création de ressources Azure ou exécution d’un déploiement sans approbation explicite distincte', 'Prétendre que des données simulées, du YAML de pipeline ou un plan de déploiement prouvent une intégration réelle', 'Promesse de terminer un MVP prêt pour la production en une demi-journée'],
  mve: 'Utilisez le backend .NET 10 avec Aspose.Words et Aspose.Slides pour générer un document Word et une présentation PowerPoint minimaux et modifiables à partir de données synthétiques. Vérifiez la compatibilité des applications/API, la possibilité de modifier les sorties et les limites de licence ou d’évaluation des bibliothèques. Testez ensuite la règle de régénération convenue après un ajout manuel. Seuils proposés : toutes les valeurs choisies exactes, aucune substitution silencieuse de valeur manquante et aucun ajout manuel perdu. Consignez les tests exécutés ou bloqués et si leur résultat justifie l’approche de génération choisie ; l’expérimentation n’est pas préexécutée.',
  acceptance: [
    'Le plan revu couvre les compléments Word et PowerPoint, le backend .NET 10/Aspose, l’IaC Azure App Service et la CI/CD, avec interfaces, dépendances et critères d’acceptation pour chacun',
    'Les manifestes et adaptateurs sont rédigés pour Word et PowerPoint avec un contrat API de génération partagé ; les tests réels dans les applications sont consignés séparément',
    'Le code de génération ASP.NET Core .NET 10 utilise Aspose.Words et Aspose.Slides ; la modification des DOCX/PPTX, leur compatibilité et les limites de licence sont étayées, pas supposées',
    'Les valeurs synthétiques proviennent de l’interface du fournisseur de données du backend et correspondent à la période choisie ; source, périmètre et version du modèle sont traçables',
    'La régénération préserve les ajouts manuels selon une règle convenue ; périodes absentes et valeurs nulles produisent des erreurs explicites sans remplacement inventé',
    'L’IaC décrit l’hébergement Azure App Service requis et sa configuration, avec paramètres d’environnement et références aux secrets ; les résultats de validation ou de plan sont consignés sans appliquer de changements',
    'Les définitions CI/CD couvrent compilation, test, contrôles de sécurité dont SAST/DAST si applicables, packaging et déploiement soumis à approbation ; étapes non exécutées et prérequis sont explicites',
    'Une matrice composants-preuves distingue les travaux rédigés, exécutés localement, simulés, bloqués et non exécutés ; aucun composant requis n’est omis silencieusement',
  ],
} satisfies typeof en.lab
export const architecture = [
  'Responsabilité de réalisation : construire les compléments Word et PowerPoint, le backend de génération ASP.NET Core .NET 10 utilisant Aspose.Words et Aspose.Slides pour Azure App Service, l’IaC et la CI/CD. Le périmètre écrit remplace la simplification limitée au tableau Word natif, pas les politiques organisationnelles ni les approbations requises. Signaler les conflits de sources avant l’implémentation.',
  'Fabric/Power BI, leurs points de terminaison de données et rapports, Entra ID, SharePoint et Key Vault sont des dépendances d’intégration, pas des plateformes à reconstruire. Décrire et configurer l’intégration applicative approuvée sans présumer d’autorité sur le tenant. Dans le schéma privé autorisé, les contours violets en pointillés indiquent la responsabilité de réalisation, pas des frontières de sécurité ou de déploiement.',
  'Les données synthétiques remplacent uniquement les données ou réponses de services externes indisponibles derrière des interfaces explicites. Conserver le backend .NET réel, la génération Aspose, les contrats Office/API, les sources IaC et de pipelines. L’aperçu navigateur illustre un contrat de données, pas l’implémentation cible.',
  'Aucun déploiement est une limite d’exécution, pas une exclusion de rédaction. Rédiger l’IaC Azure App Service avec paramètres d’environnement et références aux secrets, ainsi que les étapes CI/CD de compilation, test, SAST/DAST si applicables, packaging et déploiement soumis à approbation. Distinguer la validation locale autorisée des plans cloud nécessitant des lectures du tenant, de la CI hébergée et des apply/deploy, soumis à leurs permissions et approbations réelles.',
  'Confirmer les versions Aspose, les licences et limites d’évaluation, le runtime .NET 10 et son hébergement, les formats de modèles et la préservation des ajouts manuels. Choisir explicitement Bicep/AVM ou Terraform et GitHub Actions ou Azure Pipelines ; la publication facultative d’éléments de travail Azure DevOps ne choisit pas la plateforme CI/CD.',
  'Distinguer les rapports paginés Power BI/RDL, les exports Power BI et les documents DOCX/PPTX modifiables. Ne pas substituer discrètement une autre architecture de génération en cas de blocage de support ou de licence.',
  'Un complément associe un manifeste, une application web HTTPS et les API Office.js. Une logique métier partagée ne rend pas les API Word et PowerPoint identiques.',
  'Choisir les applications, les versions, le manifeste et les ensembles de spécifications après vérification du support. Le chargement indépendant et les certificats de développement doivent être autorisés.',
  'Définir le contrat de données et les modèles de sortie avant le connecteur réel. L’accès Fabric/OneLake et un modèle sémantique Power BI ne sont pas interchangeables.',
  'Choisir une authentification prise en charge et les permissions minimales. Aucun secret client dans le complément ni dans Git ; préserver la sécurité au niveau des lignes (RLS) et les limites d’autorisation.',
  'Execute Queries nécessite le paramètre du tenant et les permissions Read/Build. Une réponse HTTP 200 peut contenir des erreurs ou des données limitées. Ce point de terminaison ne prend pas en charge les principaux de service pour les modèles avec RLS ou SSO.',
  'Un export Power BI ne garantit pas des éléments Office modifiables. Évaluer séparément l’exactitude des valeurs, la mise en forme, la pagination et la possibilité de modification.',
] satisfies typeof en.architecture
export const installation = {
  plugin: { ...en.installation.plugin, title: 'Installer les deux entrées du plug-in dans Copilot CLI' },
  apm: { ...en.installation.apm, title: 'Installer HVE Squad avec APM v0.29.0' },
} satisfies typeof en.installation
export const repositorySetup: Prompt = {
  title: 'Créer un nouveau dépôt participant — PowerShell', shell: true,
  text: [
    '& {',
    '  $ErrorActionPreference = "Stop"',
    '  Get-Command git -ErrorAction Stop | Out-Null',
    '  $repo = Join-Path (Get-Location) "onepoint-workshop-project"',
    '  if (Test-Path -LiteralPath $repo) {',
    '    throw "Ce dossier existe déjà. Inspectez-le ou choisissez un autre parent ; ne l’écrasez pas."',
    '  }',
    '  New-Item -ItemType Directory -Path $repo | Out-Null',
    '  Set-Location -LiteralPath $repo',
    '  git init -b main',
    '  if ($LASTEXITCODE -ne 0) { throw "Échec de Git. Arrêtez-vous et résolvez l’erreur." }',
    '  New-Item -ItemType Directory -Path ".\\knowledge-docs" | Out-Null',
    '  $exclusions = @("knowledge-docs/", "private/", "inputs/", ".env", ".env.*", "*.docx", "*.pptx", "*.pdf")',
    '  Set-Content -LiteralPath ".\\.gitignore" -Value $exclusions -Encoding utf8',
    '  Write-Output "Placez business-brief.txt, solution-scope.txt et architecture.png autorisé dans knowledge-docs avant installation ; signalez une image manquante."',
    '}',
  ].join('\n'),
}
export const pdfReadiness = {
  title: 'Vérifier que votre client réel peut lire les trois sources',
  requirement: 'Lisez ensemble business-brief.txt, solution-scope.txt et architecture.png. Comparez l’objectif, chaque composant, les responsabilités et les interfaces avec références de sections. Confirmez Word, PowerPoint, ASP.NET Core .NET 10, Aspose.Words, Aspose.Slides, Azure App Service, IaC et CI/CD. Le périmètre public écrit est complet ; l’animateur fournit le pack privé autorisé. Si architecture.png manque ou est illisible, signalez-le et demandez une copie autorisée ou l’acceptation explicite du parcours fondé sur le périmètre écrit. Ne prétendez jamais avoir lu une image non vue. Le parcours TXT évite de rendre Python obligatoire.',
  python: 'Python est facultatif si le client lit déjà le document. Pour un PDF textuel autorisé, pypdf peut aider : utilisez le même environnement Python que le client et vérifiez son exécutable et la version du lecteur. Une installation dans un autre terminal n’est pas nécessairement visible dans l’App.',
  fallback: 'pypdf ne fait pas de reconnaissance optique (OCR). Pour un scan, une mise en page complexe ou un fichier protégé, demandez une copie textuelle accessible et autorisée dans knowledge-docs ; consignez sa source et sa version. Ne contournez pas la protection et n’utilisez pas de convertisseur externe.',
  checkpoint: 'J’ai comparé chaque composant aux trois sources, ou consigné l’image manquante et l’acceptation explicite du périmètre écrit.',
  setup: {
    title: 'Facultatif : vérifier le lecteur PDF dans l’environnement Python choisi', shell: true,
    text: '& {\n  $ErrorActionPreference = "Stop"\n  Get-Command python -ErrorAction Stop | Out-Null\n  python -c "import sys; print(sys.executable); print(sys.version)"\n  if ($LASTEXITCODE -ne 0) { throw "Python indisponible." }\n  python -m pip install pypdf\n  if ($LASTEXITCODE -ne 0) { throw "Échec de l’installation de pypdf." }\n  python -c "import sys, pypdf; print(sys.executable); print(pypdf.__version__)"\n  if ($LASTEXITCODE -ne 0) { throw "Lecteur indisponible dans cet environnement." }\n}',
  },
} satisfies typeof en.pdfReadiness

type LessonCopy = Omit<Lesson, 'id' | 'number' | 'time' | 'minutes'>
const lessonCopies = {
  start: {
    title: 'Objectif et méthode', eyebrow: 'Du besoin aux preuves',
    goal: 'Apprendre à cadrer et commencer un complément Office, sans promettre un MVP complet en une matinée.',
    inputs: ['Votre propre dépôt participant, distinct de ce guide', 'Le cadrage de l’exercice Report Studio ou un document de cadrage autorisé conservé localement'],
    concept: 'Vous exprimez un résultat métier, répondez aux questions et évaluez les preuves. La sélection des spécialistes et la revue sont des comportements à observer, pas une procédure interne à dicter dans chaque demande.',
    steps: [
      { title: 'Suivre la séquence complète', body: 'Lisez les parties 01 et 02 à votre rythme avant jeudi. La partie 03 commence par une vérification de préparation de 09:00 à 09:10, puis : initialisation de la planification → confirmation → travail produit → revue du périmètre → promotion → confirmation → initialisation de la réalisation → confirmation → implémentation. Les commandes de cycle de vie et les demandes métier sont des messages séparés. La vérification tient dans le créneau produit existant, pas dans une session d’installation en direct.' },
      { title: 'Définir la réussite', body: 'À midi, pouvoir expliquer le périmètre, les décisions, les tests réellement exécutés et la prochaine action. Un aperçu dans le navigateur ne valide pas le complément dans Office. Une expérimentation conçue n’a pas encore de résultat.' },
      { title: 'Conserver toute l’architecture', body: 'Les compléments Word et PowerPoint, le backend .NET 10/Aspose, l’IaC Azure App Service et la CI/CD sont requis. Word en premier ordonne le travail sans supprimer de composant. Les données synthétiques remplacent l’accès externe derrière le backend. Les comportements détaillés et seuils restent à revoir.' },
    ],
    evidence: ['Objectif de l’atelier compris', 'Questions de périmètre prêtes pour le travail produit en direct à 09:00'],
    checks: ['Je distingue l’objectif pédagogique du MVP complet.', 'Je distingue la constitution d’une équipe d’une demande de travail.'],
    recovery: 'Si vous avez ouvert le dépôt de ce guide, changez de dossier avant toute action. Étudiez la méthode et préparez-vous à votre rythme avant jeudi ; le direct commence avec la partie 03 à 09:00. Le site n’exécute aucune commande et n’inspecte pas votre poste.',
  },
  prepare: {
    title: 'Environnement et contexte', eyebrow: 'Préparation à votre rythme',
    goal: 'Disposer d’un contexte lisible et d’une installation cohérente dans le client réellement utilisé.',
    inputs: ['Git, PowerShell et un accès Copilot autorisé', 'SDK .NET 10, accès aux packages Aspose.Words/Slides et statut licence/évaluation, outils Node/Office et IaC choisis', 'Applications Word/PowerPoint et versions identifiées ; autorisation de chargement indépendant à confirmer'],
    concept: 'Créez knowledge-docs à la racine du dépôt avant d’installer le plug-in ou les ressources APM. Ce guide n’est ni un dépôt de réalisation ni un état d’équipe préinitialisé.',
    beforeInstall: [
      { title: '1. Créer le dépôt participant', body: 'Depuis un dossier parent choisi pour vos projets, cet exemple crée onepoint-workshop-project et se place à sa racine. Il s’arrête si le dossier existe. Pour un dépôt participant existant, ouvrez sa racine et vérifiez knowledge-docs sans réinitialiser le projet.', prompt: repositorySetup },
      { title: '2. Placer les trois entrées actuelles dans knowledge-docs', body: 'Utilisez le pack de l’animateur : business-brief.txt, solution-scope.txt et architecture.png ensemble à la racine du dépôt. Gardez data\\report-studio-fixture.json hors de knowledge-docs et archivez les anciens cadrages frontend uniquement. Pour le cas synthétique public, enregistrez le brief sous business-brief.txt et téléchargez solution-scope.txt ; demandez un schéma autorisé ou une acceptation explicite du périmètre écrit. Ne prétendez pas avoir lu une image absente. Aucun fichier privé dans ce site.' },
    ],
    steps: [
      { title: 'Vérifier les versions et le client', body: 'Pour le plug-in, confirmez les deux entrées actives dans le client réel. Pour APM, utilisez exactement v0.29.0, pas la dernière version. Exécutez apm --version et confirmez 0.29.0 avant de vous authentifier sur GitHub et d’installer depuis le dépôt participant. Si une autre version est affichée, installez d’abord la version requise. HVE Squad v0.16.2 est une version de package distincte, pas celle du CLI APM ni une preuve que le poste est prêt.' },
      { title: 'Vérifier tous les prérequis de réalisation', body: 'Consignez le SDK .NET 10, les packages/licences Aspose autorisés, Office/Node/HTTPS et le chargement indépendant, les outils IaC et la plateforme de pipeline. Une licence manquante ou un runtime non pris en charge est un blocage, pas une raison de remplacer discrètement la pile. Aucun connecteur de production requis pour le fournisseur synthétique du backend.' },
      { title: 'Faire lire le contexte au client', body: 'Après installation, choisissez Squad Coordinator dans la liste des agents de l’App ou via /agent dans le CLI ; dans VS Code, vérifiez l’entrée /squad dans GitHub Copilot Chat. Comparez la réponse ci-dessous au document. Si le client ne trouve pas knowledge-docs, indiquez explicitement le chemin local autorisé.', prompt: { title: 'Vérifier la compréhension sans commencer le travail', entry: 'squad', text: prompts.readiness } },
    ],
    evidence: ['Dépôt local et cadrage lisible dans knowledge-docs', 'Versions réellement installées et client utilisé', 'Préparation Office ou blocage explicitement consigné'],
    checks: ['knowledge-docs est à la racine de mon dépôt participant.', 'Mes deux entrées associées sont vérifiées, ou apm --version affiche la version requise APM v0.29.0.', 'J’ai consigné l’application et les limites de mon environnement Office.', pdfReadiness.checkpoint],
    recovery: 'Résolvez si possible les blocages de préparation avant jeudi. Si vous êtes encore bloqué à 09:00, travaillez en binôme dans un environnement approuvé et rejoignez la partie 03 ; n’ajoutez pas de session d’installation en direct. Après cinq minutes de blocage, formez un binôme plutôt que retarder le groupe. Le poste individuel reste non prêt ; ne contournez ni proxy, ni protection, ni politique de sources approuvées.',
  },
  product: {
    title: 'Périmètre produit et première version', eyebrow: 'Un résultat métier, un plan revu',
    goal: 'Obtenir des exigences métier et produit revues, une expérimentation minimale et un backlog.',
    inputs: ['Document de cadrage dans knowledge-docs', 'Réponses humaines aux questions ; aucune exigence inventée'],
    concept: 'Initialiser l’équipe ne lui demande pas encore de produire des documents. Confirmez sa proposition, puis envoyez une demande métier complète. BRD : exigences métier. PRD : comportements du produit. MVE : expérimentation minimale viable. MVP : produit minimum viable.',
    setup: [{
      id: 'planning-team', title: '1. Initialiser l’équipe de planification',
      description: '09:00–09:10 : confirmer la préparation (dépôt, contexte lisible, entrées du client et blocages restants) ; former un binôme dans un environnement approuvé si nécessaire. Dès 09:10, sélectionnez l’entrée de planification de votre client, envoyez le message ci-dessous, examinez l’équipe proposée et confirmez sa création, puis demandez le travail produit dans cette même heure. Les parties 01 et 02 restent une préparation autonome, pas une installation en direct. Si une équipe adaptée existe déjà, inspectez-la et réutilisez-la sans l’écraser.',
      request: { title: 'Initialiser pour la planification', entry: 'squad', lifecycle: 'init', text: prompts.planningInit },
      expected: ['Les expertises proposées découlent du contexte de planification, sans profil imposé dans la demande.', 'Vous confirmez et vérifiez l’état de l’équipe dans le bon dépôt.', 'L’initialisation se termine sans commencer le BRD, le PRD, l’expérimentation ni le backlog.'],
      checkpoint: 'J’ai confirmé l’équipe de planification et vérifié que son initialisation est terminée.',
    }],
    launchHint: '2. Après avoir réellement confirmé l’équipe, envoyez la demande de travail, puis répondez aux questions utiles.',
    launch: { title: 'Préparer un plan métier et produit pour revue', entry: 'squad', requiresSetup: ['planning-team'], text: prompts.product },
    behaviors: ['La planification déclenche l’analyse des exigences manquantes ou contradictoires.', 'L’équipe propose des expertises complémentaires et demande les consentements nécessaires.', 'Faits, hypothèses, décisions et expérimentations non exécutées sont distingués ; la revue est identifiable.'],
    steps: [
      { title: 'BRD : vérifier le besoin', body: 'Reliez les objectifs, le périmètre et les contraintes aux sections du cadrage. Word et PowerPoint sont les cibles ; le premier incrément ne couvre pas tout le besoin. Remettez en question au moins une hypothèse sans imposer une répartition interne des rôles.' },
      { title: 'MVE : choisir l’incertitude', body: lab.mve + ' Consignez l’hypothèse, le protocole, le seuil, l’observation attendue et la décision possible. Ne transformez pas par omission le seuil proposé en exigence approuvée.' },
      { title: 'PRD : rendre les attentes testables', body: 'Définissez la modification native, la provenance, la période, les erreurs et la préservation des ajouts manuels. Pour la réinsertion, envisagez une nouvelle section plutôt qu’un remplacement incontrôlé. Décidez, puis testez ; ne présumez pas que la règle est convenue.' },
      { title: 'Backlog : couvrir chaque composant requis', body: 'Revoyez les artefacts de première version des deux compléments, de l’API .NET 10/Aspose, de l’IaC App Service et de la CI/CD, avec interfaces et preuves. Réduisez la richesse du parcours, pas l’architecture. Si le travail précédent est uniquement JavaScript, conservez le code utile aux compléments et corrigez le plan avant de continuer. Les anciennes cases cochées ne prouvent pas le nouveau périmètre.' },
    ],
    evidence: ['BRD et PRD revus aux chemins réellement produits', 'MVE conçu, seuil approuvé ou en attente, état d’exécution explicite', 'Backlog priorisé et premier incrément identifié'],
    checks: ['Je distingue BRD, PRD, MVE et MVP.', 'J’ai remis en question une hypothèse ou un critère.', 'L’incrément et ses dépendances ont été revus et acceptés.', 'Les deux compléments, .NET/Aspose, l’IaC Azure et la CI/CD ont des artefacts et critères explicites de première version.'],
    recovery: 'Si le plan est incomplet, consignez les écarts. Réduisez la quantité de rédaction plutôt que supprimer la revue. Aucune publication Azure DevOps n’est requise.',
  },
  federation: {
    title: 'Fédération et décisions techniques', eyebrow: 'Préserver, puis étendre',
    goal: 'Préserver la planification et préparer une équipe de réalisation distincte, sans commencer le développement.',
    inputs: ['Équipe de planification existante', 'Documents revus, décisions convenues et périmètre du backlog', 'État réel des outils Office et données'],
    concept: 'promote intègre l’équipe existante à une fédération. Après confirmation, init prépare une autre équipe dans cette organisation. Les opérations sont distinctes et aucune n’autorise l’implémentation.',
    setup: [
      {
        id: 'promote', title: '1. Promouvoir en préservant le travail',
        description: 'Sélectionnez Squad Federation Coordinator (App/CLI) ou la commande /squad-federation (VS Code) après la revue produit. Inspectez les modifications et chemins proposés avant de confirmer. Une fédération existante doit être inspectée, pas recréée.',
        request: { title: 'Faire évoluer l’organisation existante', entry: 'squad-federation', lifecycle: 'promote', requiresSetup: ['planning-team'], text: prompts.promote },
        expected: ['L’équipe de planification est intégrée, pas reconstruite.', 'Exigences, décisions, backlog et preuves sont préservés ; les nouveaux chemins sont consignés.', 'knowledge-docs reste à la racine et aucune équipe de réalisation n’est encore initialisée.'],
        checkpoint: 'J’ai confirmé la promotion et vérifié que le travail de planification est préservé.',
      },
      {
        id: 'delivery-team', title: '2. Initialiser l’équipe de réalisation',
        description: 'Restez sur l’entrée de fédération de votre client. Après confirmation de la promotion, envoyez la demande init avec le contexte Office. Confirmez l’équipe proposée sans encore demander l’implémentation.',
        request: { title: 'Préparer la réalisation de l’incrément convenu', entry: 'squad-federation', lifecycle: 'init', requiresSetup: ['promote'], text: prompts.deliveryInit },
        expected: ['Les expertises couvrent Office, .NET/Aspose, l’infrastructure Azure et l’automatisation de livraison.', 'L’équipe est enregistrée aux côtés de la planification avec des responsabilités distinctes.', 'L’initialisation se termine sans commencer le développement.'],
        checkpoint: 'J’ai confirmé l’équipe de réalisation et vérifié son initialisation dans la fédération.',
      },
    ],
    behaviors: ['La promotion et l’extension sont proposées et confirmées séparément.', 'Les expertises nécessaires sont déduites du besoin ; disponibilité des outils et consentement restent distincts.', 'Les contraintes de support des applications et l’absence de connecteur réel sont explicites.'],
    steps: [
      { title: 'Préserver la traçabilité', body: 'Vérifiez l’inventaire et les chemins réellement signalés. Les documents de planification doivent rester accessibles à la réalisation. Ne créez pas team.md ou federation.md manuellement.' },
      { title: 'Décider du socle Office', body: 'Manifeste + application HTTPS + Office.js. Vérifiez le support du manifeste et des ensembles de spécifications dans les versions ciblées. Word et PowerPoint peuvent partager le contrat métier, pas toutes leurs API. Consultez les décisions techniques du laboratoire.' },
      { title: 'Le contrat avant le connecteur', body: 'Choisissez les données et les modèles de sortie avant l’authentification réelle. Un rapport paginé RDL, un export Power BI et un document Office modifiable ne sont pas équivalents. Pause à 10:30 ; implémentation à 10:40.' },
    ],
    evidence: ['Deux confirmations distinctes', 'Noms d’équipes et chemins réels ; planification préservée', 'Décisions sur les applications, données et manifeste, et limites ouvertes'],
    checks: ['Les livrables de planification sont préservés.', 'Je distingue les responsabilités des deux équipes.', 'Les choix Office sont documentés avec les vérifications restantes.'],
    recovery: 'En cas de collision ou déplacement incomplet, arrêtez-vous et inspectez l’état réel. N’effacez pas le travail pour masquer l’écart. Ne confondez pas une expertise installée avec une revue réellement effectuée.',
  },
  implementation: {
    title: 'Premier incrément et preuves', eyebrow: 'Construire, exécuter, comparer',
    goal: 'Commencer l’incrément convenu du backlog et comparer les preuves à ses critères d’acceptation.',
    inputs: ['Équipe de réalisation initialisée', 'Backlog et décisions revus, incrément approuvé', 'Jeu JSON synthétique téléchargé ; aucun accès de production requis'],
    concept: 'L’incrément conserve toute la pile : deux compléments, génération .NET 10/Aspose réelle, IaC Azure App Service et CI/CD. Les données synthétiques sont derrière le backend, pas à sa place. Écrire l’infrastructure et les étapes de déploiement reste requis même sans autorisation de les exécuter.',
    launchHint: '3. Après les deux confirmations, envoyez cette demande séparée. Revoyez et approuvez le plan d’implémentation proposé avant son exécution.',
    launch: { title: 'Implémenter la première version convenue', entry: 'squad-federation', requiresSetup: ['delivery-team'], squadTarget: 'implementation', text: prompts.implementation },
    behaviors: ['L’implémentation suit l’incrément et ses dépendances sans élargir discrètement le périmètre.', 'Les ambiguïtés métier et changements significatifs nécessitent une décision humaine.', 'Le bilan distingue exécuté, simulé, bloqué et non exécuté ; les erreurs ne deviennent pas des zéros.'],
    steps: [
      { title: '10:40–11:00 · Approuver le plan', body: 'Confirmez les éléments du backlog et l’application. Sans périmètre revu, convenez d’un incrément avant de construire. Téléchargez le jeu Report Studio et placez-le dans data\\report-studio-fixture.json à la racine du dépôt participant ; créez data si nécessaire. Définissez le contrat : période, périmètre, trois nombres, provenance, date et version.' },
      { title: '11:00–11:25 · Construire l’incrément', body: lab.firstSlice + ' Gardez une frontière claire entre génération du contenu et adaptateur Office. Ne vous connectez pas à un environnement client ; l’exercice n’atteste aucune opération réelle Fabric ou Power BI.' },
      { title: '11:25–11:40 · Tester la génération et valider les artefacts', body: 'Utilisez .NET/Aspose pour les deux périodes et les sorties DOCX/PPTX modifiables. Testez les ajouts manuels, valeurs nulles et périodes absentes. Validez localement l’IaC et les pipelines lorsque cela est autorisé ; signalez les limites de licence/évaluation et les étapes non exécutées. Le laboratoire navigateur n’est pas l’implémentation.' },
      { title: '11:40–11:45 · Revoir les preuves par composant', body: 'Pour chacun des quatre composants, consignez fichiers, attendu/observé, commandes, versions, blocages et prochaine action. Un YAML écrit n’est pas un pipeline exécuté ; l’IaC n’est pas une infrastructure déployée. Ne supprimez pas les composants inachevés du périmètre.' },
    ],
    evidence: ['Incrément convenu et changements réellement produits', 'Résultats des deux périodes et des deux cas négatifs', 'Test Office de modification/réinsertion ou état explicite non exécuté', 'Écarts, éléments restants et prochaine action'],
    checks: ['J’ai approuvé un plan couvrant tous les composants avant exécution.', 'J’ai comparé les valeurs et sorties générées par le backend à la source synthétique.', 'J’ai consigné les résultats Office/.NET/Aspose et la validation de l’IaC et des pipelines.', 'Je distingue écrit, testé, simulé, bloqué et non exécuté pour chaque composant.'],
    recovery: 'À 11:45, cessez d’ajouter des éléments. Si Office est bloqué, poursuivez les tests .NET/Aspose et l’écriture IaC/pipelines si possible ; marquez le test hôte non exécuté. Ne substituez pas une génération navigateur et ne consommez pas la discussion.',
  },
  resume: {
    title: 'Revue et reprise autonome', eyebrow: 'Rendre la suite possible',
    goal: 'Enregistrer l’état réel et reprendre sans réinitialiser ni écraser les décisions.',
    inputs: ['Même projet, historique et livrables existants', 'Preuves réellement observées, blocages et décisions'],
    concept: 'Une nouvelle conversation ne signifie pas une nouvelle équipe. La reprise doit reconnaître le périmètre convenu et proposer la prochaine action utile, sans imposer des chemins d’état internes.',
    behaviors: ['Le contexte existant est récupéré et les preuves sont distinguées des affirmations.', 'La prochaine action est proposée, pas exécutée sans votre approbation.'],
    steps: [
      { title: '11:45–11:50 · Reprendre dans le même dépôt', body: 'Ouvrez une nouvelle conversation et sélectionnez l’entrée de fédération de votre client. Si vous n’avez pas pu former la fédération, restez avec le coordinateur de l’équipe qui existe réellement (ou /squad dans VS Code) ; n’en créez pas une simplement pour cocher une case du guide.', prompt: { title: 'Retrouver le travail et proposer la suite', entry: 'squad-federation', text: prompts.resume } },
      { title: '11:50–11:55 · Écrire votre propre demande', body: 'Formulez une prochaine question métier utile. Expliquez le résultat souhaité, les contraintes et la décision attendue sans imposer de rôles internes. Comparez la suite proposée au backlog existant.' },
      { title: '11:55–12:00 · Préparer la transmission', body: 'Téléchargez la fiche de transmission vierge et complétez-la dans votre dépôt privé avec les chemins réels, critères, blocages et prochaine action. Exportez la progression si utile ; elle reste déclarative, pas une preuve du projet.' },
    ],
    evidence: ['Reprise reconnaissant le travail existant', 'Transmission avec prochaine action et écarts', 'Demande personnelle exprimée comme un résultat'],
    checks: ['Je peux reprendre sans réinitialiser.', 'Ma transmission distingue les faits des tests non exécutés.', 'La prochaine action est précise et j’ai arrêté l’implémentation à midi.'],
    recovery: 'Si le contexte manque, vérifiez le dépôt et les accès avant de créer quoi que ce soit. Préservez les décisions existantes ; une erreur de reprise ne justifie pas d’écraser l’état.',
  },
  discussion: {
    title: 'Discussion et prochaines étapes', eyebrow: 'Trente minutes protégées',
    goal: 'Comparer les preuves, les limites et les conditions d’une utilisation autonome future.',
    inputs: ['Un résultat utile et un écart concret', 'Une décision améliorée par la revue humaine'],
    concept: 'La discussion finale n’est pas une réserve de temps de développement. Séparez comportement spontané, intervention humaine et attentes non satisfaites. Une application incomplète peut accompagner un apprentissage réussi.',
    steps: [
      { title: '12:00–12:10 · Comparer les observations', body: 'Quelles vérifications et propositions sont apparues sans être dictées ? Qu’a-t-il manqué ? Montrez un document, une correction et des preuves réelles plutôt qu’un résumé assuré.' },
      { title: '12:10–12:20 · Évaluer la réutilisation', body: 'Que faut-il standardiser : préparation, sources, revue, traçabilité ? Que reste-t-il à tester pour Word et PowerPoint, Fabric/Power BI, l’authentification, les permissions/RLS et la modification continue ? Distinguez les difficultés d’accès de la qualité de la méthode.' },
      { title: '12:20–12:30 · Décider de la suite', body: 'Choisissez une prochaine utilisation réaliste, un responsable à désigner et les preuves attendues. La publication Azure DevOps est facultative, uniquement avec une destination et des accès autorisés, un aperçu du lot exact et une confirmation avant écriture ; sinon, gardez un backlog local.' },
    ],
    evidence: ['Un enseignement et une limite étayés', 'Décisions et responsabilités à attribuer', 'Prochaines preuves à recueillir'],
    checks: ['Je peux expliquer une décision améliorée par la revue.', 'Je sais où réutiliser la méthode et quelles vérifications manquent.'],
    recovery: 'Apportez aussi les blocages et comportements manquants. N’attribuez pas aux outils une intégration ou un résultat non exécuté.',
  },
} satisfies Record<LessonId, LessonCopy>
// IDs, ordering, numbering and durations always come from the canonical structure.
export const lessons: Lesson[] = en.lessons.map(({ id, number, time, minutes }) => ({
  id, number, minutes, time: minutes === 0 ? 'Avant l’atelier' : time, ...lessonCopies[id],
}))
export const lifecycleSteps = lessons.flatMap(lesson => (lesson.setup ?? []).map(step => ({ ...step, lessonId: lesson.id })))
export const troubleshooting = [
  ['Installation bloquée', 'Après cinq minutes, formez un binôme dans un environnement approuvé. Consignez que le poste individuel reste non prêt ; ne contournez pas le proxy et n’installez rien depuis une source non autorisée.'],
  ['Aucun état d’équipe dans le dossier', 'Vérifiez le dépôt courant, choisissez l’entrée de planification de votre client, puis envoyez la demande d’initialisation. L’absence de team.md/federation.md avant cette étape est normale. Ne créez pas ces fichiers manuellement.'],
  ['Document illisible', 'Demandez une copie accessible et autorisée dans knowledge-docs ; comparez l’objectif et trois exigences à la source. Ne contournez pas la protection.'],
  ['Office ou chargement indépendant bloqué', 'Travaillez sur le contrat et les tests du moteur de génération dans le navigateur. Marquez l’intégration Office comme non validée : un aperçu web n’est pas un complément fonctionnel.'],
  ['Fabric/Power BI indisponible', 'Restez sur les jeux synthétiques. Suivez le connecteur réel, les permissions et les tests RLS dans le backlog.'],
  ['Temps insuffisant', 'À 11:45, cessez d’élargir le périmètre, préservez le travail et consignez les preuves réelles. Ne consommez pas les trente minutes de discussion.'],
  ['Publication Azure DevOps demandée', 'Extension facultative, uniquement si la cible, les accès et l’approbation sont disponibles. Prévisualisez le lot exact et obtenez une confirmation avant écriture ; sinon, gardez un backlog local.'],
  ['Je vois une compétence plutôt que l’agent', 'Utilisez la liste des agents de l’App ou /agent dans le CLI. Choisissez Squad Coordinator pour la planification et Squad Federation Coordinator pour la fédération. VS Code utilise les fichiers de commande vérifiés /squad et /squad-federation installés par APM dans le dépôt, pas une compétence au nom similaire.'],
  ['L’agent ou la commande manque', 'Vérifiez le dépôt, l’installation et le client actuel. L’App et le CLI peuvent utiliser des dossiers de plug-ins différents. Dans VS Code, vérifiez .github/prompts/squad et les entrées dans GitHub Copilot Chat après installation APM. Une installation terminal ou MCP seule ne prouve pas la disponibilité des commandes. Évitez les ressources de plug-in en double ; copier une commande n’installe rien.'],
  ['Une vérification attendue manque', 'Consignez l’écart avant d’intervenir. Une case cochée sur ce site n’est ni une exécution, ni une autorisation, ni une preuve automatique.'],
  ['Où envoyer init et promote ?', 'Dans la conversation de l’agent App/CLI choisi, avec le contexte complet ; dans VS Code, utilisez la commande complète affichée. Ce ne sont pas des commandes PowerShell autonomes. L’initialisation d’une équipe unique n’a pas de drapeau init autonome dans VS Code. Confirmez chaque résultat avant le message suivant.'],
  ['Préparation inachevée à 09:00', 'Les parties 01 et 02 se font à votre rythme avant l’atelier, avec zéro minute en direct. Rejoignez un environnement partenaire approuvé. La partie 03 comprend une vérification de préparation de 09:00 à 09:10, puis l’initialisation et le travail produit dès 09:10. Consignez l’écart ; n’ajoutez pas de session d’installation en direct et ne raccourcissez pas la discussion finale.'],
] satisfies typeof en.troubleshooting
type SourceLabels<T extends readonly unknown[]> = { [K in keyof T]: string }
const sourceNames: SourceLabels<typeof en.sources> = [
  'HVE Squad v0.16.2 — utilisation', 'Installation du plug-in CLI', 'Installation du plug-in App',
  'Compléments Office — présentation', 'Support des ensembles de spécifications', 'API Word', 'API PowerPoint', 'Power BI Execute Queries',
  'Installation officielle de Copilot CLI', 'Démarrage rapide APM', 'HVE Core — conception d’une expérimentation minimale viable',
  'Commande VS Code /squad — paramètres v0.16.2', 'Commande VS Code /squad-federation — paramètres v0.16.2', 'Manifeste APM — distribution des commandes v0.16.2',
  'APM v0.29.0 — version du CLI obligatoire, pas la dernière version',
]
export const sources = en.sources.map((source, index) => ({ ...source, name: sourceNames[index] }))
