/**
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2015, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

// TODO: (martin) I don't like that I have to create angular module in this file. The file should stand alone as separate library in the future. However it doesn't seems ES6 support e`xport` inside of `export default`..
const app = angular.module('ngDecorator', [
    // angular modules
    'ngAnimate',
    'ngMessages',

    // 3rd party modules
    'restangular',
    'ui.router',
    'ui.bootstrap',
    'LocalStorageModule',
    'jp.ng-bs-animated-button'
]);

function Run() {
    return function decorator(target) {
        app.run(target.runFactory);
    };
}

function Config() {
    return function decorator(target) {
        app.config(target.configFactory);
    };
}

function Service(options) {
    return function decorator(target) {
        app.service(options.serviceName, target);
    };
}

function Filter(filter) {
    return function decorator(target) {
        if (!filter.filterName) {
            throw new Error('@Filter() must contains filterName property!');
        }
        app.filter(filter.filterName, target.filterFactory);
    };
}

function Inject(...dependencies) {
    return function decorator(target, key, descriptor) {
        // if it's true then we injecting dependencies into function and not Class constructor
        if(descriptor) {
            const fn = descriptor.value;
            fn.$inject = dependencies;
        } else {
            target.$inject = dependencies;
        }
    };
}

function Component(component) {
    return function decorator(target) {
        if (typeof component !== 'object') {
            throw new Error('@Component() must be defined!');
        }

        if (target.$initView) {
            target.$initView(component.selector);
        }

        target.$isComponent = true;
    };
}

function View(view) {
    let options = view;
    const defaults = {
        template: view.template,
        restrict: 'E',
        scope: {},
        bindToController: true,
        controllerAs: 'vm'
    };
    return function decorator(target) {
        if (target.$isComponent) {
            throw new Error('@View() must be placed after @Component()!');
        }

        target.$initView = function(directiveName) {
            if (typeof directiveName === 'object') {
                options = directiveName;
                directiveName = pascalCaseToCamelCase(target.name);
            } else {
                directiveName = pascalCaseToCamelCase(directiveName);
            }
            options = options || (options = {});
            options.bindToController = options.bindToController || options.bind || {};

            app.directive(directiveName, function () {
                return Object.assign(defaults, { controller: target }, options);
            });
        };

        target.$isView = true;
    };
}

function Directive(options) {
    return function decorator(target) {
        const directiveName = dashCaseToCamelCase(options.selector);
        app.directive(directiveName, target.directiveFactory);
    };
}

function RouteConfig(stateName, options) {
    return function decorator(target) {
        app.config(['$stateProvider', ($stateProvider) => {
            $stateProvider.state(stateName, Object.assign({
                controller: target,
                controllerAs: 'vm'
            }, options));
        }]);
        app.controller(target.name, target);
    };
}

// Utils functions
function pascalCaseToCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
}

function dashCaseToCamelCase(string) {
    return string.replace( /-([a-z])/ig, function( all, letter ) {
        return letter.toUpperCase();
    });
}

export default app;
export {Component, View, RouteConfig, Inject, Run, Config, Service, Filter, Directive};
