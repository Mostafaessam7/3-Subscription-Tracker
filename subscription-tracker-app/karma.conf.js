// إعدادات Karma (Test Runner) - بتشغّل كل ملفات *.spec.ts في src/ عن طريق Chrome Headless
//
// اتشال منها `@angular-devkit/build-angular` (من الـ frameworks ومن الـ plugins) لما المشروع
// اتنقل للـ builder الجديد `@angular/build:karma`. الحزمة القديمة اتشالت خالص، فالسطرين دول
// كانوا بيوقفوا التشغيل بـ "Cannot find module '@angular-devkit/build-angular/plugins/karma'".
// الـ builder الجديد بيوصّل الملفات المتبنية للـ Karma بنفسه، فمش محتاج framework/plugin زيادة.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {},
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/subscription-tracker-app'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    singleRun: true,
    restartOnFileChange: true
  });
};
