
const diInfo = require('../lib/index.js');

describe('reporter', () => {

	it('is available via dependency injection', () => {
		const diEntry = diInfo['reporter:karma-jasmine'];
		expect(diEntry.length).toBe(2);
		expect(typeof diEntry[1]).toBe('function');
	});

	it('logs debug_url', () => {
		const logSpy = jasmine.createSpy('consoleLog', console.log);
		const originalLog = console.log;
		console.log = logSpy;
		const InjectKarmaJasmineReporter = diInfo['reporter:karma-jasmine'][1];
		const reporter = InjectKarmaJasmineReporter(false);
		reporter.onSpecComplete(/** ignored */undefined, {debug_url: 'hiya'});
		expect(logSpy).toHaveBeenCalledWith('Debug this test: hiya');
		console.log = originalLog;
	});

});