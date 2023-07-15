var js2me = {
	debug: false,
	stat: 0,
	calledMethods: {},
	profile: false,
	storageName: '',
	libraryPath: 'js/me',
	constantPools: [], //only for memory profiling
	config: {
		app: true,
		engine: 'pumba', //zazu pumba timon
		selector: true,
		workers: false,
		midlet: 1,
		width: 240,
		height: 320
	}
};
