const fs = require("fs");
let code = fs.readFileSync("/app/src/pages/SuperAdmin.tsx", "utf8");

// Add import for cache invalidation
if (!code.includes("invalidateContentCache")) {
  code = code.replace(
    "import { useAuth } from '@/hooks/useAuth';",
    "import { useAuth } from '@/hooks/useAuth';\nimport { invalidateContentCache } from '@/hooks/usePageContent';"
  );
  
  // After each save, invalidate cache
  code = code.replace(
    "toast.success('Image uploadée et sauvegardée');",
    "toast.success('Image uploadée et sauvegardée');\n      invalidateContentCache();"
  );
  
  code = code.replace(
    "toast.success('Contenu sauvegardé avec succès');",
    "toast.success('Contenu sauvegardé avec succès');\n      invalidateContentCache();"
  );
  
  code = code.replace(
    "toast.success('Contenu créé avec succès');",
    "toast.success('Contenu créé avec succès');\n      invalidateContentCache();"
  );
  
  console.log("SuperAdmin cache invalidation added");
} else {
  console.log("Already has invalidateContentCache");
}

fs.writeFileSync("/app/src/pages/SuperAdmin.tsx", code);
