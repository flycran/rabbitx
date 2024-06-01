import * as Browser from 'webextension-polyfill'

Browser.devtools.panels.create(
  'Rabbitx', // title
  'icons/16.png', // icon
  'src/entries/devtools/index.html', // content
)
