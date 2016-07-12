import JSPM from 'jspm'
import InlineSourceMap from 'inline-source-map-comment'

function getOSFilePath(filename) {
    // might need to be more robust in the future
    return filename.replace('file://', '')
}

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
            let source = load.source
            if (load.metadata.sourceMap) {
                // keeping sourcesContent causes duplicate reports
                delete load.metadata.sourceMap.sourcesContent
                // this is the file being "instrumented"
                load.metadata.sourceMap.file = filename + '?in-memory'
                load.metadata.sourceMap.sources[0] = filename
                // removing "file://" from paths
                load.metadata.sourceMap.sources = load.metadata.sourceMap.sources.map(
                    filename => getOSFilePath(filename)
                )
                // inlined-sourceMap to be added to file
                source += '\n' + InlineSourceMap(load.metadata.sourceMap)
            }
            load.source = system.callbacks.onFileSourceLoaded(source, filename)
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
