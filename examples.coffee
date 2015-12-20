return unless window?
require './src/template'

# TODO


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

window.example = (name) -> Zodiac.render Examples[name]
