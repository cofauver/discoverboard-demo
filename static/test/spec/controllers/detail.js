'use strict';

describe('Controller: DetailCtrl', function () {

  // load the controller's module
  beforeEach(module('mermooseFrontApp'));

  var DetailCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('articles/').
          respond([{}]); // THE ANGULAR PHONECAT TUTORIAL HAS MORE IN THIS DIRECTION
    scope = $rootScope.$new();
    DetailCtrl = $controller('DetailCtrl', {
      $scope: scope
    });
  }));

  it('should have an article object with all of the necessary attributes defined', function () {
    expect(scope.article).toBeDefined();
    expect(scope.articleTitle).toBeDefined();
    expect(scope.articleText).toBeDefined();
    expect(scope.articleImage).toBeDefined();
  });
  it('should expect all of these attributes to be strings', function(){
    expect(typeof scope.article ).toBe('object');
    expect(typeof scope.articleTitle ).toBe('string');
    expect(typeof scope.articleText ).toBe('string');
    expect(typeof scope.articleImage ).toBe('string');
  });
  it('should be able to build an article from the input of the route provider' , function(){

  });
});
