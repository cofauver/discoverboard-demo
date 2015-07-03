'use strict';

/**
 * @ngdoc overview
 * @name mermooseFrontApp
 * @description
 * # mermooseFrontApp
 *
 * Main module of the application.
 */

/* global app:true */
var app = angular
  .module('mermooseFrontApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'mailchimp',
    'ui.bootstrap',
    'mobile-angular-ui',
    'textAngular',
    'angularPayments',
    'angular-inview',
    'lib.decorators'
  ]);

  app.config(function ($locationProvider, $routeProvider) {
    // Stripe.setPublishableKey('pk_test_6pRNASCoBOKtIshFeQd4XMUh');
    $locationProvider
      .html5Mode(true);
    $routeProvider
      .when('/',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/about',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })  
      .when('/account',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/account',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/account/tab/:tabString',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/account/tab/:tabString',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })     
      .when('/account/:userId/verify/:verifyKey',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/account/:userId/verify/:verifyKey',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/anonymous-posting',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/anonymous-posting',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/code/:inviteCodeToStore',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/code/:inviteCodeToStore',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/contact',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/contact',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/faq',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/faq',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/forgotPassword',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/forgotPassword',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/passwordResetToken/:resetToken',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/passwordResetToken/:resetToken',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/posts/:postId',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/posts/:postId',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/privacy',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/privacy',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/profile/:profileOwner',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/profile/:profileOwner',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/sign-in',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/sign-in',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/sign-up',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/sign-up',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/sign-up/email/:emailAddress/code/:inviteCode',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/sign-up/email/:emailAddress/code/:inviteCode',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/sign-up/email/:emailAddress',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/sign-up/email/:emailAddress',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/sign-up/code/:inviteCode',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/sign-up/code/:inviteCode',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/tos',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/tos',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/two-week-anonymous',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/two-week-anonymous',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/write-post',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/#/write-post',{
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
