export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/store/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/exam/index',
    'pages/exam-play/index',
    'pages/exam-report/index',
    'pages/achievements/index',
    'pages/growth/index',
    'pages/parent/garden',
    'pages/parent/data',
    'pages/parent/approve',
    'pages/parent/profile',
    'pages/planet/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#667eea',
    navigationBarTitleText: 'EPC',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f5f5',
    enablePullDownRefresh: true,
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#667eea',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/images/tab-home.png',
        selectedIconPath: 'assets/images/tab-home-active.png'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务',
        iconPath: 'assets/images/tab-tasks.png',
        selectedIconPath: 'assets/images/tab-tasks-active.png'
      },
      {
        pagePath: 'pages/store/index',
        text: '商城',
        iconPath: 'assets/images/tab-store.png',
        selectedIconPath: 'assets/images/tab-store-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/images/tab-profile.png',
        selectedIconPath: 'assets/images/tab-profile-active.png'
      }
    ]
  }
})

function defineAppConfig(config: Record<string, any>) {
  return config
}
