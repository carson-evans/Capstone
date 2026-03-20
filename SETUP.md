# CommonMASS Setup Guide

This guide explains how to install the required tools, clone the repository, install dependencies, and run the project locally.

---

## Requirements

Install the following before working on the project:

- **Visual Studio Code**
- **Git**
- **Node.js (LTS version)**

Node.js includes **npm**, which is required to install project dependencies.

---

## Verify Installation

Open a terminal and run:

```bash
git --version
node -v
npm -v
```

If each command returns a version number, the system is ready.

---

## Clone the Repository

### Option 1: Clone in VS Code

1. Open **Visual Studio Code**
2. Select **Clone Git Repository**
3. Enter the repository URL:

```bash
https://github.com/carson-evans/CommonMASS.git
```

4. Choose a local folder
5. Open the project after cloning finishes

### Option 2: Clone in Terminal

```bash
git clone https://github.com/carson-evans/CommonMASS.git
cd CommonMASS
code .
```

---

## Branch Setup

Check the current branch:

```bash
git branch
```

Switch to the `dev` branch:

```bash
git checkout dev
```

Pull the latest changes:

```bash
git pull origin dev
```

Create a working branch before making changes:

```bash
git checkout -b your-name/feature-name
```

Example:

```bash
git checkout -b carson/readme-update
```

---

## Install Dependencies

From the project root, run:

```bash
npm install
```

This installs all required packages from `package.json`.

---

## Environment Configuration

If environment variables are needed, copy the example file.

### Mac / Linux

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Update `.env` as needed for local development.

---

## Run the Project Locally

Start the development server:

```bash
npm run dev
```

The terminal will display a local URL, usually:

```bash
http://localhost:5173
```

Open that URL in a browser.

---

## Troubleshooting

### Git is not recognized
Git may not be installed correctly, or the terminal may need to be restarted.

### npm is not recognized
Node.js may not be installed correctly, or the terminal may need to be restarted.

### Dependencies are missing
Run:

```bash
npm install
```

### The local site does not start
Make sure the terminal is in the project root, then run:

```bash
npm install
npm run dev
```

### VS Code opens without the project
Open the actual `CommonMASS` folder after cloning.