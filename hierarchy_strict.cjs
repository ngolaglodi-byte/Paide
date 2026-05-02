const fs = require("fs");

// ═══ 1. SERVER: helper + update create personnel with proper workflow ═══
let server = fs.readFileSync("/app/server.js", "utf8");

if (!server.includes("getCreatablePosts")) {
  // Add helper function + update approval logic
  const helperMarker = "function hrScopeFilter(user) {";
  const helperCode = `// ═══ HIERARCHY: qui peut créer quoi ═══
function getCreatablePosts(user) {
  // SuperAdmin peut tout créer
  if (user.level === 'superadmin') {
    return {
      ministere: ['Ministre', 'Directeur de Cabinet du Ministre', 'Secrétaire Général', 'Finance', 'Plan', 'Secrétaire'],
      national: ['Coordonateur', 'Coordonateur Adjoint', 'Secrétaire', 'Finance', 'Plan', 'Formation'],
      provincial: ['Coordonateur', 'Coordonateur Adjoint', 'Secrétaire', 'Finance', 'Plan', 'Formation'],
      sous_provincial: ['Coordonateur', 'Coordonateur Adjoint', 'Secrétaire', 'Finance', 'Plan', 'Formation'],
      centre: ['Chef de Centre', 'Chef de Centre Adjoint', 'Secrétaire', 'Chargé des Opérations', 'Intendant', 'Disciplinaire'],
      allowCustom: true
    };
  }
  
  // Ministre: crée son bureau + Coord National
  if (user.post === 'Ministre') {
    return {
      ministere: ['Directeur de Cabinet du Ministre', 'Secrétaire Général', 'Finance', 'Plan', 'Secrétaire'],
      national: ['Coordonateur'],
      allowCustom: true
    };
  }
  
  // Coordonateur National: crée son bureau national + Coord Provincial
  if (user.post === 'Coordonateur' && user.level === 'national') {
    return {
      national: ['Coordonateur Adjoint', 'Finance', 'Plan', 'Formation', 'Secrétaire'],
      provincial: ['Coordonateur'],
      allowCustom: true
    };
  }
  
  // Coordonateur Provincial: crée son bureau + Coord Sous-Provincial de sa province
  if (user.post === 'Coordonateur' && user.level === 'provincial') {
    return {
      provincial: ['Coordonateur Adjoint', 'Finance', 'Plan', 'Formation', 'Secrétaire'],
      sous_provincial: ['Coordonateur'],
      allowCustom: true
    };
  }
  
  // Coordonateur Sous-Provincial: crée son bureau + Chef de Centre
  if (user.post === 'Coordonateur' && user.level === 'sous_provincial') {
    return {
      sous_provincial: ['Coordonateur Adjoint', 'Finance', 'Plan', 'Formation', 'Secrétaire'],
      centre: ['Chef de Centre'],
      allowCustom: true
    };
  }
  
  // Chef de Centre: crée son centre
  if (user.post === 'Chef de Centre') {
    return {
      centre: ['Chef de Centre Adjoint', 'Secrétaire', 'Chargé des Opérations', 'Intendant', 'Disciplinaire'],
      allowCustom: true
    };
  }
  
  // Secrétaire: crée UNIQUEMENT des agents non-responsables (via Autre)
  if (user.post === 'Secrétaire') {
    return {
      [user.level]: [], // Pas de postes officiels, uniquement "Autre"
      allowCustom: true
    };
  }
  
  // Autres postes: pas de création
  return { allowCustom: false };
}

function isResponsable(user) {
  const r = ['Ministre','Coordonateur','Chef de Centre','Super Administrateur'];
  return r.includes(user.post) || user.level === 'superadmin';
}

`;
  server = server.replace(helperMarker, helperCode + helperMarker);
  
  // Update personnel create route to auto-approve for responsables
  // Find and update the submitForApproval call in POST /api/internal/hr/personnel
  server = server.replace(
    "submitForApproval(db, 'personnel', result.personnelId, 'create', req.user, p);\n    \n    const response = { id: result.personnelId, message: 'Agent créé, en attente d\\'approbation' };",
    `// Auto-approve if creator is Responsable (hierarchical rule)
    if (isResponsable(req.user)) {
      // Responsable creates = automatically approved
      // No need to submit for approval
    } else {
      submitForApproval(db, 'personnel', result.personnelId, 'create', req.user, p);
    }
    
    const response = { 
      id: result.personnelId, 
      message: isResponsable(req.user) ? 'Agent créé et approuvé' : 'Agent créé, en attente d\\'approbation' 
    };`
  );
  
  // Also update check: who can create? Change hrIsSecretaire to include responsables
  server = server.replace(
    "app.post('/api/internal/hr/personnel', authenticateToken, (req, res) => {\n  try {\n    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });",
    "app.post('/api/internal/hr/personnel', authenticateToken, (req, res) => {\n  try {\n    if (!hrIsSecretaire(req.user) && !isResponsable(req.user)) return res.status(403).json({ message: 'Non autorisé à créer un agent' });"
  );
  
  // Add endpoint to get creatable posts
  const insertBefore = server.lastIndexOf("app.listen(");
  const newRoute = `
// Endpoint: récupérer les postes que l'utilisateur peut créer
app.get('/api/internal/hr/creatable-posts', authenticateToken, (req, res) => {
  try {
    const posts = getCreatablePosts(req.user);
    res.json(posts);
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});
`;
  server = server.substring(0, insertBefore) + newRoute + "\n" + server.substring(insertBefore);
  
  fs.writeFileSync("/app/server.js", server);
  fs.copyFileSync("/app/server.js", "/app/server.cjs");
  
  try {
    require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
    console.log("Server updated - SYNTAX OK");
  } catch (e) { console.log("SYNTAX ERROR: " + e.stderr.split('\n').slice(0,3).join(' ')); process.exit(1); }
} else {
  console.log("getCreatablePosts already present");
}

// ═══ 2. FRONTEND: Personnel.tsx — use dynamic posts from API ═══
let personnel = fs.readFileSync("/app/src/pages/internal/hr/Personnel.tsx", "utf8");

// Replace POSTS_BY_LEVEL with dynamic fetch
if (personnel.includes("const POSTS_BY_LEVEL")) {
  personnel = personnel.replace(
    /const POSTS_BY_LEVEL: Record<string, string\[\]> = \{[^}]+\};/s,
    "// Posts are now fetched dynamically from /api/internal/hr/creatable-posts"
  );
  
  // Add state for creatable posts
  personnel = personnel.replace(
    "const availablePosts = useMemo(() => POSTS_BY_LEVEL[user?.level || ''] || [], [user]);",
    `const [creatablePosts, setCreatablePosts] = useState<any>({ allowCustom: true });
  
  useEffect(() => {
    fetch('/api/internal/hr/creatable-posts', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : {})
      .then(setCreatablePosts);
  }, []);
  
  // Flatten posts with level labels for the dropdown
  const availablePostsGrouped = useMemo(() => {
    const levelLabels: Record<string,string> = {
      ministere: 'Ministère', national: 'National',
      provincial: 'Provincial', sous_provincial: 'Sous-Provincial', centre: 'Centre'
    };
    const groups: { level: string, label: string, posts: string[] }[] = [];
    ['ministere','national','provincial','sous_provincial','centre'].forEach(lvl => {
      if (creatablePosts[lvl] && creatablePosts[lvl].length > 0) {
        groups.push({ level: lvl, label: levelLabels[lvl], posts: creatablePosts[lvl] });
      }
    });
    return groups;
  }, [creatablePosts]);
  
  const availablePosts: string[] = [];
  availablePostsGrouped.forEach(g => g.posts.forEach(p => availablePosts.push(p)));`
  );

  // Update the dropdown render to use grouped options
  personnel = personnel.replace(
    `<select className="w-full p-2 border rounded" value={form.post||''} onChange={e => handlePostChange(e.target.value)}>
                      <option value="">-- Sélectionner un poste * --</option>
                      {availablePosts.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="_autre_">✏️ Autre (saisir manuellement)</option>
                    </select>`,
    `<select className="w-full p-2 border rounded" value={form.post||''} onChange={e => handlePostChange(e.target.value)}>
                      <option value="">-- Sélectionner un poste * --</option>
                      {availablePostsGrouped.map(g => (
                        <optgroup key={g.level} label={g.label}>
                          {g.posts.map(p => <option key={g.level+'_'+p} value={p+'__'+g.level}>{p}</option>)}
                        </optgroup>
                      ))}
                      {creatablePosts.allowCustom && <option value="_autre_">✏️ Autre (saisir manuellement)</option>}
                    </select>`
  );
  
  // Update handlePostChange to parse the level
  personnel = personnel.replace(
    `const handlePostChange = (value: string) => {
    if (value === '_autre_') {
      setForm({ ...form, post_type: 'custom', post: '', create_access: false });
    } else {
      setForm({ ...form, post_type: 'select', post: value });
    }
  };`,
    `const handlePostChange = (value: string) => {
    if (value === '_autre_') {
      setForm({ ...form, post_type: 'custom', post: '', create_access: false });
    } else if (value && value.includes('__')) {
      const [post, level] = value.split('__');
      setForm({ ...form, post_type: 'select', post, target_level: level });
    } else {
      setForm({ ...form, post_type: 'select', post: value });
    }
  };`
  );

  fs.writeFileSync("/app/src/pages/internal/hr/Personnel.tsx", personnel);
  console.log("Personnel.tsx updated with dynamic posts");
}

// ═══ 3. Add Personnel menu item to all responsables ═══
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Ministre
if (!layout.match(/'Ministre':[\s\S]*?\/internal\/hr\/personnel/)) {
  layout = layout.replace(
    /'Ministre': \[\s*{ path: '\/internal\/dashboard', label: 'Dashboard', icon: LayoutDashboard },/,
    `'Ministre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},`
  );
  console.log("Personnel added to Ministre menu");
}

// Coordonateur National
if (!layout.match(/'Coordinateur National':[\s\S]*?hr\/personnel/)) {
  layout = layout.replace(
    /'Coordinateur National': \[\s*{ path: '\/internal\/dashboard', label: 'Dashboard', icon: LayoutDashboard },/,
    `'Coordinateur National': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion du Bureau', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},`
  );
  console.log("Personnel added to Coord National menu");
}

// Coordonateur Provincial
if (!layout.match(/'Coordinateur Provincial':[\s\S]*?hr\/personnel/)) {
  layout = layout.replace(
    /'Coordinateur Provincial': \[\s*{ path: '\/internal\/dashboard', label: 'Dashboard', icon: LayoutDashboard },/,
    `'Coordinateur Provincial': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion du Bureau', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},`
  );
  console.log("Personnel added to Coord Provincial menu");
}

// Coordonateur Sous-Provincial
if (!layout.match(/'Coordinateur Sous-Provincial':[\s\S]*?hr\/personnel/)) {
  layout = layout.replace(
    /'Coordinateur Sous-Provincial': \[\s*{ path: '\/internal\/dashboard', label: 'Dashboard', icon: LayoutDashboard },/,
    `'Coordinateur Sous-Provincial': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion du Bureau', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},`
  );
  console.log("Personnel added to Coord Sous-Provincial menu");
}

// Chef de Centre
if (!layout.match(/'Chef de Centre':[\s\S]*?hr\/personnel/)) {
  layout = layout.replace(
    /'Chef de Centre': \[\s*{ path: '\/internal\/dashboard', label: 'Dashboard', icon: LayoutDashboard },/,
    `'Chef de Centre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion du Centre', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},`
  );
  console.log("Personnel added to Chef de Centre menu");
}

fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);

console.log("\nHierarchy strict DONE");
