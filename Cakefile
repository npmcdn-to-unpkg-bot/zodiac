

fs            = require 'fs'
{spawn, exec} = require 'child_process'
Browserify    = require 'browserify'
Coffeeify     = require 'coffeeify'
Watchify      = require 'watchify'
UglifyJS      = require 'uglify-js'

mkopts = (str, r={}) -> r[s] = true for s in str.split(' '); r

DEFAULT_OPTS =
  browserify:   {debug: true, extensions: ['.coffee']}
  watchify:     {cache: {}, packageCache: {}, plugin: [Watchify]}
  uglify:       mkopts 'mangle screw_ie8'

DEFAULT_OPTS.uglify.compress =
  mkopts 'sequences dead_code conditionals booleans ' +
         'unused if_return join_vars drop_console'

task "clean",  -> run 'rm pkg/*.js'

defTasks = (names, opts={}) ->
  for k, v of DEFAULT_OPTS
    opts[k] = v unless opts[k]?
  for name in names
    src = "src/#{name}.coffee"
    pkg = "pkg/#{name}"
    task "#{name}:build", -> build src, pkg, opts
    task "#{name}:auto",  ->
      opts.auto = true
      build src, pkg, opts
    task "#{name}:serve", ->
      express = require('express')
      app     = express()
      port    = 3000 or opts.port
      app.use express.static __dirname
      app.listen port
      console.log "Serving on localhost:#{port}"
      invoke "#{name}:auto"

defTasks ['zodiac', 'tests']

build = (entry, target, opts={}) ->
  opts = opts.browserify
  opts[k] = v for k, v of opts.watchify if opts.auto
  b = Browserify opts
  b.transform(Coffeeify)
  b.add entry
  cb = ->
    [plain, mini] = ["#{target}.js", "#{target}.min.js"]
    b.bundle (error, js) ->
      throw error if error?
      fs.writeFileSync plain, js
      fs.writeFileSync mini, UglifyJS.minify(plain, opts.uglify).code
      console.log "BUILD #{entry} -> #{target}"
  b.on 'update', cb if opts.auto
  cb()

run = (command, cb=null) ->
  cmd = spawn '/bin/sh', ['-c', command]
  cmd.stdout.on 'data', (data) -> process.stdout.write data
  cmd.stderr.on 'data', (data) -> process.stderr.write data
  process.on    'SIGHUP',      -> cmd.kill()
  cmd.on        'exit', (code) -> cb() if cb? and code is 0
