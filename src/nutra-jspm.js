import JSPM from 'jspm'

const moduleloader = (events, system, opts) => {
    if (typeof opts.packagePath !== 'string') {
        opts.packagePath = '.'
    }
    JSPM.setPackagePath(opts.packagePath)
    const systemJS = new JSPM.Loader()
    const systemInstantiate = SystemJS.instantiate
    systemJS.instantiate = function (load) {
        const filename = load.address.replace('file://', '')
        if (system.files.includes(filename)) {
            load.source = system.callbacks.onFileSourceLoaded(load.source, filename)
        }
        return systemInstantiate.call(systemJS, load)
    }
    events.onLoad = () => {
        return Promise.all(system.files.map(file => systemJS.import(file)))
        .catch(e => system.handleError(e))
    }
    events.onExit = () => {}
}

export { moduleloader }
