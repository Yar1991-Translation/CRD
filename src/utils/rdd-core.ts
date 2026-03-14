import JSZip from 'jszip';

const hostPath = "https://setup-aws.rbxcdn.com"; // Only the AWS mirror has proper CORS cfg

const extractRoots: Record<string, Record<string, string>> = {
    player: {
        "RobloxApp.zip": "",
        "redist.zip": "",
        "shaders.zip": "shaders/",
        "ssl.zip": "ssl/",

        "WebView2.zip": "",
        "WebView2RuntimeInstaller.zip": "WebView2RuntimeInstaller/",

        "content-avatar.zip": "content/avatar/",
        "content-configs.zip": "content/configs/",
        "content-fonts.zip": "content/fonts/",
        "content-sky.zip": "content/sky/",
        "content-sounds.zip": "content/sounds/",
        "content-textures2.zip": "content/textures/",
        "content-models.zip": "content/models/",

        "content-platform-fonts.zip": "PlatformContent/pc/fonts/",
        "content-platform-dictionaries.zip": "PlatformContent/pc/shared_compression_dictionaries/",
        "content-terrain.zip": "PlatformContent/pc/terrain/",
        "content-textures3.zip": "PlatformContent/pc/textures/",

        "extracontent-luapackages.zip": "ExtraContent/LuaPackages/",
        "extracontent-translations.zip": "ExtraContent/translations/",
        "extracontent-models.zip": "ExtraContent/models/",
        "extracontent-textures.zip": "ExtraContent/textures/",
        "extracontent-places.zip": "ExtraContent/places/"
    },
    studio: {
        // We only really need player for CRD, but keep studio just in case
        "RobloxStudio.zip": "",
        "RibbonConfig.zip": "RibbonConfig/",
        "redist.zip": "",
        "Libraries.zip": "",
        "LibrariesQt5.zip": "",

        "WebView2.zip": "",
        "WebView2RuntimeInstaller.zip": "",

        "shaders.zip": "shaders/",
        "ssl.zip": "ssl/",

        "Qml.zip": "Qml/",
        "Plugins.zip": "Plugins/",
        "StudioFonts.zip": "StudioFonts/",
        "BuiltInPlugins.zip": "BuiltInPlugins/",
        "ApplicationConfig.zip": "ApplicationConfig/",
        "BuiltInStandalonePlugins.zip": "BuiltInStandalonePlugins/",

        "content-qt_translations.zip": "content/qt_translations/",
        "content-sky.zip": "content/sky/",
        "content-fonts.zip": "content/fonts/",
        "content-avatar.zip": "content/avatar/",
        "content-models.zip": "content/models/",
        "content-sounds.zip": "content/sounds/",
        "content-configs.zip": "content/configs/",
        "content-api-docs.zip": "content/api_docs/",
        "content-textures2.zip": "content/textures/",
        "content-studio_svg_textures.zip": "content/studio_svg_textures/",

        "content-platform-fonts.zip": "PlatformContent/pc/fonts/",
        "content-platform-dictionaries.zip": "PlatformContent/pc/shared_compression_dictionaries/",
        "content-terrain.zip": "PlatformContent/pc/terrain/",
        "content-textures3.zip": "PlatformContent/pc/textures/",

        "extracontent-translations.zip": "ExtraContent/translations/",
        "extracontent-luapackages.zip": "ExtraContent/LuaPackages/",
        "extracontent-textures.zip": "ExtraContent/textures/",
        "extracontent-scripts.zip": "ExtraContent/scripts/",
        "extracontent-models.zip": "ExtraContent/models/",

        "studiocontent-models.zip": "StudioContent/models/",
        "studiocontent-textures.zip": "StudioContent/textures/"
    }
};

export const binaryTypes: Record<string, { blobDir: string }> = {
    WindowsPlayer: { blobDir: "/" },
    WindowsStudio64: { blobDir: "/" },
    MacPlayer: { blobDir: "/mac/" },
    MacStudio: { blobDir: "/mac/" }
};

function downloadBinaryFile(fileName: string, data: ArrayBuffer, mimeType = "application/zip") {
    const blob = new Blob([data], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export class RDDCore {
    private logFn: (msg: string) => void;
    private shouldCancel: boolean = false;

    constructor(logFn: (msg: string) => void) {
        this.logFn = logFn;
    }

    public cancel() {
        this.shouldCancel = true;
    }

    private log(msg: string) {
        if (!this.shouldCancel) {
            this.logFn(msg);
        }
    }

    public async run(binaryType: string, versionHash: string, channel: string = "LIVE") {
        this.shouldCancel = false;
        
        let safeChannel = channel;
        if (safeChannel !== "LIVE") safeChannel = safeChannel.toLowerCase();
        
        let version = versionHash.toLowerCase();
        if (!version.startsWith("version-")) {
            version = "version-" + version;
        }

        const binTypeObj = binaryTypes[binaryType];
        if (!binTypeObj) {
            this.log(`[!] Error: BinaryType \`${binaryType}\` not supported.`);
            return;
        }

        const blobDir = binTypeObj.blobDir;
        let channelPath = safeChannel === "LIVE" ? hostPath : `${hostPath}/channel/${safeChannel}`;
        let versionPath = `${channelPath}${blobDir}${version}-`;

        if (binaryType === "MacPlayer" || binaryType === "MacStudio") {
            const zipFileName = (binaryType === "MacPlayer") ? "RobloxPlayer.zip" : "RobloxStudioApp.zip";
            this.log(`[+] Fetching zip archive for BinaryType "${binaryType}" (${zipFileName})`);

            const outputFileName = `${safeChannel}-${binaryType}-${version}.zip`;
            this.log(`[+] (Please wait!) Downloading ${outputFileName}..`);

            try {
                const resp = await fetch(versionPath + zipFileName);
                if (!resp.ok) throw new Error(`Status ${resp.status}`);
                const data = await resp.arrayBuffer();
                if (this.shouldCancel) return;
                
                this.log("done! Download will start now.");
                downloadBinaryFile(outputFileName, data);
            } catch (err: any) {
                this.log(`[!] Binary request error @ ${versionPath + zipFileName} - ${err.message}`);
            }
        } else {
            this.log(`[+] Fetching rbxPkgManifest for ${version}@${safeChannel}..`);
            let manifestBody = "";
            try {
                let resp = await fetch(versionPath + "rbxPkgManifest.txt");
                if (!resp.ok) {
                    channelPath = `${hostPath}/channel/common`;
                    versionPath = `${channelPath}${blobDir}${version}-`;
                    resp = await fetch(versionPath + "rbxPkgManifest.txt");
                }
                if (!resp.ok) {
                    this.log(`[!] Failed to fetch rbxPkgManifest: (status: ${resp.status})`);
                    return;
                }
                manifestBody = await resp.text();
            } catch (err: any) {
                this.log(`[!] Network error fetching manifest: ${err.message}`);
                return;
            }

            if (this.shouldCancel) return;
            await this.downloadZipsFromManifest(manifestBody, binaryType, versionPath, safeChannel, version);
        }
    }

    private async downloadZipsFromManifest(manifestBody: string, binaryType: string, versionPath: string, channel: string, version: string) {
        const pkgManifestLines = manifestBody.split("\n").map(line => line.trim()).filter(l => l);
        if (pkgManifestLines[0] !== "v0") {
            this.log(`[!] Error: unknown rbxPkgManifest format version; expected "v0", got "${pkgManifestLines[0]}"`);
            return;
        }

        let binExtractRoots: Record<string, string>;
        if (pkgManifestLines.includes("RobloxApp.zip")) {
            binExtractRoots = extractRoots.player;
            if (binaryType === "WindowsStudio64") {
                this.log(`[!] Error: BinaryType \`${binaryType}\` given, but "RobloxApp.zip" was found in the manifest!`);
                return;
            }
        } else if (pkgManifestLines.includes("RobloxStudio.zip")) {
            binExtractRoots = extractRoots.studio;
            if (binaryType === "WindowsPlayer") {
                this.log(`[!] Error: BinaryType \`${binaryType}\` given, but "RobloxStudio.zip" was found in the manifest!`);
                return;
            }
        } else {
            this.log("[!] Error: Bad/unrecognized rbxPkgManifest, aborting");
            return;
        }

        this.log(`[+] Fetching blobs for BinaryType \`${binaryType}\`..`);
        const zip = new JSZip();

        zip.file("AppSettings.xml", `<?xml version="1.0" encoding="UTF-8"?>
<Settings>
\t<ContentFolder>content</ContentFolder>
\t<BaseUrl>http://www.roblox.com</BaseUrl>
</Settings>
`);

        const packagesToDownload = pkgManifestLines.filter(line => line.endsWith(".zip"));
        let threadsLeft = packagesToDownload.length;

        const downloadPackage = async (packageName: string) => {
            if (this.shouldCancel) return;
            this.log(`[+] Fetching "${packageName}"..`);
            try {
                const resp = await fetch(versionPath + packageName);
                if (!resp.ok) throw new Error(`Status ${resp.status}`);
                const blobData = await resp.arrayBuffer();

                if (this.shouldCancel) return;

                if (!(packageName in binExtractRoots)) {
                    this.log(`[*] Package name "${packageName}" not defined in extraction roots, skipping extraction!`);
                    zip.file(packageName, blobData);
                    this.log(`[+] Moved package "${packageName}" directly to the root folder`);
                } else {
                    this.log(`[+] Extracting "${packageName}"..`);
                    const extractRootFolder = binExtractRoots[packageName];
                    const packageZip = await JSZip.loadAsync(blobData);
                    
                    const fileGetPromises: Promise<void>[] = [];
                    packageZip.forEach((path, object) => {
                        if (path.endsWith("/") || path.endsWith("\\")) return;
                        const fixedPath = path.replace(/\\\\/g, "/");
                        fileGetPromises.push(object.async("arraybuffer").then(data => {
                            zip.file(extractRootFolder + fixedPath, data);
                        }));
                    });

                    await Promise.all(fileGetPromises);
                    this.log(`[+] Extracted "${packageName}"! (Packages left: ${threadsLeft - 1})`);
                }
            } catch (err: any) {
                this.log(`[!] Error processing ${packageName}: ${err.message}`);
            } finally {
                threadsLeft--;
            }
        };

        // We run downloads in parallel but chunk them to avoid network overload? 
        // Original RDD fires them all at once.
        const promises = packagesToDownload.map(pkg => downloadPackage(pkg));
        await Promise.all(promises);

        if (this.shouldCancel) return;

        const outputFileName = `${channel}-${binaryType}-${version}.zip`;
        this.log(`[+] Exporting assembled zip file "${outputFileName}".. (Compression may take a minute)`);

        try {
            const outputZipData = await zip.generateAsync({
                type: "arraybuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 5 }
            }, (metadata) => {
                if (metadata.percent % 10 === 0 || metadata.percent === 100) {
                    // Could log compression progress if wanted
                }
            });

            if (this.shouldCancel) return;
            
            this.log("done! Download will start now.");
            downloadBinaryFile(outputFileName, outputZipData);
        } catch (err: any) {
            this.log(`[!] Error generating final zip: ${err.message}`);
        }
    }
}
