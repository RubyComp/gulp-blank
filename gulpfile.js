import gulp from 'gulp'
import clean from 'gulp-clean'
import pug from 'gulp-pug'
import connect from 'gulp-connect'
import livereload from 'gulp-livereload'
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import open from 'open';
import cleanCSS from 'gulp-clean-css';

const sass = gulpSass(dartSass);

const cleanDist = () => {
	return gulp.src('dist', {read: false, allowEmpty: true})
		.pipe(clean({force: true}))
}

const clear = gulp.parallel(cleanDist)

const compileSass = () => {
	return gulp.src('src/sass/app.scss')
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

const compilePug = () => {
	return gulp.src('src/pug/pages/**/*.pug')
		.pipe(pug())
		.pipe(gulp.dest('dist/'))
		.pipe(livereload())
}

const libs = () => {
	return gulp.src('src/lib/**/*')
		.pipe(gulp.dest('dist/lib/'))
		.pipe(livereload())
}

gulp.task('open-browser', function (done) {
	open('http://localhost:7070');
	done();
});

const buildAssets = gulp.parallel(minifyJs, compilePug, compileSass, copyFiles, copyPublic, libs)
const build = gulp.series(clear, buildAssets, 'open-browser')

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

export default gulp.series(build, watchFiles)
