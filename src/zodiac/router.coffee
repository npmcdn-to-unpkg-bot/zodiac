
trimSlashes = (str) ->
  str.toString().replace /(\/+$)|(^\/+)/g, ''

interceptLocalClicks = (cb) ->
  document.addEventListener 'click', (e) ->
    if e.target.host == location.host
      cb e.target.href.replace(/^.*\/\/[^\/]+/, '')
      e.preventDefault()

# TODO: refactor, make sure hashchange works

# TODO: mountPath as parameter

R = require "./reactive"

class Path
  @Adapters:
    Hash: # hashchange
      kind:                   -> 'hash'
      defaults:               -> @hashPrefix or= "!-/"
      onChange:       (fn)    -> window.addEventListener "hashchange", fn

      localPrefix:            -> '#' + @hashPrefix
      absolutePrefix:         -> Zodiac.absoluteUrl '#' + @hashPrefix

      go:             (url)   -> location.hash = url
      redirect:       (url)   -> location.hash = url

      getTokens: ->
        pfx = @hashPrefix
        if location.hash.substring(1, 1 + pfx.length) == pfx
          return location.hash.substring(1 + pfx.length)
        else
          return ''

    History: # html5 pushState
      kind:                   -> 'history'
      defaults:               ->
      onChange:       (fn)    -> window.addEventListener "popstate", fn

      localPrefix:            -> "/"
      absolutePrefix:         -> Zodiac.absoluteUrl()

      go:             (url)   -> history.pushState    null, null, url
      redirect:       (url)   -> history.replaceState null, null, url

      getTokens: -> location.pathname.substring(1) + location.search

  class @Manager
    constructor: (adapter, opts={}) ->
      opts.separator or= "/"
      adapter.defaults.call opts
      @_adapter  = adapter
      @_opts     = opts
      @_pathDep = new R.Dependency()
      @_adapter.onChange => @_pathDep.changed()

    path_kind: -> @_adapter.kind()

    pathTokens: ->
      @_pathDep.depend()
      pathStr = @_adapter.getTokens.call(@_opts)
      return switch pathStr
        when ''         then []
        else
          trimSlashes(pathStr).split(@_opts.separator)

    join: (path) -> (path or @pathTokens()).join @_opts.separator

    _parse: (args) ->
      if not (args instanceof Array) then return [args]
      if args instanceof Array
        if (args.length == 1) and (args[0] instanceof Array)
          return args[0]
        else
          return args

    _sanitize: (args) ->
      # make it easier to use straight from spacebars. ugly.
      res = []
      for v in @_parse(args)
        res.push trimSlashes(v)
      return res

    _link:(path, pfx) ->
      path = @_sanitize(path)
      @_adapter[pfx].call(@_opts) + @join(path)

    # url helpers
    local:    (path...) -> @_link path, 'localPrefix'
    absolute: (path...) -> @_link path, 'absolutePrefix'
    public:   (path...) ->
      if @_opts.public? then @_opts.public(path...) else @absolute(path...)

    _go:  (path, method) ->
      @_adapter[method] @local(path...)
      @_pathDep.changed()

    go:       (path...)  -> @_go path, 'go'
    redirect: (path...)  -> @_go path, 'redirect'
    back:             -> window.history.back()

    _intercept: (cb) ->
      R.autorun =>
        if @pathTokens().length > 0 then cb @pathTokens()

  # Must only be called once. Sets up listeners, click interceptors and
  # whatever is needed to handle the path, and returns a RactivePath.Manager
  # that can be used to reactively get and set the path.
  constructor: (opts) ->
    @hash = new Router.Manager Router.Adapters.Hash,     opts
    @hist = new Router.Manager Router.Adapters.History,  opts
    @hash._opts.public = (tokens...) -> @hist.public(tokens...)
    
    if history.pushState?
      interceptLocalClicks (href) => @hist.go href
      @hash._intercept (path) => @hist.go path
      @hist._hash = @hash
      @manager = @hist
    else
      @hist._intercept (path) => window.location.href = "/" + @hash.local path
      @hash._hist = @hist
      @manager = @hash

  pathTokens: (args...) -> @manager.pathTokens  args...
  pathKind:   (args...) -> @manager.pathKind    args...
  local:      (args...) -> @manager.local       args...
  absolute:   (args...) -> @manager.absolute    args...
  public:     (args...) -> @manager.public      args...
  go:         (args...) -> @manager.go          args...
  redirect:   (args...) -> @manager.redirect    args...
  back:       (args...) -> @manager.back        args...


class Router extends Path

  constructor: (args...) ->
    @_vars     = {}
    @_varDeps  = {}
    super args...

  routes: (routeMap) ->
    @routeMap = routeMap
    @_computation.stop() if @_computation?
    @_computation = R.autorun =>
      newVars =  @_matcher(@pathTokens(), @routeMap, {})
      @_setVar k, v          for k, v of newVars
      @_setVar k, newVars[k] for k, v of @_vars

  _getDep: (key) ->
    @_varDeps[key] or= new R.Dependency
    @_varDeps[key]

  _setVar: (key, value) ->
    if value != @_vars[key]
      @_vars[key] = value
      @_getDep(key).changed()

  getVar: (key) ->
    @_getDep(key).depend()
    @_vars[key]

  _keyType: (key) ->
    key = key.toString() if key.toString?
    switch
      when key == '$'                                     then 'local'
      when key == '_'                                     then 'before'
      when key.length > 2 and key.substring(0, 2) == '$$' then 'glob'
      when key.length > 1 and key[0] == '$'               then 'capture'
      when typeof key == 'string'                         then 'plain'
      else 'invalid'

  # descends down the branches of the routeMap, while
  # consuming path fragments while populating the
  # params obejct.
  _matcher: (frags, branch, params) ->
    newParams = {}
    newParams[k] = v for k, v of params
    params = newParams

    runFn = (fn) -> fn.call params

    if typeof branch == 'function'
      if frags.length == 0
        runFn branch
        return params
      else return false

    # 1. run before filter
    if branch._? then runFn branch._

    if frags.length == 0
      # 2. run local
      if branch.$? and typeof branch.$ == 'function'
        runFn branch.$
      # 3. return params if exact match
      return params

    # 4. descend plain?
    if branch[frags[0]]?
      return @_matcher(frags.slice(1), branch[frags[0]], params)
    
    # 5. descend capture?
    for k, v of branch
      if @_keyType(k) == 'capture'
        params[k.substring(1)] = frags[0]
        return @_matcher frags.slice(1), v, params

    # 6. descend glob?
    for k, v of branch
      if @_keyType(k) == 'glob'
        params[k.substring(2)] = frags
        return @_matcher [], v, params

    # 7. no match
    return false

module.exports = Router
