
# Contributing to `roots-contentful`

Hello there! First of all, thanks for being interested in this project and helping out. We all think you are awesome, and by contributing to open source projects, you are making the world a better place. That being said, there are a few ways to make the process of contributing code to this project smoother, detailed below:

### Filing Issues

If you are opening an issue about a bug, make sure that you include clear steps for how we can reproduce the problem. _If we can't reproduce it, we can't fix it_. If you are suggesting a feature, make sure your explanation is clear and detailed.

### Getting Set Up

- Clone the project down
- Make sure [nodejs](http://nodejs.org) has been installed and is above version `0.10.x`
- Run `npm install`
- Put in work

### `pre-commit` Linting

Provided dependencies are installed, `git commit` will
not work unless this project passes a linting check.

### Build Commands

> **Note:** if your environment does not support `make` utilities,
> replace `make` with `npm run` when you type a build command.

#### Testing

This project is constantly evolving, and to ensure that things are secure and working for everyone, we need to have tests. If you are adding a new feature, please make sure to add a test for it. The test suite for this project uses [AVA](https://github.com/sindresorhus/ava).

To lint the source:

```shell
$ make lint
```

To lint the source and run the tests:

```shell
$ make test
```

By default, tests will run concurrently/in parallel. When debugging, this can sometimes lead to unwanted behavior. For this reason, there is a `debug-test` command that will fail as soon as the first test fails, run tests serially, enable more verbose output and also log any HTTP requests:

```shell
$ make debug-test
```

To create a coverage report:

```shell
$ make coverage
```

To feed a coverage report to coveralls:

```shell
$ make coveralls
```

#### Building

> **Note:** Building the project will not work if any of the tests fail.

Building involves compiling the ES2016 syntax down to
regular ES5 using [Babel](http://babeljs.io). This command will run the tests - on success it will then compile the contents of `src/` into `lib/`.

```shell
$ make build
```

#### Publishing to NPM

This command will lint the project files, run the tests, build the project, publish the build to NPM and then perform a `git push --follow-tags`.

```shell
$ make release
```

A typical publish workflow might look something like this:

```shell
$ git checkout Fix/bug-fix
# add some code...
$ git add .
$ git commit -m "fixed a bug"
$ git checkout master
$ git merge Fix/bug-fix
$ npm version patch
$ make release
```

### Code Style

To keep a consistent coding style in the project, we're using [JavaScript Standard Style](https://github.com/feross/standard), with one difference being that much of this project uses `under_scores` rather than `camelCase` for variable naming. For any inline documentation in the code, we're using [JSDoc](http://usejsdoc.org/).

### Commit Cleanliness

It's ok if you start out with a bunch of experimentation and your commit log isn't totally clean, but before any pull requests are accepted, we like to have a nice clean commit log. That means [well-written and clear commit messages](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) and commits that each do something significant, rather than being typo or bug fixes.

If you submit a pull request that doesn't have a clean commit log, we will ask you to clean it up before we accept. This means being familiar with rebasing - if you are not, [this guide](https://help.github.com/articles/interactive-rebase) by github should help you to get started. And if you are still confused, feel free to ask!
