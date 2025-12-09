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

	get_extensions().then((extensions) => {;
		for(const ext of extensions.sideloaded ){
			const extension = vscode.extensions.getExtension(ext);

			if (extension == undefined) {
				// Extension not installed, install it
				vscode.commands.executeCommand(installExtensionCommand, ext).then(
					() => {
						console.log(`Extension ${ext} installed successfully.`);
					},
					(error) => {
						console.error(`Failed to install extension ${ext}:`, error);
					}
				);
			} else {
				// Extension is installed, check if it's disabled
				if (!extension.isActive) {
					vscode.commands.executeCommand(enableExtensionCommand, ext).then(
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
	});
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