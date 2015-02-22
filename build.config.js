'use strict';

module.exports = {
  build: {
    base: 'build/',
    maps: 'maps/',
    assets: 'build/assets/',
    fonts: 'build/fonts/'
  },
  src: {
    js: ['src/**/*.js'],
    tpl: ['src/**/*.tpl.html'],
    less: ['src/style.less', 'src/**/*.less'],
    index: 'src/index.html',
    assets: 'src/assets/**/*',
    cname: 'src/CNAME'
  },
  vendor: {
    css: [
    'vendor/fontawesome/css/font-awesome.css',
    'vendor/ng-tags-input/ng-tags-input.bootstrap.min.css'
    ]
  }
};