import { theme as antTheme, ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorBgBase: '#ffffff',
    colorPrimary: '#0078D7',
    colorInfo: '#0078D7',
    borderRadius: 3,
  },
  components: {
    Layout: {
      bodyBg: '#ffffff',
      headerBg: '#F7F7F7',
      headerPadding: '0 8px',
    },
  },
  cssVar: true,
  algorithm: antTheme.defaultAlgorithm,
}

export const darkTheme = {
  token: {
    colorBgBase: '#282828',
    colorPrimary: '#6e9edf',
    colorInfo: '#6e9edf',
    borderRadius: 3,
  },
  components: {
    Layout: {
      headerBg: '#333333',
      headerPadding: '0 8px',
    },
  },
  cssVar: true,
  algorithm: antTheme.darkAlgorithm,
}
