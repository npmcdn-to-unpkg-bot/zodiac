return unless window?
require './src/template'

# TODO

exports[1] = Z ul li 'hello!'
exports[2] = Z _if (-> Session.get('cond')), 'yes', _else, 'no'
exports[3] = Z p _if (-> Session.get 'cond'), 'yes', _else, -> Session.get('text')

exports[4] = Z _unless (-> Session.get('cond')),
  p -> Session.get('text')
  _else
  p 'nope'

exports[5] = Z _each 'n', [1,2,3,4], hr()
exports[6] = Z _each 'n', [1,2,3,4], p -> @n()
exports[7] = Z ul _each 'n', (-> Session.get 'items'), li -> @n()
exports[8] = Z _if (-> true),
  p {class: 'greet'}, 'hello'
  _else
  p {class: 'bye'}, 'bye'

  _each 'n', (-> Session.get('items')),
    p class: 'poop', -> console.log this; @n()
  hr()

  p {},
    'Greetings, '
    span class: 'name', -> Session.get('name')
    '! How is your adventure going?'
    ul {},
      li 'walk out door'
      li 'travel far'
      li 'come home wiser'
