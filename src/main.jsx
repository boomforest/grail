4:31:19 PM: Waiting for other deploys from your team to complete. Check the queue: https://app.netlify.com/teams/boomforest/builds
4:33:11 PM: build-image version: 09e1898b62f1787f28f3d49630f96c3fc8719129 (noble)
4:33:11 PM: buildbot version: 09e1898b62f1787f28f3d49630f96c3fc8719129
4:33:11 PM: Fetching cached dependencies
4:33:11 PM: Starting to download cache of 263.7MB (Last modified: 2025-07-28 21:51:15 +0000 UTC)
4:33:12 PM: Finished downloading cache in 942ms
4:33:12 PM: Starting to extract cache
4:33:19 PM: Finished extracting cache in 7.096s
4:33:19 PM: Finished fetching cache in 8.099s
4:33:19 PM: Starting to prepare the repo for build
4:33:20 PM: Preparing Git Reference refs/heads/main
4:33:21 PM: Custom functions path detected. Proceeding with the specified path: 'netlify/functions'
4:33:22 PM: Starting to install dependencies
4:33:22 PM: Started restoring cached python cache
4:33:22 PM: Finished restoring cached python cache
4:33:22 PM: Started restoring cached ruby cache
4:33:23 PM: Finished restoring cached ruby cache
4:33:24 PM: Started restoring cached go cache
4:33:24 PM: Finished restoring cached go cache
4:33:25 PM: v22.17.1 is already installed.
4:33:25 PM: Now using node v22.17.1 (npm v10.9.2)
4:33:25 PM: Enabling Node.js Corepack
4:33:25 PM: Started restoring cached build plugins
4:33:25 PM: Finished restoring cached build plugins
4:33:25 PM: Started restoring cached corepack dependencies
4:33:25 PM: Finished restoring cached corepack dependencies
4:33:25 PM: No npm workspaces detected
4:33:25 PM: Started restoring cached node modules
4:33:25 PM: Finished restoring cached node modules
4:33:26 PM: Installing npm packages using npm version 10.9.2
4:33:26 PM: up to date in 362ms
4:33:26 PM: npm packages installed
4:33:26 PM: Successfully installed dependencies
4:33:26 PM: Starting build script
4:33:27 PM: Detected 1 framework(s)
4:33:27 PM: "vite" at version "5.4.19"
4:33:27 PM: Section completed: initializing
4:33:29 PM: ​
4:33:29 PM: Netlify Build                                                 
4:33:29 PM: ────────────────────────────────────────────────────────────────
4:33:29 PM: ​
4:33:29 PM: ❯ Version
4:33:29 PM:   @netlify/build 34.3.0
4:33:29 PM: ​
4:33:29 PM: ❯ Flags
4:33:29 PM:   accountId: 685eec67066d2503eabf1bd1
4:33:29 PM:   baseRelDir: true
4:33:29 PM:   buildId: 6887fa37830f970008ebf57d
4:33:29 PM:   deployId: 6887fa37830f970008ebf57f
4:33:29 PM: ​
4:33:29 PM: ❯ Current directory
4:33:29 PM:   /opt/build/repo
4:33:29 PM: ​
4:33:29 PM: ❯ Config file
4:33:29 PM:   No config file was defined: using default values.
4:33:29 PM: ​
4:33:29 PM: ❯ Context
4:33:29 PM:   production
4:33:29 PM: ​
4:33:29 PM: ❯ Installing extensions
4:33:29 PM:    - neon
4:33:30 PM: ​
4:33:30 PM: ❯ Loading extensions
4:33:30 PM:    - neon
4:33:31 PM: ​
4:33:31 PM: Build command from Netlify app                                
4:33:31 PM: ────────────────────────────────────────────────────────────────
4:33:31 PM: ​
4:33:31 PM: $ npm run build
4:33:31 PM: > token-exchange@0.0.0 build
4:33:31 PM: > vite build
4:33:31 PM: vite v5.4.19 building for production...
4:33:32 PM: transforming...
4:33:32 PM: [plugin:vite:esbuild] [plugin vite:esbuild] src/components/cupgame.jsx: This assignment will throw because "transformData" is a constant
4:33:32 PM: 387|
4:33:32 PM: 388|          if (insertError) throw insertError
4:33:32 PM: 389|          transformData = newTransform
4:33:32 PM:    |          ^
4:33:32 PM: 390|        }
4:33:32 PM: 391|
4:33:32 PM: 
4:33:32 PM: ✓ 52 modules transformed.
4:33:32 PM: x Build failed in 460ms
4:33:32 PM: error during build:
4:33:32 PM: Could not resolve "./components/LoginForm" from "src/components/ReleaseForm.jsx"
4:33:32 PM: file: /opt/build/repo/src/components/ReleaseForm.jsx
4:33:32 PM:     at getRollupError (file:///opt/build/repo/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
4:33:32 PM:     at error (file:///opt/build/repo/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
4:33:32 PM:     at ModuleLoader.handleInvalidResolvedId (file:///opt/build/repo/node_modules/rollup/dist/es/shared/node-entry.js:21442:24)
4:33:32 PM:     at file:///opt/build/repo/node_modules/rollup/dist/es/shared/node-entry.js:21402:26
4:33:32 PM: ​
4:33:32 PM: "build.command" failed                                        
4:33:32 PM: ────────────────────────────────────────────────────────────────
4:33:32 PM: ​
4:33:32 PM:   Error message
4:33:32 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
4:33:32 PM: ​
4:33:32 PM:   Error location
4:33:32 PM:   In Build command from Netlify app:
4:33:32 PM:   npm run build
4:33:32 PM: ​
4:33:32 PM:   Resolved config
4:33:32 PM:   build:
4:33:32 PM:     command: npm run build
4:33:32 PM:     commandOrigin: ui
4:33:32 PM:     environment:
4:33:32 PM:       - PAYPAL_CLIENT_ID
4:33:32 PM:       - PAYPAL_CLIENT_SECRET
4:33:32 PM:       - PAYPAL_WEBHOOK_ID
4:33:32 PM:       - SUPABASE_SERVICE_KEY
4:33:32 PM:       - SUPABASE_SERVICE_ROLE_KEY
4:33:32 PM:       - VITE_OPENAI_API_KEY
4:33:32 PM:       - VITE_PAYPAL_CLIENT_ID
4:33:32 PM:       - VITE_SUPABASE_ANON_KEY
4:33:32 PM:       - VITE_SUPABASE_URL
4:33:32 PM:     publish: /opt/build/repo/dist
4:33:32 PM:     publishOrigin: ui
4:33:32 PM:   functionsDirectory: /opt/build/repo/netlify/functions
4:33:33 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
4:33:33 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
4:33:33 PM: Failing build: Failed to build site
4:33:33 PM: Finished processing build request in 21.785s
