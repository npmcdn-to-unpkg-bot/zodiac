
log = console.log

fs            = require 'fs'
{spawn, exec} = require 'child_process'
Browserify    = require 'browserify'
Coffeeify     = require 'coffeeify'
Watchify      = require 'watchify'
UglifyJS      = require 'uglify-js'

mkopts = (str, r={}) -> r[s] = true for s in str.split(' '); r

# Config

BUILDS          = ['zodiac', 'tests']
BROWSERIFY      = {debug: true, extensions: ['.coffee']}
WATCHIFY        = {cache: {}, packageCache: {}, plugin: [Watchify]}
UGLIFY          = mkopts 'mangle screw_ie8'
UGLIFY.compress = mkopts 'sequences dead_code conditionals booleans ' +
                         'unused if_return join_vars drop_console'

defTasks = (name) ->
  task "#{name}:build",  -> make name, false
  task "#{name}:auto",   -> make name, true
  task "#{name}:clean",  -> run 'rm pkg/*.js'
  task "#{name}:serve", ->
    express = require('express')
    app     = express()
    port    = process.env.PORT || 4000
    app.use express.static __dirname
    app.listen 3000
    console.log 'Serving on localhost:3000'
    invoke "#{name}:auto"

defTasks build for build in BUILDS

make = (name, auto) ->
  build "src/#{name}.coffee", "pkg/#{name}", auto, -> console.log name

build = (entry, target, auto=false, onBuild) ->
  opts = BROWSERIFY
  opts[k] = v for k, v of WATCHIFY if auto
  b = Browserify opts
  b.transform(Coffeeify)
  b.add entry
  cb = ->
    [plain, mini] = ["#{target}.js", "#{target}.min.js"]
    b.bundle (error, js) ->
      throw error if error?
      fs.writeFileSync plain, js
      fs.writeFileSync mini, UglifyJS.minify(plain, UGLIFY).code
      onBuild() if onBuild?
  b.on 'update', cb if auto
  cb()

run = (command, cb=null) ->
  cmd = spawn '/bin/sh', ['-c', command]
  cmd.stdout.on 'data', (data) -> process.stdout.write data
  cmd.stderr.on 'data', (data) -> process.stderr.write data
  process.on    'SIGHUP',      -> cmd.kill()
  cmd.on        'exit', (code) -> cb() if cb? and code is 0
