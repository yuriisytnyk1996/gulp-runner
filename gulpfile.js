let preprocessor = 'scss';

// Визначаю константи Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Підключаю Browsersync, create() для створення нового підключення
const browserSync = require('browser-sync').create();

// Підключаю gulp-concat
const concat = require('gulp-concat');
 
// Підключаю gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Підключаю модуль gulp-sass
const sass = require('gulp-sass');

// Підключаю Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Підключаю модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Підключаю gulp-imagemin для роботи із зображеннями
const imagemin = require('gulp-imagemin');
 
// Підключаю модуль gulp-newer
const newer = require('gulp-newer');
 
// Підключаю модуль del
const del = require('del');

// Визначаю логіку роботи Browsersync
function browsersync() {
	browserSync.init({
		server: { baseDir: 'app/' },
		notify: false,
		online: true
	})
}

function scripts() {
	return src([ // Беру вихідні файли скриптів
		// 'node_modules/jquery/dist/jquery.min.js',
		'app/js/main.js'
	])
	.pipe(concat('main.min.js')) // Конкатеную в один файл
	.pipe(uglify()) // Стискаю JavaScript
	.pipe(dest('app/js/')) // Вивантажую готовий файл в папку призначення
	.pipe(browserSync.stream()) // Тригерю Browsersync для оновлення сторінки
}

function styles() {
	return src('app/scss/style.scss')
	.pipe(sass())
	.pipe(concat('style.min.css'))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Створюю префікси
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Мініфікую стилі
	.pipe(dest('app/css')) // Вивантажую результат в папку
	.pipe(browserSync.stream()) // Роблю інєкцію в браузер
}

function images() {
	return src('app/images/src/**/*')
	.pipe(newer('app/images/dest/'))
	.pipe(imagemin())
	.pipe(dest('app/images/dest'))
}

function cleanimg() {
	return del('app/images/dest/**/*', { force: true }) // Видаляю весь вміст папки
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	watch('app/**/' + preprocessor + '/**/*', styles);
	watch('app/images/src/**/*', images);
}

// Експортую функцію browsersync(), як таск browsersync. Значення після знака = це наявна функція
exports.browsersync = browsersync;

// Експортую функцію scripts() в таск scripts
exports.scripts = scripts;

// Експортую функцію styles() в таск styles
exports.styles = styles;

// Експорт функції images() в таск images
exports.images = images;

// Експорт функції cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Експортую дефолтний таск з необхідним набором функцій
exports.default = parallel(scripts, browsersync, startwatch);