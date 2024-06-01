var _browser
// eslint-disable-next-line no-undef
if (chrome) {
  // eslint-disable-next-line no-undef
  _browser = chrome
} else {
  let browser
  _browser = browser
}
_browser.devtools.panels.create(
  'Rabbitx', // title
  'icons/16.png', // icon
  'src/entries/devtools/index.html', // content
)
