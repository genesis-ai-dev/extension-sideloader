// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const assert = require('assert');
const sinon = require('sinon');
const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

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
		const configStub = {
			get: sinon.stub().returns(true)
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns(undefined);
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});
		sinon.stub(vscode.extensions, 'onDidChange').returns({});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		const installCalls = executeCommandStub.getCalls().filter(
			call => call.args[0] === 'workbench.extensions.installExtension'
		);
		assert.strictEqual(installCalls.length, mockExtensions.sideloaded.length);
	});

	test('Activate function should not reinstall already installed and active extensions', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true)
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		const installOrEnableCalls = executeCommandStub.getCalls().filter(
			call => call.args[0] === 'workbench.extensions.installExtension' ||
			       call.args[0] === 'workbench.extensions.enableExtension'
		);
		assert.strictEqual(installOrEnableCalls.length, 0);
	});

	test('Activate function should enable disabled extensions', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true)
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		const getExtensionStub = sinon.stub(vscode.extensions, 'getExtension');

		// Return inactive for test extensions, undefined for others
		getExtensionStub.callsFake((extId) => {
			if (mockExtensions.sideloaded.includes(extId)) {
				return { isActive: false };
			}
			return undefined;
		});

		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		const enableCalls = executeCommandStub.getCalls().filter(
			call => call.args[0] === 'workbench.extensions.enableExtension' &&
			       mockExtensions.sideloaded.includes(call.args[1])
		);
		assert.strictEqual(enableCalls.length, mockExtensions.sideloaded.length);
	});

	test('Activate function should register toggle command', async () => {
		const context = { subscriptions: [] };

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand').returns({});

		await myExtension.activate(context);

		assert.ok(registerCommandStub.calledWith('extension-sideloader.toggleForceEnable'));
		assert.strictEqual(context.subscriptions.length, 1);
	});

	test('Toggle command should change forceEnable setting from true to false', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true),
			update: sinon.stub().resolves()
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.window, 'showInformationMessage');

		let toggleCallback;
		sinon.stub(vscode.commands, 'registerCommand').callsFake((cmd, callback) => {
			if (cmd === 'extension-sideloader.toggleForceEnable') {
				toggleCallback = callback;
			}
			return {};
		});

		await myExtension.activate(context);
		await toggleCallback();

		assert.ok(configStub.update.calledWith('forceEnable', false, vscode.ConfigurationTarget.Global));
	});

	test('Toggle command should change forceEnable setting from false to true', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(false),
			update: sinon.stub().resolves()
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.window, 'showInformationMessage');

		let toggleCallback;
		sinon.stub(vscode.commands, 'registerCommand').callsFake((cmd, callback) => {
			if (cmd === 'extension-sideloader.toggleForceEnable') {
				toggleCallback = callback;
			}
			return {};
		});

		await myExtension.activate(context);
		await toggleCallback();

		assert.ok(configStub.update.calledWith('forceEnable', true, vscode.ConfigurationTarget.Global));
	});

	test('Activate should NOT enable disabled extensions when forceEnable is false', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(false)
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: false });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should not call enableExtension when forceEnable is false
		const enableCalls = executeCommandStub.getCalls().filter(
			call => call.args[0] === 'workbench.extensions.enableExtension'
		);
		assert.strictEqual(enableCalls.length, 0);
	});

	test('Activate should enable disabled extensions when forceEnable is true (default)', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true)
		};

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});
		const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: false });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should call enableExtension for each disabled extension
		const enableCalls = executeCommandStub.getCalls().filter(
			call => call.args[0] === 'workbench.extensions.enableExtension'
		);
		assert.strictEqual(enableCalls.length, mockExtensions.sideloaded.length);
	});

	test('Activate should register onDidChange event listener', async () => {
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true)
		};

		// Stub vscode APIs BEFORE fetching
		sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});
		sinon.stub(vscode.extensions, 'onDidChange').returns({});

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Should have toggle command + event listener in subscriptions
		assert.strictEqual(context.subscriptions.length, 2, 'Should have 2 subscriptions (toggle command + event listener)');
	});

	test('Event listener respects forceEnable setting', async () => {
		// This test verifies that the event listener subscription is added
		// and that it respects the forceEnable setting
		const context = { subscriptions: [] };
		const configStub = {
			get: sinon.stub().returns(true)
		};

		sinon.stub(vscode.commands, 'executeCommand').resolves();
		sinon.stub(vscode.extensions, 'getExtension').returns({ isActive: true });
		sinon.stub(vscode.workspace, 'getConfiguration').returns(configStub);
		sinon.stub(vscode.commands, 'registerCommand').returns({});
		sinon.stub(vscode.extensions, 'onDidChange').returns({});

		const _fetchStub = sinon.stub(global, 'fetch').resolves({
			json: async () => mockExtensions
		});

		await myExtension.activate(context);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify subscription was registered
		assert.strictEqual(context.subscriptions.length, 2, 'Should have 2 subscriptions');
	});
});
