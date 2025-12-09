// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const assert = require('assert');
const sinon = require('sinon');
const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let executeCommandStub;
	let getExtensionStub;
	let fetchStub;

	const mockExtensions = {
		sideloaded: [
			"test.extension1",
			"test.extension2",
			"test.extension3"
		]
	};

	teardown(() => {
		sinon.restore();
	});

	test('Activate function should install missing extensions', async () => {
		const context = { subscriptions: [] };

		fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		getExtensionStub = sinon.stub(vscode.extensions, 'getExtension').returns(undefined);

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(executeCommandStub.callCount, mockExtensions.sideloaded.length);
		assert.ok(executeCommandStub.alwaysCalledWith('workbench.extensions.installExtension'));
	});

	test('Activate function should not reinstall already installed and active extensions', async () => {
		const context = { subscriptions: [] };

		fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		getExtensionStub = sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(executeCommandStub.callCount, 0);
	});

	test('Activate function should enable disabled extensions', async () => {
		const context = { subscriptions: [] };

		fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		getExtensionStub = sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: false });

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		assert.strictEqual(executeCommandStub.callCount, mockExtensions.sideloaded.length);
		assert.ok(executeCommandStub.alwaysCalledWith('workbench.extensions.enableExtension'));
	});
});
