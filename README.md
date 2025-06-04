# nextJs_SCAN

A simple command line tool that scans a Next.js project for potential security issues. The scanner checks the project dependencies using `npm audit` and searches the source code for insecure patterns like `dangerouslySetInnerHTML`.

## Usage

1. Ensure you have Node.js installed.
2. Install the tool dependencies (none required besides Node itself).
3. Run the scanner and provide a path to the Next.js project you want to scan:

```bash
node scan.js /path/to/nextjs/project
```

The script will output the Next.js version in the project, report any dependency vulnerabilities found by `npm audit`, and list files that use `dangerouslySetInnerHTML`.
