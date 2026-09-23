# Graph Report - .  (2026-09-23)

## Corpus Check
- 46 files · ~447,401 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 206 nodes · 287 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 1% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.87)
- Token cost: 114,247 input · 13,944 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Product Principles and Scope|Product Principles and Scope]]
- [[_COMMUNITY_Profile and Offer Data Access|Profile and Offer Data Access]]
- [[_COMMUNITY_Server Actions (Requests and Chat)|Server Actions (Requests and Chat)]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Brand, Design and Accessibility|Brand, Design and Accessibility]]
- [[_COMMUNITY_UI Components and Routes|UI Components and Routes]]
- [[_COMMUNITY_Architecture and Security Rules|Architecture and Security Rules]]
- [[_COMMUNITY_Supabase Client and Generated Types|Supabase Client and Generated Types]]
- [[_COMMUNITY_Build and Lint Tooling|Build and Lint Tooling]]
- [[_COMMUNITY_Root Layout and Fonts|Root Layout and Fonts]]
- [[_COMMUNITY_Session Proxy|Session Proxy]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 18 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 10 edges
4. `Row Level Security as the Real Boundary` - 9 edges
5. `requireSession()` - 7 edges
6. `requireProfile()` - 6 edges
7. `Always-Visible Discover Location Filter` - 6 edges
8. `Feed()` - 5 edges
9. `Senior Users (65+)` - 5 edges
10. `Meine Karte (One Offer Per Person)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `The Database Protects People, Not the Interface` --semantically_similar_to--> `Row Level Security as the Real Boundary`  [INFERRED] [semantically similar]
  PRODUCT.md → README.md
- `Next.js 16 Breaking Changes` --semantically_similar_to--> `Next.js Agent Rules Block`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `Open: Radius Search Not Yet Functional` --semantically_similar_to--> `Postal-Code Centroid, Never a Street Address`  [INFERRED] [semantically similar]
  PRODUCT.md → README.md
- `Realtime Chat and setAuth on Token Refresh` --implements--> `Connections (Request, Accept, Chat)`  [INFERRED]
  README.md → PRODUCT.md
- `Open: Radius Search Not Yet Functional` --references--> `discover(search_plz, radius_km) Database Function`  [AMBIGUOUS]
  PRODUCT.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Distance Search Without a Geocoding Service** — readme_discover_function, readme_cube_earthdistance, readme_postal_codes_table, readme_postal_code_centroid, product_discover_filter [EXTRACTED 1.00]
- **Privacy Posture: Postal-Code Precision Enforced in the Database** — product_database_protects_people, product_postal_code_location, readme_postal_code_centroid, readme_row_level_security, readme_never_service_role_key, readme_discover_feed_view [INFERRED 0.95]
- **From Browsing a Card to Agreeing a Meeting** — product_meine_karte, product_discover_filter, product_connections, readme_realtime_chat_setauth, product_meeting_happens_outside_app [INFERRED 0.95]

## Communities (17 total, 4 thin omitted)

### Community 0 - "Product Principles and Scope"
Cohesion: 0.10
Nodes (29): Age as a Chip, Stored as birth_year, Post-and-Browse Classifieds Mechanic, Connections (Request, Accept, Chat), The Database Protects People, Not the Interface, Always-Visible Discover Location Filter, The Meeting Happens Outside the App, Meine Karte (One Offer Per Person), Not a Marketplace (+21 more)

### Community 1 - "Profile and Offer Data Access"
Cohesion: 0.12
Nodes (20): DiscoverCard, getCurrentProfile(), getMyOffer(), getMyOfferStats(), lookupPostalCode(), NearbyCard, Offer, OfferStats (+12 more)

### Community 2 - "Server Actions (Requests and Chat)"
Cohesion: 0.14
Nodes (21): answerConnectionRequest(), markConversationRead(), requireSession(), sendConnectionRequest(), sendMessage(), withdrawConnectionRequest(), ActionResult, completeOnboarding() (+13 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, next, react, react-dom, server-only, @supabase/ssr, @supabase/supabase-js, name (+12 more)

### Community 4 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Brand, Design and Accessibility"
Cohesion: 0.12
Nodes (18): Accessibility and Inclusion Commitments, Linde Brand System (Type and Palette), Claude Design Canvas UI Design, German Throughout, Formal Sie, Linde (Product), No Botanical Imagery, Placeholders, Not Invented Evidence, Weekly Distinct Offer Views (+10 more)

### Community 6 - "UI Components and Routes"
Cohesion: 0.19
Nodes (8): Avatar(), ITEMS, NavKey, SiteNav(), getDiscoverCard(), RequestForm(), Params, Request()

### Community 7 - "Architecture and Security Rules"
Cohesion: 0.24
Nodes (12): Bundled Next.js Docs as Authority, Next.js Agent Rules Block, CLAUDE.md Agent Entrypoint, Anon/Publishable Key Is Not a Credential, cacheComponents and Partial Prerendering, Never Use the service_role Key, Next.js 16 Breaking Changes, proxy.ts Replaces middleware.ts (+4 more)

### Community 8 - "Supabase Client and Generated Types"
Cohesion: 0.18
Nodes (9): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, TablesInsert (+1 more)

### Community 9 - "Build and Lint Tooling"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 10 - "Root Layout and Fonts"
Cohesion: 0.40
Nodes (3): bitter, karla, metadata

## Ambiguous Edges - Review These
- `Weekly Distinct Offer Views` → `No Botanical Imagery`  [AMBIGUOUS]
  PRODUCT.md · relation: conceptually_related_to
- `Open: Radius Search Not Yet Functional` → `discover(search_plz, radius_km) Database Function`  [AMBIGUOUS]
  PRODUCT.md · relation: references
- `Open: Radius Search Not Yet Functional` → `postal_codes Table (GeoNames, CC BY 4.0)`  [AMBIGUOUS]
  PRODUCT.md · relation: references

## Knowledge Gaps
- **77 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Weekly Distinct Offer Views` and `No Botanical Imagery`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Open: Radius Search Not Yet Functional` and `discover(search_plz, radius_km) Database Function`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Open: Radius Search Not Yet Functional` and `postal_codes Table (GeoNames, CC BY 4.0)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `createClient()` connect `Server Actions (Requests and Chat)` to `Profile and Offer Data Access`, `UI Components and Routes`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Linde (Product)` connect `Brand, Design and Accessibility` to `Product Principles and Scope`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product Principles and Scope` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._