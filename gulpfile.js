import gulp from 'gulp'
import clean from 'gulp-clean'
import pug from 'gulp-pug'
import connect from 'gulp-connect'
import livereload from 'gulp-livereload'
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import open from 'open';
import cleanCSS from 'gulp-clean-css';
import menuItems from './src/gulp-js/menu.js';
import {htmlValidator} from 'gulp-w3c-html-validator';
import index from 'gulp-index';

const sass = gulpSass(dartSass);

const cleanDist = () => {
	return gulp.src('dist', {read: false, allowEmpty: true})
		.pipe(clean({force: true}))
}

const clear = gulp.parallel(cleanDist)

const compileSass = () => {
	return gulp.src('src/sass/style.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(cleanCSS({ compatibility: 'ie8' }))
		.pipe(gulp.dest('dist/css'))
		.pipe(livereload())
}

const minifyJs = () => {
	return gulp.src('src/js/*.js')
		.pipe(gulp.dest('dist/js'))
		.pipe(livereload())
}

const copyFiles = () => {
	return gulp.src(['src/resources/**/*'], { base: 'src' })
		.pipe(gulp.dest('dist/'))
		.pipe(livereload())
}

const copyPublic = () => {
	return gulp.src('src/public/**/*', { base: 'src/public' })
		.pipe(gulp.dest('dist/'))
		.pipe(livereload())
}

// const copySwiper = () =>
// 	gulp.src([
// 		'node_modules/swiper/swiper-bundle.min.css',
// 		'node_modules/swiper/swiper-bundle.min.js',
// 		'node_modules/swiper/swiper-bundle.min.js.map'
// 	], { base: 'node_modules/swiper' })
// 		.pipe(gulp.dest('src/public/lib/swiper'))
// 		.pipe(livereload())

// const copyImask = () =>
// 	gulp.src([
// 		'node_modules/imask/dist/imask.min.js',
// 		'node_modules/imask/dist/imask.min.js.map'
// 	], { base: 'node_modules/imask' })
// 		.pipe(gulp.dest('src/public/lib/imask'))
// 		.pipe(livereload())

// export const copyNodeLibs = gulp.series(copySwiper, copyImask)

export const copySrcLibs = () =>
	gulp.src('src/lib/**/*')
		.pipe(gulp.dest('dist/lib/'))
		.pipe(livereload())

export const copyLibs = gulp.series(/* copyNodeLibs,  */copySrcLibs)

const compilePug = () => {
	return gulp.src('src/pug/pages/**/*.pug')
		.pipe(pug({
			locals: { menuItems },
			pretty: true
		}))
		.pipe(gulp.dest('dist/'))
		.pipe(livereload())
}

gulp.task('open-browser', function (done) {
	open('http://localhost:7070/_pages.html');
	done();
});

const buildAssets = gulp.parallel(
	minifyJs,
	compilePug,
	compileSass,
	copyFiles,
	copyPublic,
	copyLibs
)

export const validateHtml = () => {
	return gulp.src('dist/**/*.html')
		.pipe(htmlValidator.analyzer())
		.pipe(htmlValidator.reporter({ 
			throwErrors: process.env.CI ? true : false,
		}));
}


const watchFiles = () => {
	connect.server({
		root: 'dist',
		port: 7070,
		livereload: true
	})
	livereload.listen()
	gulp.watch('src/pug/**/*.pug', compilePug)
	gulp.watch('src/sass/**/*.scss', compileSass)
	gulp.watch('src/js/**/*.js', minifyJs)
	gulp.watch(['src/fonts/**/*', 'src/images/**/*'], copyFiles)
	gulp.watch('src/public/**/*', copyPublic)
}

const formatDate = (d) => {
	const pad = n => String(n).padStart(2, '0');
	return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} – ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const makeHtmlIndex = () => {
	const now = formatDate(new Date());

	return gulp.src([
		'dist/**/*.html',
		'!dist/**/_*.html',
		'!dist/**/partials/**',
		'!dist/**/includes/**',
		'!dist/_pages.html'
	], { nodir: true })
	.pipe(index({
		title: 'HTML Pages Index',
		outputFile: 'dist/_pages.html',
		relativePath: 'dist',
		pathDepth: 99,

		'prepend-to-output': () => `<!doctype html>
			<html lang="en">
			<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<title>HTML Pages Index</title>
			<style>
				body{background:steelblue; color:white; font:18px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;max-width:960px;margin:0 auto;}
				h1{font-size:20px;margin:0 0 12px;}
				h2{font-size:14px;opacity:.75;margin:20px 0 6px;}
				ul{margin:0;padding-left:20px;}
				li{margin:4px 0;}
				a{color:inherit; text-decoration:none;}
				.date{opacity:.75;font-size:12px;margin:0 0 16px;}
				.index__section{margin-bottom:12px;}
			</style>
			</head>
			<body>
		`,

		'append-to-output': () => `</body></html>`,

		'title-template': (title) => `<h1 class="index__title">${title}</h1><div class="date">Generated: ${now}</div>`,

		'section-template': (sectionContent) => `<section class="index__section">${sectionContent}</section>`,

		// 'section-heading-template': (heading) => `<h2 class="index__section-heading">/${heading || ''}</h2>
		'section-heading-template': () => '',

		'list-template': (listContent) => `<ul class="index__list">${listContent}</ul>`,

		'item-template': (filepath, filename) => {
			const raw = (filepath ? `${filepath}/${filename}` : filename);
			const href = raw.replace(/\\/g, '/');
			const label = href;
			return `<li class="index__item"><a class="index__item-link" href="./${href}">${label}</a></li>`;
		},

		'tab-depth': 0,
		'tab-string': '  ',
	}))
	.pipe(gulp.dest('.'));
}

const build = gulp.series(clear, buildAssets, validateHtml, makeHtmlIndex, 'open-browser')

export default gulp.series(build, watchFiles)
