/**
 * Converts CommonJS modules to ESM (require -> import, module.exports -> export default)
 * 
 * @example
 * node scripts/to-esm.js
 */

const fs = require('fs');
const path = require('path');

const LIB_DIR = path.join(process.cwd(), 'lib');
const ESM_DIR = path.join(process.cwd(), 'module-js-lib');

/**
 * @param {string} content
 */
const convertToESM = (content) =>
{
	let imports = [];
	let body = content;

	const requireMatches = [...content.matchAll(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g)];

	for (const match of requireMatches.reverse())
	{
		const varName = match[1];
		const modulePath = match[2];
		body = body.replace(match[0], '');
		imports.push(
		{
			varName,
			modulePath
		});
	}

	const hasDefaultExport = body.includes('module.exports');
	const hasNamedExport = body.includes('module.exports = {');

	let exportStatement = '';
	if (hasDefaultExport)
	{
		const exportMatch = body.match(/module\.exports\s*=\s*([^;]+);?/);
		if (exportMatch)
		{
			exportStatement = `\nexport default ${exportMatch[1].trim()};\n`;
			body = body.replace(exportMatch[0], '');
		}
	}

	let result = '';

	for (const imp of imports)
	{
		result += `import ${imp.varName} from '${imp.modulePath}'\n`;
	}

	result += '\n';

	result += body;

	if (exportStatement)
	{
		result += exportStatement;
	}

	result = result.replace(/#lib/g, "#module-js-lib");

	return result.replace(/\n{3,}/g, '\n\n').replace(/^import\s/m, match => match);
}
/**
 * @param {string} srcDir
 * @param {string} destDir
 */
const processDirectory = (srcDir, destDir) =>
{
	if (!fs.existsSync(destDir))
	{
		fs.mkdirSync(destDir, { recursive: true });
	}

	const entries = fs.readdirSync(srcDir, { withFileTypes: true });

	for (const entry of entries)
	{
		const
			srcPath = path.join(srcDir, entry.name),
			destPath = path.join(destDir, entry.name);

		if (entry.isDirectory())
		{
			processDirectory(srcPath, destPath);
		}
		else if (entry.name.endsWith('.js'))
		{
			const content = fs.readFileSync(srcPath, 'utf8');
			const esmContent = convertToESM(content);
			fs.writeFileSync(destPath, esmContent);
			console.log(`Converted: ${path.relative(LIB_DIR, srcPath)}`);
		}
		else
		{
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

if (require.main === module)
{
	console.log('Converting CommonJS to ESM...\n');
	processDirectory(LIB_DIR, ESM_DIR);
	console.log('\nDone! ESM modules written to module-js-lib/');
}
