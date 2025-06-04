const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function scanProject(targetDir, log = console.log) {
  log(`Scanning project at ${targetDir}\n`);

  const result = {
    nextVersion: null,
    vulnerabilities: null,
    issues: [],
    dangerousHtmlFiles: []
  };

  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    log('package.json not found in target directory.');
    return result;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath));
  result.nextVersion = (pkg.dependencies && pkg.dependencies.next) ||
                       (pkg.devDependencies && pkg.devDependencies.next) ||
                       'not found';
  log(`Next.js version: ${result.nextVersion}`);

  log('\nRunning npm audit to check dependencies...');
  const lockFile = fs.existsSync(path.join(targetDir, 'package-lock.json')) ||
                   fs.existsSync(path.join(targetDir, 'npm-shrinkwrap.json'));
  if (!lockFile) {
    log('No lock file found, skipping npm audit.');
  } else {
    try {
      const auditOutput = execSync('npm audit --json', { cwd: targetDir });
      const auditData = JSON.parse(auditOutput.toString());
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        result.vulnerabilities = auditData.metadata.vulnerabilities;
        log('Vulnerability summary: ' + JSON.stringify(result.vulnerabilities));
        const advisories = auditData.advisories || auditData.vulnerabilities || {};
        if (Object.keys(advisories).length) {
          log('\nDetailed issues:');
          for (const key of Object.keys(advisories)) {
            const adv = advisories[key];
            result.issues.push({
              severity: adv.severity,
              module: adv.module_name,
              title: adv.title
            });
            log(`- [${adv.severity}] ${adv.module_name}: ${adv.title}`);
          }
        } else {
          log('No vulnerabilities found by npm audit.');
        }
      } else {
        log('No vulnerability data found.');
      }
    } catch (err) {
      log(`npm audit failed: ${err.message}`);
    }
  }

  log('\nScanning for dangerouslySetInnerHTML usage...');
  const filesWithDangerousHtml = [];
  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else if (/\.jsx?$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('dangerouslySetInnerHTML')) {
          filesWithDangerousHtml.push(full);
        }
      }
    }
  }
  scanDir(targetDir);

  if (filesWithDangerousHtml.length) {
    log('Found dangerouslySetInnerHTML in:');
    for (const f of filesWithDangerousHtml) {
      const rel = path.relative(targetDir, f);
      result.dangerousHtmlFiles.push(rel);
      log(' - ' + rel);
    }
  } else {
    log('No dangerouslySetInnerHTML usage found.');
  }

  return result;
}

if (require.main === module) {
  const target = process.argv[2] || process.cwd();
  scanProject(path.resolve(target));
}

module.exports = { scanProject };
