import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const fileExists = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const copyFile = (from, to) => {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
};

const copyDirRecursive = (fromDir, toDir) => {
  ensureDir(toDir);
  const entries = fs.readdirSync(fromDir, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      copyFile(from, to);
    }
  }
};

const downloadToFile = async (url, destPath) => {
  ensureDir(path.dirname(destPath));

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        downloadToFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download ${url} (status ${response.statusCode})`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => file.close(resolve));
    });

    request.on("error", (err) => {
      try {
        file.close();
      } catch {
        // ignore
      }
      try {
        fs.unlinkSync(destPath);
      } catch {
        // ignore
      }
      reject(err);
    });
  });
};

const findFirstExisting = (candidates) => {
  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }
  return null;
};

const findFirstExistingDir = (candidates) => {
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
};

const main = async () => {
  ensureDir(publicDir);

  // 1) Worker script
  const workerSrc = findFirstExisting([
    path.join(projectRoot, "node_modules", "tesseract.js", "dist", "worker.min.js"),
    path.join(projectRoot, "node_modules", "tesseract.js", "dist", "worker.min.mjs"),
    path.join(projectRoot, "node_modules", "tesseract.js", "dist", "worker.min.js"),
  ]);

  if (!workerSrc) {
    throw new Error(
      "Could not find Tesseract worker script in node_modules. Ensure `tesseract.js` is installed.",
    );
  }

  const workerDest = path.join(publicDir, "tesseract", "worker.min.js");
  copyFile(workerSrc, workerDest);

  // 2) Core assets (directory)
  const coreSrcDir = findFirstExistingDir([
    path.join(projectRoot, "node_modules", "tesseract.js-core"),
    path.join(projectRoot, "node_modules", "tesseract.js", "node_modules", "tesseract.js-core"),
  ]);

  if (!coreSrcDir) {
    throw new Error(
      "Could not find `tesseract.js-core` directory in node_modules. Ensure `tesseract.js` is installed.",
    );
  }

  const coreDestDir = path.join(publicDir, "tesseract-core");
  copyDirRecursive(coreSrcDir, coreDestDir);

  // 3) Language data (download if missing)
  // Keep this file in public/ so runtime OCR never needs the network.
  // Default source is the projectnaptha-hosted tessdata (same default used by Tesseract.js).
  const langDest = path.join(publicDir, "tessdata", "eng.traineddata.gz");
  if (!fileExists(langDest)) {
    const url = "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz";
    await downloadToFile(url, langDest);
  }

  // Basic sanity check: core directory should include wasm bundles.
  const wasmSanity = findFirstExisting([
    path.join(coreDestDir, "tesseract-core.wasm.js"),
    path.join(coreDestDir, "tesseract-core.wasm"),
    path.join(coreDestDir, "tesseract-core-simd.wasm.js"),
    path.join(coreDestDir, "tesseract-core-simd.wasm"),
  ]);
  if (!wasmSanity) {
    throw new Error(
      "Tesseract core assets were copied but expected wasm bundles were not found. Check `public/tesseract-core/`.",
    );
  }

  // eslint-disable-next-line no-console
  console.log("[OrgTrack] Tesseract offline assets ready:");
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, workerDest)}`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, coreDestDir)}/`);
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, langDest)}`);
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[OrgTrack] Failed to prepare Tesseract assets:");
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
