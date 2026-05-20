const { build } = require("esbuild");
const path = require("path");
const {execSync} = require("child_process");

/**
 * Build a CommonJS entry into both ESM and CJS outputs
 * @param {Object} options
 * @param {string} options.entry - path to CJS module
 * @param {string} options.outdir - output directory
 * @param {string} options.name - output base name
 */
async function buildFromCommonJS({ entry, outdir, name = "index" }) {
  const shared = {
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    target: ["es2018"],
    sourcemap: true,
    // IMPORTANT: tells esbuild input is CJS
    format: "cjs",
  };

  // Build ESM output (transform CJS → ESM)
  const esmBuild = build({
    ...shared,
    format: "esm",
    outfile: `${outdir}/${name}.mjs`,
  });

  // Build CJS output (keep CJS output)
  const cjsBuild = build({
    ...shared,
    format: "cjs",
    outfile: `${outdir}/${name}.cjs`,
  });

  await Promise.all([esmBuild, cjsBuild]);
}

const apiCallerPath = path.resolve(process.cwd(), "lib/api-caller/index.js");
const sdkPath = path.resolve(process.cwd(), "lib/sdk/index.js");
const routeHandlerPath = path.resolve(process.cwd(), "lib/route-handler/index.js");
const routerPath = path.resolve(process.cwd(), "lib/router/index.js");
const frontendErrorPath = path.resolve(process.cwd(), "lib/frontend-error/index.js");
const backendErrorPath = path.resolve(process.cwd(), "lib/backend-error/index.js");

const distPath = path.resolve(process.cwd(), "dist");
const tsconfigPath = path.resolve(process.cwd(), "tsconfig.build.json");

const main = async () =>
{
	const pr1 = buildFromCommonJS({ entry: apiCallerPath, outdir: distPath, name: "api-caller" });
	const pr2 = buildFromCommonJS({ entry: sdkPath, outdir: distPath, name: "sdk" });
	const pr3 = buildFromCommonJS({ entry: routeHandlerPath, outdir: distPath, name: "route-handler" });
	const pr4 = buildFromCommonJS({ entry: routerPath, outdir: distPath, name: "router" });
	const pr5 = buildFromCommonJS({ entry: frontendErrorPath, outdir: distPath, name: "frontend-error" });
	const pr6 = buildFromCommonJS({ entry: backendErrorPath, outdir: distPath, name: "backend-error" });
	
	await Promise.all([pr1, pr2, pr3, pr4, pr5, pr6]);

	execSync(`tsc -p ${tsconfigPath}`);
}

main();
