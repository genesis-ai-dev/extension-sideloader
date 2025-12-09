// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const fs = require('fs');
// const path = require('path');
// const unzipper = require('unzipper');
// const https = require('https');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    const installExtensionCommand = 'workbench.extensions.installExtension';
	const enableExtensionCommand = 'workbench.extensions.enableExtension';

	// Register toggle command
	const toggleCommand = vscode.commands.registerCommand('extension-sideloader.toggleForceEnable', () => {
		const config = vscode.workspace.getConfiguration('extensionSideloader');
		const currentValue = config.get('forceEnable', true);
		config.update('forceEnable', !currentValue, vscode.ConfigurationTarget.Global).then(
			() => {
				vscode.window.showInformationMessage(
					`Extension Sideloader: Force enable is now ${!currentValue ? 'enabled' : 'disabled'}`
				);
			},
			(error) => {
				vscode.window.showErrorMessage(`Failed to update setting: ${error}`);
			}
		);
	});

	context.subscriptions.push(toggleCommand);

	// Initial check and install missing extensions on startup
	get_extensions().then((extensions) => {
		const config = vscode.workspace.getConfiguration('extensionSideloader');
		const forceEnable = config.get('forceEnable', true);

		checkAndInstallExtensions(extensions.sideloaded, forceEnable, installExtensionCommand, enableExtensionCommand);

		// Monitor extension state changes
		const extensionChangeListener = vscode.extensions.onDidChange(() => {
			const currentConfig = vscode.workspace.getConfiguration('extensionSideloader');
			const currentForceEnable = currentConfig.get('forceEnable', true);

			// Only check for disabled extensions if force enable is on
			if (currentForceEnable) {
				checkDisabledExtensions(extensions.sideloaded, enableExtensionCommand);
			}
		});

		context.subscriptions.push(extensionChangeListener);
	});
}

/**
 * Check and install missing extensions, and enable disabled ones
 * @param {string[]} sideloadedExtensions - Array of extension IDs to check
 * @param {boolean} forceEnable - Whether to force enable disabled extensions
 * @param {string} installCommand - Command to install extensions
 * @param {string} enableCommand - Command to enable extensions
 */
function checkAndInstallExtensions(sideloadedExtensions, forceEnable, installCommand, enableCommand) {
	for(const ext of sideloadedExtensions) {
		const extension = vscode.extensions.getExtension(ext);

		if (extension == undefined) {
			// Extension not installed, install it
			vscode.commands.executeCommand(installCommand, ext).then(
				() => {
					console.log(`Extension ${ext} installed successfully.`);
				},
				(error) => {
					console.error(`Failed to install extension ${ext}:`, error);
				}
			);
		} else {
			// Extension is installed, check if it's disabled and if force enable is on
			if (!extension.isActive && forceEnable) {
				vscode.commands.executeCommand(enableCommand, ext).then(
					() => {
						console.log(`Extension ${ext} enabled successfully.`);
					},
					(error) => {
						console.error(`Failed to enable extension ${ext}:`, error);
					}
				);
			} else {
				console.log(`Extension ${ext} is already installed and active.`);
			}
		}
	}
}

/**
 * Check if any sideloaded extensions are disabled and attempt to re-enable them
 * @param {string[]} sideloadedExtensions - Array of extension IDs to check
 * @param {string} enableCommand - Command to enable extensions
 */
function checkDisabledExtensions(sideloadedExtensions, enableCommand) {
	for(const ext of sideloadedExtensions) {
		const extension = vscode.extensions.getExtension(ext);

		// Only attempt to enable if extension is installed but not active
		if (extension && !extension.isActive) {
			console.log(`Detected that extension ${ext} is not active, attempting to enable...`);
			vscode.commands.executeCommand(enableCommand, ext).then(
				() => {
					console.log(`Extension ${ext} re-enabled successfully.`);
				},
				(error) => {
					console.error(`Failed to re-enable extension ${ext}:`, error);
				}
			);
		}
	}
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

async function get_extensions() {
	return await fetch('https://raw.githubusercontent.com/andrewhertog/extension-sideloader/main/extensions.json')
		.then(response => response.json());	
}