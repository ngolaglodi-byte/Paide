const fs = require("fs");
let code = fs.readFileSync("/app/src/hooks/usePageContent.ts", "utf8");

// Replace the static cache with a version that can be invalidated
code = code.replace(
  "const contentCache = new Map<string, Record<string, ContentItem>>();",
  `const contentCache = new Map<string, Record<string, ContentItem>>();

// Allow cache invalidation from outside (e.g. after SuperAdmin edits)
export function invalidateContentCache(page?: string) {
  if (page) contentCache.delete(page);
  else contentCache.clear();
}`
);

// Also add cache-busting: always refetch, use cache only for initial render
code = code.replace(
  "    // Already cached — skip fetch\n    if (contentCache.has(page)) {\n      setContentMap(contentCache.get(page)!);\n      setIsLoaded(true);\n      return;\n    }",
  "    // Use cache for instant render, but always refetch for freshness\n    if (contentCache.has(page)) {\n      setContentMap(contentCache.get(page)!);\n      setIsLoaded(true);\n    }"
);

fs.writeFileSync("/app/src/hooks/usePageContent.ts", code);
console.log("Cache fix applied");
