---
name: file-management
description: Create, read, update, and delete files and folders in the project
---

# File Management Skill

Use this skill to manage project files and folders.

## When to Use

- Creating new files or folders
- Reading existing file contents
- Updating file contents
- Renaming or deleting files
- Listing files to understand project structure

## Guidelines

1. **Understand structure first** - Use listFiles to understand the project structure before making changes
2. **Read before modify** - Use readFiles to understand existing code before updating
3. **Batch operations** - Use createFiles to create multiple files efficiently
4. **Path format** - File paths can include directories (e.g., "src/components/Button.tsx")
5. **Preserve existing code** - When updating files, maintain existing functionality unless explicitly asked to change it

## Available Tools

- **listFiles** - List files and folders in the project
- **readFiles** - Read contents of one or more files
- **createFiles** - Create new files with content
- **updateFile** - Update existing file content
- **deleteFiles** - Delete files from the project
- **renameFile** - Rename or move files
- **createFolder** - Create new directories
