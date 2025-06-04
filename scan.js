const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function scanProject(targetDir) {
  console.log(`Scanning project at ${targetDir}\n`);

  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('package.json not found in target directory.');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath));
  const nextVersion = (pkg.dependencies && pkg.dependencies.next) ||
                      (pkg.devDependencies && pkg.devDependencies.next) ||
                      'not found';
  console.log(`Next.js version: ${nextVersion}`);

  console.log('\nRunning npm audit to check dependencies...');
  const lockFile = fs.existsSync(path.join(targetDir, 'package-lock.json')) ||
                   fs.existsSync(path.join(targetDir, 'npm-shrinkwrap.json'));
  if (!lockFile) {
    console.log('No lock file found, skipping npm audit.');
  } else {
    try {
      const auditOutput = execSync('npm audit --json', { cwd: targetDir });
      const auditData = JSON.parse(auditOutput.toString());
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        console.log('Vulnerability summary:', auditData.metadata.vulnerabilities);
        const advisories = auditData.advisories || auditData.vulnerabilities || {};
        if (Object.keys(advisories).length) {
          console.log('\nDetailed issues:');
          for (const key of Object.keys(advisories)) {
            const adv = advisories[key];
            console.log(`- [${adv.severity}] ${adv.module_name}: ${adv.title}`);
          }
        } else {
          console.log('No vulnerabilities found by npm audit.');
        }
      } else {
        console.log('No vulnerability data found.');
      }
    } catch (err) {
      console.error('npm audit failed:', err.message);
    }
  }

  console.log('\nScanning for dangerouslySetInnerHTML usage...');
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
    console.log('Found dangerouslySetInnerHTML in:');
    for (const f of filesWithDangerousHtml) console.log(' -', path.relative(targetDir, f));
  } else {
    console.log('No dangerouslySetInnerHTML usage found.');
  }
}

if (require.main === module) {
  const target = process.argv[2] || process.cwd();
  scanProject(path.resolve(target));
}
