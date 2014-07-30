var chai = require('chai'),
    chai_promise = require('chai-as-promised'),
    mockery = require('mockery'),
    path = require('path'),
    _path = path.join(__dirname, '../fixtures'),
    RootsUtil = require('roots-util'),
    h = new RootsUtil.Helpers({ base: _path }),
    roots_contentful = require('../../lib');

var should = chai.should();
chai.use(chai_promise);

global.should = should;
global.mockery = mockery;
global._path = _path;
global.h = h;
global.roots_contentful = roots_contentful;
