angular.module('lib.decorators', [])
    .config(['$provide', function($provide){
      
      $provide.decorator('$rootScope', ['$delegate', function($rootScope) {
        var _proto
          , _new
          , nextUid = function() {
              return ++$rootScope.$id;
            }
          , Scope = function() {
              this.$id = nextUid();
              this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
              this.$root = this;
              this.$$destroyed = false;
              this.$$listeners = {};
              this.$$listenerCount = {};
              this.$$isolateBindings = null;
            };
 
        _proto = Object.create(Object.getPrototypeOf($rootScope));
        Scope.prototype = _proto;
 
        _new = function(isolate, parent) {
         var child;
 
          parent = parent || this;
 
          if (isolate) {
            child = new Scope();
            child.$root = this.$root;
          } else {
            // Only create a child scope class if somebody asks for one,
            // but cache it to allow the VM to optimize lookups.
 
            if(!this.$$ChildScope) {
              this.$$ChildScope = function ChildScope() {
                this['$$watchers'] = this['$$nextSibling'] = this['$$childHead'] = this['$$childTail'] = null;
                this['$$listeners'] = {};
                this['$$listenerCount'] = {};
                this['$id'] = nextUid();
                this['$$ChildScope'] = null;
              };
              this['$$ChildScope'].prototype = this;
            }
            child = new this.$$ChildScope();
          }
          child['$parent'] = parent;
          child['$$prevSibling'] = parent.$$childTail;
          if (parent.$$childHead) {
            parent.$$childTail.$$nextSibling = child;
            parent.$$childTail = child;
          } else {
            parent.$$childHead = parent.$$childTail = child;
          }
 
          // When the new scope is not isolated or we inherit from `this`, and
          // the parent scope is destroyed, the property `$$destroyed` is inherited
          // prototypically. In all other cases, this property needs to be set
          // when the parent scope is destroyed.
          // The listener needs to be added after the parent is set
          if (isolate || parent != this) {
            child.$on('$destroy', destroyChild);
          }
 
          return child;
 
          function destroyChild() {
            child.$$destroyed = true;
          }
        };
 
        $rootScope.$new = _new;
        return $rootScope;
      }]);
 
    }]);