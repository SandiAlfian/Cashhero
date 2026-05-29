# AI Agent Context - Universal Configuration

## Project Information
- **Name**: Cashhero
- **Type**: Pahlawan Kelola Keuangan Pribadi
- **Language**: TypeScript
- **Framework**: Next.js 15 (App Router)

## Quick Reference for AI Agents
- Read `.ai/architecture.md` for tech stack & structure
- Read `.ai/ui-standard.md` for design system & UI patterns
- Read `.ai/execution-flow.md` for development workflow
- Check `.ai/project-config.json` for programmatic configuration

## Platform-Specific Notes
- **Claude/Anthropic**: Use .ai/ folder as context source
- **Cursor/Windsurf**: Automatically reads .ai/ configuration
- **GitHub Copilot**: Reference patterns in comments
- **Other Agents**: Use .ai/ files as specification documents

## Universal Usage
When creating new projects with similar stack:
1. Copy .ai/ folder structure
2. Update project-config.json with new project details
3. Adapt architecture.md for any framework changes
4. Customize ui-standard.md for brand/design changes
5. Keep execution-flow.md as workflow standard

## Context Priority
1. Project-specific overrides in .ai/
2. Global agent rules (if any)
3. Framework/library defaults
4. General best practices