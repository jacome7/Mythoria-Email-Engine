# Clasp (Command Line Apps Script Projects) Guide

Clasp allows you to develop your Apps Script projects locally using your own tools like VS Code, TypeScript, and Git.

## 1. Installation and Prerequisites

`clasp` requires **Node.js** (version 4.7.4 or later, though >= 20.0.0 is recommended).

```bash
# Install clasp globally
npm install -g @google/clasp
```

**Crucial Step:** Before using the CLI, you **must** enable the Google Apps Script API:
1. Go to [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings).
2. Toggle **Google Apps Script API** to **On**.

## 2. Authentication

Log in to your Google account via the terminal. This opens a browser window for authorization.

```bash
clasp login
```
*(Note: For Google Workspace accounts, your admin may need to allow API access in the Admin Console.)*

## 3. Project Setup

You can either create a new project or clone an existing one.

**Create a new project:**
```bash
mkdir my-project
cd my-project
clasp create --title "My New Script" --type standalone
```
*(Types include: `standalone`, `docs`, `sheets`, `slides`, `forms`)*

**Clone an existing project:**
Find your **Script ID** in the Apps Script editor under *Project Settings*.
```bash
clasp clone <SCRIPT_ID>
```

## 4. Local Development

`clasp` automatically handles the conversion between local `.js` files and the `.gs` files used in the online editor.

*   **Push local changes to the cloud:**
    ```bash
    clasp push
    ```
*   **Watch for changes (auto-push on save):**
    ```bash
    clasp push --watch
    ```
*   **Pull changes from the cloud (if edited online):**
    ```bash
    clasp pull
    ```

## 5. Deployment

Manage versions and deployments directly from the CLI.

*   **Create a new deployment:**
    ```bash
    clasp deploy --description "Initial version"
    ```
*   **List existing deployments:**
    ```bash
    clasp deployments
    ```
*   **Open the project in your browser:**
    ```bash
    clasp open
    ```