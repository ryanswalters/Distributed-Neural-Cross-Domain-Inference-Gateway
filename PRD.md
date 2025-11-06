# Planning Guide

A self-evolving middleware hub that combines Model Context Protocol (MCP) servers, API tools, and AI-powered automation with adaptive cross-domain workflow orchestration. The system can generate, execute, and self-correct tools on-demand while chaining web APIs, local file operations, and AI calls into automated workflows with consistent context preservation.

**Experience Qualities**:
1. **Adaptive** - The system learns, generates, and self-corrects based on user needs and execution feedback
2. **Powerful** - Cross-domain workflows link disparate systems (web APIs, files, AI) with persistent context
3. **Transparent** - Every execution, transformation, and self-correction is logged and inspectable

**Complexity Level**: Complex Application (advanced functionality with runtime execution, workflow orchestration, and self-correcting AI)
  - Manages dynamic tool registration and execution, cross-domain workflow orchestration, runtime code evaluation, AI-driven self-correction, and persistent context across multi-step operations

## Essential Features

### GitHub OAuth Authentication
- **Functionality**: Secure authentication using GitHub OAuth through the Spark runtime, displaying user profile with avatar and username, showing owner badge for app creators, and tracking tool creators
- **Purpose**: Provides user identity and access control to the hub, enabling multi-user collaboration and tool ownership tracking
- **Trigger**: Automatic on app load
- **Progression**: App loads → Auth provider initializes → Calls spark.user() → User data retrieved → If authenticated, show app content with user profile in header → User can click profile to view account details → If not authenticated, show auth gate screen → If user requires owner access for specific features, show owner-only gate
- **Success criteria**: User authenticated automatically via GitHub OAuth; profile displays in header with avatar and username; owner users see crown badge; auth guards prevent unauthorized access; loading states displayed during authentication; creator attribution shown on tool cards

### Adaptive Middleware Runtime
- **Functionality**: Core execution engine that registers tools, executes generated code in isolated contexts, maintains execution logs, tracks session state, and provides runtime introspection capabilities
- **Purpose**: Transforms the hub from static tool management into a live execution environment where AI-generated tools actually run with full observability
- **Trigger**: Automatically registers all tools on app load; executes when user runs tool or workflow
- **Progression**: App loads → All tools auto-registered to runtime → User triggers execution → Runtime creates isolated context with session ID → Code executes with full logging → Results captured → Execution log available for inspection → Context preserved for cross-domain operations
- **Success criteria**: All tools successfully registered; generated code executes without breaking app; execution contexts properly isolated; session logs include timestamps, stages, and data; errors caught and logged without crashing; context available for subsequent operations

### Tool Executor & Self-Correction
- **Functionality**: Interactive dialog for executing AI-generated tools with custom inputs, viewing detailed execution logs, and using AI to refactor/improve the tool's implementation based on natural language directives (e.g., "add persistence and security", "improve error handling")
- **Purpose**: Enables users to test tools, inspect their behavior, and iteratively improve them through AI-driven self-correction without manual code editing
- **Trigger**: Click "Execute" button on AI-generated tool card (green play icon)
- **Progression**: Click Execute → Dialog opens showing tool details → Enter test inputs as JSON → Click "Execute Tool" → Runtime executes code → Results displayed with success/error indication → Switch to "Execution Logs" tab to see detailed step-by-step execution → Switch to "Self-Correct" tab → Enter refactoring directive → Click "Self-Correct Tool" → AI analyzes current code → AI generates improved version → Tool automatically updated with new code and description → Success notification
- **Success criteria**: Execution handles both success and failure gracefully; logs show complete execution trace; self-correction generates valid, improved code; original functionality preserved after refactoring; security and persistence improvements visible; refactoring history tracked in tool description

### Cross-Domain Workflow Builder
- **Functionality**: Visual workflow builder for chaining web API calls, GitHub file operations, AI calls, data transformations, and conditional logic into multi-step automated workflows with variable interpolation between steps
- **Purpose**: Enables users to create complex automation that spans multiple domains (web, files, AI) in a single workflow, testing the system's ability to maintain context and orchestrate cross-domain operations
- **Trigger**: Click "Build Workflow" button in main toolbar
- **Progression**: Click button → Workflow builder dialog opens → Enter workflow name and description → Add steps (Web API, File Op, AI Call, Transform, Conditional) → Configure each step with URLs, GitHub repos, AI prompts, or transform functions → Use {{step.stepId.field}} syntax to reference previous step outputs → Steps chained with visual arrows → Click "Test Run" to execute without saving → View results → Click "Save Workflow" → Workflow registered to runtime and saved to storage
- **Success criteria**: Workflow builder supports all step types; variable interpolation works correctly; GitHub file fetching retrieves actual files; AI calls execute with context from previous steps; transforms modify data correctly; test runs execute full workflow; saved workflows persist and can be re-run; execution maintains consistent context across all steps

### Workflow Dashboard & Execution
- **Functionality**: View all saved workflows with visual step indicators, execute workflows with one click, view real-time execution progress, inspect detailed results, and delete workflows
- **Purpose**: Provides centralized management and execution interface for all workflows, demonstrating whether the system can actually orchestrate complex multi-domain operations
- **Trigger**: Navigate to "Workflows" tab in main navigation
- **Progression**: Click Workflows tab → See list of all saved workflows → Each workflow shows name, description, and visual step chain with colored type indicators → Click "Run" button → Workflow executes in runtime → Real-time progress indicator → Results displayed in embedded card → View step outputs and final result → Success/failure clearly indicated → Click "Delete" to remove workflow
- **Success criteria**: All saved workflows listed; step chains visualized with type colors; execution runs all steps in sequence; results show complete workflow output including individual step results; errors display helpful messages; real-time execution state visible; workflows deletable

### Runtime Tool Registration & Execution
- **Functionality**: Automatic registration of all tools into the middleware runtime on app load, enabling direct execution of AI-generated code through the runtime engine with isolated execution contexts
- **Purpose**: Bridges the gap between tool storage and tool execution, making the system actually functional rather than just cataloging
- **Trigger**: App initialization (automatic); tool creation/update (automatic); workflow execution (programmatic)
- **Progression**: App loads → All tools read from storage → Each tool registered with runtime.registerTool() → Runtime maps tool ID to executable code → When execution requested → Runtime creates isolated context → Code runs with access to params, context, and spark API → Results captured → Context cleared or preserved for workflow
- **Success criteria**: All tools registered without errors; AI-generated code executes successfully; non-AI tools with endpoints callable; execution contexts properly isolated; multiple tools executable simultaneously; runtime state inspectable; tool updates re-register automatically

### AI Tool Generation
- **Functionality**: Use AI to automatically generate new tools on-demand based on natural language descriptions, including code implementation, endpoint configuration, parameter definitions, and categorization
- **Purpose**: Enables users to rapidly create custom tools for missing capabilities without manual coding, transforming the hub into a self-extending middleware layer
- **Trigger**: Click "AI Generate" button or click "Generate Tool" on suggested needs
- **Progression**: Click AI Generate → Describe needed capability in natural language → AI generates complete tool specification with working code → Preview generated tool details (name, description, category, endpoint, parameters, implementation code) → Click Deploy Tool → Tool instantly added to collection with AI-generated badge → Success confirmation
- **Success criteria**: AI successfully generates valid tool specs with working code; generated tools are properly categorized and configured; code is readable and includes error handling; tools integrate seamlessly with existing collection; generation completes within 10-15 seconds

### AI Need Detection
- **Functionality**: Intelligent system that analyzes the existing tool collection and suggests missing capabilities that would complement the user's toolkit, with confidence scores and one-click generation
- **Purpose**: Proactively identifies gaps in the user's tool ecosystem and offers automated solutions, making the hub adaptive and self-aware
- **Trigger**: Automatically displays on "My Tools" tab when viewing tool collection
- **Progression**: System analyzes tools → Displays 2-4 high-value suggestions with confidence scores → User reads capability description → Click "Generate Tool" → Opens AI generator pre-filled with suggestion → Follow AI generation flow → New tool deployed
- **Success criteria**: Suggestions are contextually relevant to existing tools; confidence scores accurately reflect usefulness; suggestions can be dismissed individually; suggestions persist until acted upon or dismissed; clear visual distinction from regular tools

### AI-Generated Tool Management
- **Functionality**: View, manage, and inspect AI-generated tools with access to original prompts, generated code, and special metadata
- **Purpose**: Provides transparency into AI-generated tools and allows users to review, copy, and modify generated implementations
- **Trigger**: Click on AI-generated tool card (identified by AI badge)
- **Progression**: Click AI tool → Special detail view opens → View overview tab with all metadata → Switch to "Generated Code" tab to see implementation → Copy code to clipboard → Switch to "Generation Prompt" tab to see original request → Review and verify tool → Close dialog
- **Success criteria**: All AI tools have visible AI-generated badge; detail view shows complete code with syntax formatting; copy-to-clipboard works reliably; original generation prompt is stored and displayed; clear warnings about reviewing AI code before production use

### MCP Server Library
- **Functionality**: Browse a comprehensive catalog of 35+ popular MCP servers (official, community, commercial) including text editors, filesystem tools, Git management, memory/knowledge graphs, database connectors (PostgreSQL, MongoDB, Redis, SQLite), cloud providers (AWS, Cloudflare), productivity tools (Slack, Notion, Jira, Linear, Google Calendar/Drive), payment processors (Stripe), communication services (Twilio, SendGrid), development tools (Docker, Kubernetes, Puppeteer), and specialized APIs (Weather, GitHub, OpenAPI converters) with filtering, search, tag-based discovery, version information, troubleshooting tips, and quick-add capability
- **Purpose**: Enable users to discover and add well-known MCP servers with clear documentation, setup instructions, and troubleshooting guidance for a wide variety of use cases from local file operations to cloud integrations
- **Trigger**: Click "MCP Library" tab in main navigation
- **Progression**: Click tab → Browse server cards with category badges (Official/Community/Commercial), difficulty levels, version info, auth indicators → Filter by category → Search by name/features/tags → Click tag to filter → Click server card → View comprehensive details with version, last updated date, install commands (with copy button), setup instructions, feature list with checkmarks, troubleshooting accordion with common issues, documentation/GitHub links → Click "Add to My Tools" → Server added to tools collection with auto-configured endpoint → Success toast
- **Success criteria**: All 35+ servers browsable with complete metadata (version, last updated, difficulty, tags, category badges); filterable by category (Official/Community/Commercial) with counts shown; tag-based filtering with active tag display; searchable across name/description/features/tags; troubleshooting tips accessible via collapsible accordion; install commands copyable with toast feedback; clicking "Add to My Tools" creates properly configured tool entry with appropriate category; external documentation links verified and working; auth/local-only indicators visible

### Tool Library Management
- **Functionality**: Display a browsable grid/list of available MCP tools with details (name, description, category, status)
- **Purpose**: Provides quick visual overview of all available tools and their current state
- **Trigger**: On app load, displays all tools; filters update view based on category/search
- **Progression**: App loads → Tool cards render in grid → User scans available tools → Hover reveals additional details
- **Success criteria**: All tools visible, filterable by category, searchable by name/description

### Add New Tool
- **Functionality**: Form to create new tool entries with name, description, category, endpoint configuration, and parameters
- **Purpose**: Enables users to expand their toolkit without external configuration files
- **Trigger**: Click "Add Tool" button opens dialog/form
- **Progression**: Click Add Tool → Dialog opens → Fill form fields (name, description, category, endpoint) → Save → Tool appears in library → Success toast
- **Success criteria**: New tool persists, appears immediately in library, form validates required fields

### Tool Detail & Configuration
- **Functionality**: View comprehensive tool information and configure connection settings, API keys, or parameters
- **Purpose**: Allows customization and setup of individual tools before use
- **Trigger**: Click on a tool card
- **Progression**: Click tool card → Detail panel/modal opens → View full description and parameters → Edit configuration → Save → Changes persist
- **Success criteria**: Changes save successfully, configuration persists between sessions

### MCP Server Connection
- **Functionality**: Connect to remote or local MCP servers, discover available tools, view server capabilities, and call tools with arguments
- **Purpose**: Enable users to connect to existing MCP servers (like Cloudflare's) without manual configuration
- **Trigger**: Click on tool card → Navigate to "MCP" tab
- **Progression**: Enter MCP endpoint URL → Click Connect → View server info and capabilities → Browse available tools list → Select tool → Enter JSON arguments → Click Call Tool → View tool result
- **Success criteria**: Successfully connects to MCP servers, lists available tools with descriptions, executes tool calls, displays results

### Endpoint Testing
- **Functionality**: Test API endpoints directly from the tool detail view with configurable HTTP methods, headers, and request bodies
- **Purpose**: Verify endpoint connectivity and API responses without leaving the application
- **Trigger**: Click on tool card → Navigate to "Test Endpoint" tab
- **Progression**: Select HTTP method → Enter endpoint URL → Add API key if needed → Add request body for POST/PUT → Click Test → View response with status, data, headers, and timing
- **Success criteria**: Successfully sends requests to local and remote endpoints, displays formatted responses, shows helpful error messages

### GitHub File Fetcher
- **Functionality**: Browse and fetch files from GitHub repositories using the GitHub API
- **Purpose**: Enables AI tools to access code files, documentation, and data from GitHub repositories
- **Trigger**: Click on tool card → Navigate to "GitHub" tab
- **Progression**: Enter GitHub repo URL → Optional: specify file path and token → Click Fetch → Browse directory contents or view file → Copy file content → Use with AI
- **Success criteria**: Successfully fetches public and private repos (with token), displays file tree, shows file content with copy functionality

### Category Filtering
- **Functionality**: Filter tools by predefined categories (Code, Data, Web, Productivity, etc.)
- **Purpose**: Reduces cognitive load when browsing large tool collections
- **Trigger**: Click category filter or tag
- **Progression**: Click category badge/filter → Grid updates to show only matching tools → Clear filter returns to all tools
- **Success criteria**: Instant filtering, clear visual indication of active filters

### Search Functionality
- **Functionality**: Real-time search across tool names and descriptions
- **Purpose**: Quick access to specific tools in large collections
- **Trigger**: Type in search input
- **Progression**: Focus search → Type query → Results filter in real-time → Clear search shows all
- **Success criteria**: Instant results, searches both name and description fields

### How It Works Guide
- **Functionality**: Educational section explaining MCP concepts, popular servers, and how to use the hub
- **Purpose**: Onboard new users and clarify the purpose of MCP tools
- **Trigger**: Click "How It Works" tab in main navigation
- **Progression**: Click tab → View guide sections → Learn about MCP protocol → Understand tool categories → Read usage steps → See popular MCP server examples → Return to tools view
- **Success criteria**: Clear explanations with visual components, smooth animations, comprehensive coverage of MCP concepts, links to MCP Library

## Edge Case Handling
- **Empty State**: First-time users see welcoming empty state with "Add your first tool" prompt and suggestion to browse MCP Library or use AI generator
- **No Search Results**: Friendly message suggesting "Try different keywords" with option to clear filters (applies to both tool search and library search)
- **Invalid Tool Data**: Form validation prevents submission with missing required fields, shows helpful error messages
- **Duplicate Tools**: Warning if adding tool with identical name to existing entry
- **Long Descriptions**: Truncate in card view with "read more" expansion in detail view
- **Network Errors**: Clear error messages when endpoint tests fail with timeout or connection issues
- **GitHub Rate Limits**: Inform users about GitHub API rate limits and suggest using personal access token
- **Invalid JSON**: Validate JSON input for request bodies and parameters with helpful error messages
- **CORS Issues**: Inform users when cross-origin requests fail and suggest using local proxy or backend
- **Large Files**: Handle large GitHub files gracefully with loading states and file size warnings
- **No MCP Library Results**: Show "No servers match your filters" when library filters return empty with option to clear all filters
- **Broken Documentation Links**: All documentation URLs verified to point to valid, live resources (GitHub repos, official docs)
- **Version Compatibility**: Version numbers displayed to help users identify current vs outdated servers
- **Tag Filtering**: Active tag filters clearly displayed with ability to remove individual tags or clear all
- **Install Command Errors**: Troubleshooting accordion provides solutions for common installation issues (Node version, permissions, path problems)
- **Copy to Clipboard**: Visual feedback (toast notification) confirms successful copy of install commands or endpoints
- **AI Generation Failures**: Clear error messages when AI generation fails with option to retry; timeout handling for long-running AI requests
- **Invalid AI Responses**: Graceful handling when AI returns malformed JSON or incomplete tool specs
- **AI Generation Timeout**: Show error after 30 seconds if AI doesn't respond; suggest trying simpler description
- **Empty AI Prompt**: Prevent generation with empty description; provide example prompts for inspiration
- **Code Review Warning**: Display prominent notice that AI-generated code should be reviewed before production use
- **No Suggestions Available**: Hide need detector section when no relevant suggestions exist
- **Dismissed Suggestions**: Persist dismissed suggestions so they don't reappear on page reload
- **Workflow Execution Failures**: Display detailed error messages when workflow steps fail; show which step caused failure; preserve partial results
- **Variable Interpolation Errors**: Catch and report missing or invalid variable references in workflow steps
- **Runtime Execution Errors**: Safely catch errors in generated code; prevent app crashes; display stack traces for debugging
- **Invalid JSON Inputs**: Validate JSON test inputs before execution; show helpful parsing errors
- **GitHub API Rate Limits**: Handle GitHub rate limiting gracefully in file operation steps
- **Step Dependencies**: Validate that dependent steps exist and have completed before execution
- **Empty Workflows**: Prevent saving workflows with no steps; require at least name and one step
- **Concurrent Executions**: Handle multiple simultaneous tool/workflow executions without context collision
- **Self-Correction Failures**: Graceful fallback when AI cannot improve code; preserve original version
- **Code Execution Timeout**: Implement timeout for long-running generated code to prevent hanging
- **Malicious Code Prevention**: Basic sandboxing of generated code to prevent destructive operations

## Design Direction
The design should feel cutting-edge and powerful like a developer command center—clean, technical, with a cyberpunk/terminal aesthetic suggesting real computational power. The interface should feel alive and reactive, with a modern SaaS application aesthetic enhanced by execution visualizations, real-time status updates, and workflow orchestration views.

## Color Selection
Custom palette - A tech-forward scheme with deep blues suggesting intelligence and reliability, accented with vibrant cyan for interactive elements and status indicators.

- **Primary Color**: Deep Blue `oklch(0.35 0.15 250)` - Communicates intelligence, trust, and technical sophistication for the brand
- **Secondary Colors**: Slate gray `oklch(0.55 0.02 250)` for supporting UI elements and muted backgrounds
- **Accent Color**: Vibrant Cyan `oklch(0.75 0.15 200)` - High-energy highlight for CTAs, active states, and "enabled" tool status
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.98 0 0)`): Dark text `oklch(0.2 0.02 250)` - Ratio 12.3:1 ✓
  - Card (Light Gray `oklch(0.96 0.005 250)`): Dark text `oklch(0.2 0.02 250)` - Ratio 11.8:1 ✓
  - Primary (Deep Blue `oklch(0.35 0.15 250)`): White text `oklch(0.98 0 0)` - Ratio 8.2:1 ✓
  - Secondary (Slate `oklch(0.55 0.02 250)`): White text `oklch(0.98 0 0)` - Ratio 5.1:1 ✓
  - Accent (Cyan `oklch(0.75 0.15 200)`): Dark text `oklch(0.2 0.02 250)` - Ratio 8.5:1 ✓
  - Muted (Light Slate `oklch(0.92 0.01 250)`): Medium text `oklch(0.45 0.02 250)` - Ratio 6.2:1 ✓

## Font Selection
Modern, geometric sans-serif typefaces that convey technical precision and contemporary design—Inter for its excellent readability at all sizes and professional developer-tool aesthetic.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Inter SemiBold/32px/tight letter spacing (-0.02em)
  - H2 (Section Headers): Inter SemiBold/24px/tight letter spacing (-0.01em)
  - H3 (Tool Names): Inter Medium/18px/normal spacing
  - Body (Descriptions): Inter Regular/15px/relaxed line height (1.6)
  - Small (Metadata): Inter Regular/13px/muted color

## Animations
Purposeful animations that communicate system state and execution flow—real-time execution indicators, workflow step progression, self-correction visual feedback, and success/failure state transitions.

- **Purposeful Meaning**: Smooth card elevations on hover communicate interactivity; workflow step execution shows real-time progress; self-correction displays transformation animation; execution results fade in with success/error colors
- **Hierarchy of Movement**: Tool cards get gentle hover lift (scale 1.02), workflow steps pulse during execution, dialog entries slide up with fade, filter changes animate grid with stagger, execution logs scroll with smooth animation

## Component Selection
- **Components**: 
  - `Dialog` for Add/Edit tool forms, tool details with tabbed interface, and MCP server details from library
  - `Card` for tool display and MCP server cards with custom hover states
  - `Input` for search with icon (tool search and library search)
  - `Badge` for categories, status indicators, server types (Official/Community/Commercial), difficulty levels, tags, and version numbers
  - `Button` with variants (primary for Add Tool, ghost for filters, icon buttons for copy actions)
  - `Form` with `react-hook-form` for tool creation
  - `Tabs` for tool detail sections (Details, MCP, Test, GitHub) and main navigation (My Tools, MCP Library, How It Works)
  - `Scroll Area` for long tool lists, file browsers, server library, and scrollable dialog content
  - `Tooltip` for action icons and truncated text
  - `Select` for HTTP method and category selection
  - `Textarea` for JSON input and file content display
  - `Accordion` for collapsible troubleshooting sections in server details
  - `Separator` for visual section breaks in server detail dialogs
  - `Avatar` for user profile pictures and tool creator attribution
  - `DropdownMenu` for user profile menu with account details
  - `Skeleton` for loading states during authentication
  
- **Customizations**: 
  - Custom tool card component with status indicator and category badges
  - Custom MCP server card with category badges, feature lists, auth indicators, difficulty badges, version display
  - Grid layout with responsive columns (1 on mobile, 2 on tablet, 3-4 on desktop)
  - Search bar with integrated filter chips and active tag display
  - MCP server connector with tool discovery and execution
  - Endpoint tester with method selector, headers, and response viewer
  - GitHub file browser with directory navigation and file preview
  - MCP Library browser with category filters, tag filtering, server counts per category, and enhanced server details modal with version info, install commands, troubleshooting accordion
  - Copy-to-clipboard functionality for install commands and endpoints with toast feedback
  
- **States**: 
  - Tool cards: Default, Hover (elevated shadow + scale), Active (when selected)
  - Status badges: Enabled (cyan), Disabled (gray), Configuration Needed (amber)
  - Category badges: Official (blue), Community (green), Commercial (purple)
  - Difficulty badges: Beginner (green), Intermediate (yellow), Advanced (red)
  - Buttons: Default, Hover (brightness increase), Active (scale 0.98), Disabled (opacity 50%)
  - Test results: Success (green checkmark), Error (red X), Loading (spinner)
  - Tag badges: Default (secondary), Active/Selected (with darker background)
  - Accordion: Collapsed (default), Expanded (shows troubleshooting tips)
  
- **Icon Selection**: 
  - `Plus` for Add Tool button and adding servers from library
  - `MagnifyingGlass` for search (tools and library)
  - `FunnelSimple` for filters
  - `Gear` for configuration/settings
  - `CheckCircle` for enabled tools, successful responses, and feature checkmarks
  - `Circle` for disabled tools
  - `Warning` for needs-config status and troubleshooting sections
  - `Tag` for categories and tags
  - `Pencil` for edit actions
  - `Trash` for delete actions
  - `Plug` for MCP server connection
  - `Flask` for endpoint testing
  - `GithubLogo` for GitHub integration
  - `PlayCircle` for test/run actions
  - `File` and `Folder` for file browser
  - `CircleNotch` for loading states
  - `Lightbulb` for How It Works guide tab
  - `SquaresFour` for My Tools tab
  - `Books` for MCP Library tab
  - `Brain`, `ArrowsClockwise`, `Lightning`, `Database`, `Terminal`, `GlobeHemisphereWest` for guide illustrations
  - `NumberCircleOne` through `NumberCircleFour` for step indicators
  - `Star` for official servers and favorites
  - `Users` for community servers
  - `Buildings` for commercial servers
  - `LockKey` for auth required indicator and authentication screens
  - `Desktop` for local-only indicator
  - `Book` for documentation links
  - `Copy` for copy-to-clipboard actions on install commands and endpoints
  - `Calendar` for last updated dates
  - `ChartBar` for difficulty level indicators and analytics tab
  - `Sparkle` for AI generation features and AI-generated badges
  - `Brain` for AI need detection
  - `Rocket` for deploying generated tools
  - `Code` for viewing generated code
  - `Download` and `Upload` for export/import
  - `Lightning` for workflows and transform steps
  - `Play` for execution buttons and workflow runs
  - `ArrowsClockwise` for self-correction and refactoring
  - `CircleNotch` for loading/executing states
  - `ChartLine` for execution analytics and logs
  - `User` for user profile and account information
  - `SignOut` for sign out actions (informational only)
  - `Crown` for owner/admin badges
  
- **Spacing**: 
  - Container padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
  - Card gap: `gap-6` (24px) between cards
  - Internal card padding: `p-5` (20px)
  - Section margins: `mb-8` (32px) between major sections
  
- **Mobile**: 
  - Single column grid on <768px
  - Search bar full width with filters below
  - Dialog forms fill screen on mobile with scrollable content
  - Tabs stack vertically on very small screens
  - Sticky search header on scroll
