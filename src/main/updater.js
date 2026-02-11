/**
 * Solari Auto-Updater Module
 * 
 * Handles the self-update process for the portable executable:
 * 1. Writes a hidden batch script to %TEMP%
 * 2. Launches it via cmd.exe with windowsHide (invisible)
 * 3. Force-exits Solari with app.exit(0) (bypasses tray close handler)
 * 4. Batch script waits, deletes old exe, copies new exe, restarts
 * 
 * KEY DESIGN DECISIONS:
 * - Uses cmd.exe (proven to work) instead of PowerShell
 * - Uses `ping` for delays instead of `tasklist | find` (which hangs in pipes)
 * - Uses `app.exit(0)` instead of `app.quit()` (quit is blocked by tray handler)
 * - Uses `windowsHide: true` to keep the batch window invisible
 * - Includes detailed logging to %TEMP%\solari_update.log for debugging
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * Installs the update and restarts the application.
 * @param {string} updatePath - Absolute path to the downloaded new .exe in temp
 */
function installUpdateAndRestart(updatePath) {
    // CRITICAL: In portable Electron apps, process.execPath points to the
    // EXTRACTED temp copy (e.g. C:\...\Temp\38mRYL5C\Solari.exe), NOT the
    // actual portable .exe file the user double-clicked.
    // electron-builder sets PORTABLE_EXECUTABLE_FILE to the real exe path.
    const currentExe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
    const batPath = path.join(app.getPath('temp'), 'update_solari.bat');
    const logPath = path.join(app.getPath('temp'), 'solari_update.log');

    console.log('[Solari Updater] === Starting Update Process ===');
    console.log('[Solari Updater] Current EXE:', currentExe);
    console.log('[Solari Updater] Update file:', updatePath);
    console.log('[Solari Updater] Batch script:', batPath);

    // Build a simple, reliable batch script
    // - Uses `ping` for delays (universally reliable, no pipes)
    // - Uses `del /F /Q` for force deletion
    // - Uses `copy /Y` for overwrite copy
    // - Includes retry loop for locked file scenarios
    // - Logs every step to solari_update.log
    const batContent = [
        '@echo off',
        '',
        ':: Solari Auto-Update Script',
        ':: This script replaces the running executable with the new version',
        '',
        `echo [UPDATE] Starting update at %DATE% %TIME% > "${logPath}"`,
        `echo [UPDATE] Old EXE: "${currentExe}" >> "${logPath}"`,
        `echo [UPDATE] New EXE: "${updatePath}" >> "${logPath}"`,
        '',
        ':: Step 1: Wait for Solari process to fully exit (5 seconds)',
        `echo [UPDATE] Waiting 5 seconds for Solari to close... >> "${logPath}"`,
        'ping -n 6 127.0.0.1 > nul',
        '',
        ':: Step 2: Delete old executable (retry up to 30 times)',
        ':retry_delete',
        `echo [UPDATE] Attempting to delete old executable... >> "${logPath}"`,
        `del /F /Q "${currentExe}" > nul 2>&1`,
        `if exist "${currentExe}" (`,
        `    echo [UPDATE] File still locked, waiting 2 seconds... >> "${logPath}"`,
        '    ping -n 3 127.0.0.1 > nul',
        '    goto retry_delete',
        ')',
        `echo [UPDATE] Old executable deleted successfully. >> "${logPath}"`,
        '',
        ':: Step 3: Copy new executable to original location',
        `echo [UPDATE] Copying new version... >> "${logPath}"`,
        `copy /Y "${updatePath}" "${currentExe}" > nul`,
        `if not exist "${currentExe}" (`,
        `    echo [UPDATE] ERROR: Copy failed! >> "${logPath}"`,
        '    exit /b 1',
        ')',
        `echo [UPDATE] New version copied successfully. >> "${logPath}"`,
        '',
        ':: Step 4: Start the new version',
        `echo [UPDATE] Starting new Solari... >> "${logPath}"`,
        `start "" "${currentExe}"`,
        '',
        ':: Step 5: Cleanup',
        `echo [UPDATE] Cleaning up temp files... >> "${logPath}"`,
        `del "${updatePath}" > nul 2>&1`,
        `echo [UPDATE] Update complete! >> "${logPath}"`,
        '',
        ':: Self-delete this batch file',
        '(goto) 2>nul & del "%~f0"',
    ].join('\r\n');

    try {
        // Write the batch script
        fs.writeFileSync(batPath, batContent, 'utf8');

        // Use a VBScript wrapper to launch the batch file 100% invisibly.
        // WScript.Shell.Run with window style 0 = completely hidden, no CMD flash.
        const vbsPath = path.join(app.getPath('temp'), 'update_solari.vbs');
        const vbsContent = `CreateObject("WScript.Shell").Run "cmd.exe /c """"${batPath}""""", 0, False`;
        fs.writeFileSync(vbsPath, vbsContent, 'utf8');

        const child = spawn('wscript.exe', [vbsPath], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        console.log('[Solari Updater] Update script launched (invisible via VBS).');

        // CRITICAL: Use app.exit(0) instead of app.quit()
        // 
        // app.quit() fires the 'close' event on all windows.
        // Solari's main window has a close handler that calls event.preventDefault()
        // and hides to tray instead of closing. This means app.quit() NEVER
        // actually terminates the process, and the .exe stays locked forever.
        //
        // app.exit(0) forces immediate process termination, bypassing all handlers.
        // The 1-second delay ensures the batch script has time to start.
        console.log('[Solari Updater] Force-exiting in 1 second...');
        setTimeout(() => {
            app.exit(0);
        }, 1000);

    } catch (e) {
        console.error('[Solari Updater] Failed to launch update script:', e);
        throw e;
    }
}

module.exports = { installUpdateAndRestart };
