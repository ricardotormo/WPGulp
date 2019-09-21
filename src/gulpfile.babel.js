/**
 * Gulpfile.
 *
 * Gulp with WordPress.
 *
 * Implements:
 *      1. Live reloads browser with BrowserSync.
 *      2. CSS: Sass to CSS conversion, error catching, Autoprefixing, Sourcemaps,
 *         CSS minification, and Merge Media Queries.
 *      3. JS: Concatenates & uglifies Vendor and Custom JS files.
 *      4. Images: Minifies PNG, JPEG, GIF and SVG images.
 *      5. Watches files for changes in CSS or JS.
 *      6. Watches files for changes in PHP.
 *      7. Corrects the line endings.
 *      8. InjectCSS instead of browser page reload.
 *      9. Generates .pot file for i18n and l10n.
 *
 * @tutorial https://github.com/ahmadawais/WPGulp
 * @author Ahmad Awais <https://twitter.com/MrAhmadAwais/>
 */

/**
 * Load WPGulp Configuration.
 *
 * TODO: Customize your project in the wpgulp.js file.
 */
const config = require('./wpgulp.config.js');

/**
 * Load Plugins.
 *
 * Load gulp plugins and passing them semantic names.
 */
const gulp = require('gulp'); // Gulp of-course.

// CSS related plugins.
const sass = require('gulp-sass'); // Gulp plugin for Sass compilation.
const minifycss = require('gulp-uglifycss'); // Minifies CSS files.
const autoprefixer = require('gulp-autoprefixer'); // Autoprefixing magic.
const mmq = require('gulp-merge-media-queries'); // Combine matching media queries into one.
const rtlcss = require('gulp-rtlcss'); // Generates RTL stylesheet.

// JS related plugins.
const concat = require('gulp-concat'); // Concatenates JS files.
const uglify = require('gulp-uglify'); // Minifies JS files.
const babel = require('gulp-babel'); // Compiles ESNext to browser compatible JS.
const clean = require('gulp-clean'); // Clean destination folder
const newfile = require('gulp-file'); // Create a new file
const selfExecute = require('gulp-self-execute'); // Wraps into self executing function
// Image related plugins.
const imagemin = require('gulp-imagemin'); // Minify PNG, JPEG, GIF and SVG images with imagemin.

// Utility related plugins.
const rename = require('gulp-rename'); // Renames files E.g. style.css -> style.min.css.
const lineec = require('gulp-line-ending-corrector'); // Consistent Line Endings for non UNIX systems. Gulp Plugin for Line Ending Corrector (A utility that makes sure your files have consistent line endings).
const filter = require('gulp-filter'); // Enables you to work on a subset of the original files by filtering them using a glob.
const sourcemaps = require('gulp-sourcemaps'); // Maps code in a compressed file (E.g. style.css) back to it’s original position in a source file (E.g. structure.scss, which was later combined with other css files to generate style.css).
const notify = require('gulp-notify'); // Sends message notification to you.
const browserSync = require('browser-sync').create(); // Reloads browser and injects CSS. Time-saving synchronized browser testing.
const wpPot = require('gulp-wp-pot'); // For generating the .pot file.
const sort = require('gulp-sort'); // Recommended to prevent unnecessary changes in pot-file.
const cache = require('gulp-cache'); // Cache files in stream for later use.
const remember = require('gulp-remember'); //  Adds all the files it has ever seen back into the stream.
const plumber = require('gulp-plumber'); // Prevent pipe breaking caused by errors from gulp plugins.
const beep = require('beepbeep');
const mkdirp = require('mkdirp');
const fileExists = require("file-exists");
const filesExist = require("files-exist");
var glob = require("glob")

/**
 * Custom Error Handler.
 *
 * @param Mixed err
 */
const errorHandler = r => {
	notify.onError('\n\n❌  ===> ERROR: <%= error.message %>\n')(r);
	beep();

	// this.emit('end');
};

/**
 * Task: `browser-sync`.
 *
 * Live Reloads, CSS injections, Localhost tunneling.
 * @link http://www.browsersync.io/docs/options/
 *
 * @param {Mixed} done Done.
 */
const browsersync = done => {
	browserSync.init({
		proxy: config.projectURL,
		open: config.browserAutoOpen,
		injectChanges: config.injectChanges,
		port: config.port,
		watchEvents: ['change', 'add', 'unlink', 'addDir', 'unlinkDir']
	});
	done();
};

// Helper function to remove cache
const requireUncached = (module) => {
	delete require.cache[require.resolve(module)]
	return require(module)
}

// Helper function to test if element is an array
const isArray = (el) => {
	return Array.isArray(el)
}

// Helper function emptyArray
const arrayHasEls = (arr) => {
	return arr.length > 0;
}

// Helper function to get all files from path 
// that let us to use wildcards as ex: ./path/*.js
const getFilesFromPath = (path) => {
	return new Promise((resolve, reject) => {
		glob(path, {}, function (err, files) {
			resolve(
				files
			)
		});
	});
}

// Helper function to allow browser reload with Gulp 4.
const reload = done => {
	browserSync.reload();
	done();
};

/**
 * Task: `onInstall`.
 *
 * Create assets folder and subfolders on installation
 * 
 */
gulp.task('onInstall', (done) => {
	const newFolder = {
		name: "assets",
		sub: [
			"img",
			"fonts",
			"js/custom",
			"js/vendor",
			"scss"
		]
	}
	newFolder.sub.forEach((f) => {
		mkdirp(`${newFolder.name}/${f}`, (err) => {
			if (err) console.error(`\n\n❌  ===> ERROR: ${err}\n`)
			else console.log(`\n\n✅  ===> Folder ${newFolder.name}/${f} created!\n`)
		});
	});

	const wpStyleInfo = `
	/*
	* Theme Name: My Timber Starter Theme
	* Description: Starter Theme to use with Timber
	* Author: Upstatement and YOU!
	*/`;

	// Create theme info file if doesn't exist
	fileExists('./assets/scss/wp-info.scss').then(exists => {
		if (!exists) {
			newfile('wp-info.scss', wpStyleInfo)
				.pipe(gulp.dest('assets/scss'))
				.pipe(notify({ message: '\n\n✅  ===> Wp style info scss — created!\n', onLast: true }));
		}
	})

	// Create style.scss if doesn't exist and inject partial info file
	fileExists('./assets/scss/style.scss').then(exists => {
		if (!exists) {
			newfile('style.scss', "@import 'wp-info';")
				.pipe(gulp.dest('assets/scss'))
				.pipe(notify({ message: '\n\n✅  ===> Wp style info scss — created!\n', onLast: true }));

		}
	})
	done();
})

/**
 * Task: `styles`.
 *
 * Compiles Sass, Autoprefixes it and Minifies CSS.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    3. Writes Sourcemaps for it
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix .min.css
 *    6. Minifies the CSS file and generates style.min.css
 *    7. Injects CSS or reloads the browser via browserSync
 */
gulp.task('styles', () => {
	return gulp
		.src(config.styleSRC, { allowEmpty: true })
		.pipe(plumber(errorHandler))
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				errLogToConsole: config.errLogToConsole,
				outputStyle: config.outputStyle,
				precision: config.precision
			})
		)
		.on('error', sass.logError)
		// https://github.com/ahmadawais/WPGulp/issues/130
		//.pipe(sourcemaps.write({ includeContent: false }))
		//.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(autoprefixer(config.BROWSERS_LIST))
		.pipe(sourcemaps.write('./'))
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.styleDestination))
		.pipe(filter('**/*.css')) // Filtering stream to only css files.
		.pipe(mmq({ log: true })) // Merge Media Queries only for .min.css version.
		.pipe(browserSync.stream()) // Reloads style.css if that is enqueued.
		.pipe(rename({ suffix: '.min' }))
		.pipe(minifycss({ maxLineLen: 10 }))
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.styleDestination))
		.pipe(filter('**/*.css')) // Filtering stream to only css files.
		.pipe(browserSync.stream()) // Reloads style.min.css if that is enqueued.
		.pipe(notify({ message: '\n\n✅  ===> STYLES — completed!\n', onLast: true }));
});

/**
 * Task: `stylesRTL`.
 *
 * Compiles Sass, Autoprefixes it, Generates RTL stylesheet, and Minifies CSS.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix -rtl and generates style-rtl.css
 *    6. Writes Sourcemaps for style-rtl.css
 *    7. Renames the CSS files with suffix .min.css
 *    8. Minifies the CSS file and generates style-rtl.min.css
 *    9. Injects CSS or reloads the browser via browserSync
 */
gulp.task('stylesRTL', () => {
	return gulp
		.src(config.styleSRC, { allowEmpty: true })
		.pipe(plumber(errorHandler))
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				errLogToConsole: config.errLogToConsole,
				outputStyle: config.outputStyle,
				precision: config.precision
			})
		)
		.on('error', sass.logError)
		.pipe(sourcemaps.write({ includeContent: false }))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(autoprefixer(config.BROWSERS_LIST))
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(rename({ suffix: '-rtl' })) // Append "-rtl" to the filename.
		.pipe(rtlcss()) // Convert to RTL.
		.pipe(sourcemaps.write('./')) // Output sourcemap for style-rtl.css.
		.pipe(gulp.dest(config.styleDestination))
		.pipe(filter('**/*.css')) // Filtering stream to only css files.
		.pipe(browserSync.stream()) // Reloads style.css or style-rtl.css, if that is enqueued.
		.pipe(mmq({ log: true })) // Merge Media Queries only for .min.css version.
		.pipe(rename({ suffix: '.min' }))
		.pipe(minifycss({ maxLineLen: 10 }))
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.styleDestination))
		.pipe(filter('**/*.css')) // Filtering stream to only css files.
		.pipe(browserSync.stream()) // Reloads style.css or style-rtl.css, if that is enqueued.
		.pipe(notify({ message: '\n\n✅  ===> STYLES RTL — completed!\n', onLast: true }));
});

/**
 * Task: `vendorJS`.
 *
 * Concatenate and uglify vendor JS scripts.
 *
 * This task does the following:
 *     1. Gets the source folder for JS vendor files
 *     2. Concatenates all the files and generates vendors.js
 *     3. Renames the JS file with suffix .min.js
 *     4. Uglifes/Minifies the JS file and generates vendors.min.js
 */
gulp.task('vendorJS', (done) => {
	const config = requireUncached('./wpgulp.config.js');

	// If no vendor don't do anything and inform the user about it
	if (!(isArray(config.jsVendorSRC) && arrayHasEls(config.jsVendorSRC))) {
		console.log('\n\n❌  ===> NO EXISTING VENDORS IN VENDORS ARRAY, NO VENDOR GENERATION \n')
		done();
		return;
	}
	return gulp
		.src(config.jsVendorSRC) // Only run on changed files.
		.pipe(plumber(errorHandler))
		.pipe(
			babel({
				presets: [
					[
						'@babel/preset-env', // Preset to compile your modern JS to ES5.
						{
							targets: { browsers: config.BROWSERS_LIST } // Target browser list to support.
						}
					]
				]
			})
		)
		.pipe(concat(config.jsVendorFile + '.js'))
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.jsVendorDestination))
		.pipe(
			rename({
				basename: config.jsVendorFile,
				suffix: '.min'
			})
		)
		.pipe(uglify())
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.jsVendorDestination))
		.pipe(notify({ message: '\n\n✅  ===> VENDOR JS — completed!\n', onLast: true }));
});

/**
 * Task: `cleanDistFolder`.
 *
 * Clean destination vendors folder.
 * 
 */

gulp.task('cleanDistFolder', function (done) {

	const config = requireUncached('./wpgulp.config.js');

	const url = {
		vendor: {
			js: `${config.jsVendorDestination}${config.jsVendorFile}.js`,
			jsMin: `${config.jsVendorDestination}${config.jsVendorFile}.min.js`
		},
		custom: {
			js: `${config.jsCustomDestination}${config.jsCustomFile}.js`,
			jsMin: `${config.jsCustomDestination}${config.jsCustomFile}.min.js`
		}
	}
	return gulp.src([url.vendor.js, url.vendor.jsMin, url.custom.js, url.custom.jsMin], { allowEmpty: true })
		.pipe(clean({ force: true }))
		.pipe(notify({ message: '\n\n✅  ===> CLEAN JS DIST FOLDER — completed!\n', onLast: true }));
});

gulp.task('cleanDistCustom', function (done) {

	const config = requireUncached('./wpgulp.config.js');

	const customDistFiles = [
		`${config.jsCustomDestination}${config.jsCustomFile}.js`,
		`${config.jsCustomDestination}${config.jsCustomFile}.min.js`
	]

	return gulp.src(customDistFiles, { allowEmpty: true })
		.pipe(clean({ force: true }))
		.pipe(notify({ message: '\n\n✅  ===> CLEAN JS DIST FOLDER — completed!\n', onLast: true }));
});

gulp.task('cleanDistVendor', function (done) {

	const config = requireUncached('./wpgulp.config.js');

	const vendorDistFiles = [
		`${config.jsVendorDestination}${config.jsVendorFile}.js`,
		`${config.jsVendorDestination}${config.jsVendorFile}.min.js`
	];

	return gulp.src(vendorDistFiles, { allowEmpty: true })
		.pipe(clean({ force: true }))
		.pipe(notify({ message: '\n\n✅  ===> CLEAN JS DIST FOLDER — completed!\n', onLast: true }));
});


/**
 * Task: `customJS`.
 *
 * Concatenate and uglify custom JS scripts.
 *
 * This task does the following:
 *     1. Gets the source folder for JS custom files
 *     2. Concatenates all the files and generates custom.js
 *     3. Renames the JS file with suffix .min.js
 *     4. Uglifes/Minifies the JS file and generates custom.min.js
 */
gulp.task("customJS", (done) => {
	const config = requireUncached('./wpgulp.config.js');

	// If no vendor don't do anything and inform the user about it
	if (!(isArray(config.jsCustomSRC) && arrayHasEls(config.jsCustomSRC))) {
		console.log('\n\n❌  ===> NO EXISTING CUSTOM IN CUSTOM ARRAY, NO CUSTOM GENERATION \n')
		done();
		return;
	}

	gulp
		.src(filesExist(config.jsCustomSRC))
		.pipe(sourcemaps.init())
		.pipe(plumber(errorHandler))
		.pipe(
			babel({
				presets: [
					[
						'@babel/preset-env', // Preset to compile your modern JS to ES5.
						{
							targets: { browsers: config.BROWSERS_LIST } // Target browser list to support.
						}
					]
				],
			})
		)
		.pipe(selfExecute())
		.pipe(concat(config.jsCustomFile + '.js'))
		.pipe(sourcemaps.write())
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.jsCustomDestination))
		.pipe(
			rename({
				basename: config.jsCustomFile,
				suffix: '.min'
			})
		)
		.pipe(uglify())
		.pipe(lineec()) // Consistent Line Endings for non UNIX systems.
		.pipe(gulp.dest(config.jsCustomDestination))
		.pipe(notify({ message: '\n\n✅  ===> CUSTOM JS — completed!\n', onLast: true }));
	done();
})

/**
 * Task: `images`.
 *
 * Minifies PNG, JPEG, GIF and SVG images.
 *
 * This task does the following:
 *     1. Gets the source of images raw folder
 *     2. Minifies PNG, JPEG, GIF and SVG images
 *     3. Generates and saves the optimized images
 *
 * This task will run only once, if you want to run it
 * again, do it with the command `gulp images`.
 *
 * Read the following to change these options.
 * @link https://github.com/sindresorhus/gulp-imagemin
 */
gulp.task('images', () => {
	return gulp
		.src(config.imgSRC)
		.pipe(
			cache(
				imagemin([
					imagemin.gifsicle({ interlaced: true }),
					imagemin.jpegtran({ progressive: true }),
					imagemin.optipng({ optimizationLevel: 3 }), // 0-7 low-high.
					imagemin.svgo({
						plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
					})
				])
			)
		)
		.pipe(gulp.dest(config.imgDST))
		.pipe(notify({ message: '\n\n✅  ===> IMAGES — completed!\n', onLast: true }));
});

/**
 * Task: `clear-images-cache`.
 *
 * Deletes the images cache. By running the next "images" task,
 * each image will be regenerated.
 */
gulp.task('clearCache', function (done) {
	return cache.clearAll(done);
});

/**
 * WP POT Translation File Generator.
 *
 * This task does the following:
 * 1. Gets the source of all the PHP files
 * 2. Sort files in stream by path or any custom sort comparator
 * 3. Applies wpPot with the variable set at the top of this file
 * 4. Generate a .pot file of i18n that can be used for l10n to build .mo file
 */
gulp.task('translate', () => {
	return gulp
		.src(config.watchPhp)
		.pipe(sort())
		.pipe(
			wpPot({
				domain: config.textDomain,
				package: config.packageName,
				bugReport: config.bugReport,
				lastTranslator: config.lastTranslator,
				team: config.team
			})
		)
		.pipe(gulp.dest(config.translationDestination + '/' + config.translationFile))
		.pipe(notify({ message: '\n\n✅  ===> TRANSLATE — completed!\n', onLast: true }));
});

/**
 * Watch Tasks.
 *
 * Watches for file changes and runs specific tasks.
 */
gulp.task(
	'default',
	gulp.series('styles', 'cleanDistFolder', 'vendorJS', 'customJS', 'images', browsersync, () => {
		gulp.watch(config.watchPhp, reload); // Reload on PHP file changes.
		gulp.watch(config.watchStyles, gulp.parallel('styles', reload)); // Reload on SCSS file changes.
		gulp.watch(config.watchConfigFile, gulp.series('cleanDistVendor', 'vendorJS', reload)); // Reload on vendorJS file changes.
		gulp.watch([config.watchJsCustom, config.watchConfigFile], gulp.series('cleanDistCustom', 'customJS', reload)); // Reload on customJS file changes.
		gulp.watch(config.imgSRC, gulp.series('images', reload)); // Reload on customJS file changes.
	})
);