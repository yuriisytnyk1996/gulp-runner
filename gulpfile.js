const { src, dest, parallel, series, watch } = require("gulp");
const babel = require("gulp-babel");
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const scss = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const svgSprite = require("gulp-svg-sprite");
const spritesmith = require("gulp.spritesmith");
const merge = require("merge-stream");
const svgmin = require("gulp-svgmin");
const cheerio = require("gulp-cheerio");
const replace = require("gulp-replace");
const newer = require("gulp-newer");
const modifyCssUrls = require("gulp-modify-css-urls");
const del = require("del");

function browsersync() {
  browserSync.init({
    server: { baseDir: "src/" },
    notify: false,
    online: true,
  });
}

function modifyUrls() {
  return src("src/css/**/*.css").pipe(
    modifyCssUrls({
      modify: function (url) {
        return url.replace(
          "../../assets/images/dest/",
          "../assets/images/dest/"
        );
      },
    })
  );
}

// function html() {
//   return src("src/pages/*.pug")
//     .pipe(plumber())
//     .pipe(
//       pug({
//         pretty: true,
//       })
//     )
//     .pipe(plumber.stop())
//     .pipe(dest("src/"));
// }

function scripts() {
  return src([
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/slick-slider/slick/slick.min.js",
    // "node_modules/svg4everybody/dist/svg4everybody.min.js",
    "src/js/main.js",
  ])
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(dest("src/js/"))
    .pipe(browserSync.stream());
}

function styles() {
  return src("src/scss/**/*.scss")
    .pipe(sourcemaps.init())
    .pipe(scss().on("error", scss.logError))
    .pipe(
      autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true })
    )
    .pipe(sourcemaps.write())
    .pipe(dest("src/css/"))
    .pipe(modifyUrls())
    .pipe(browserSync.stream());
}

function images() {
  return src("src/assets/images/src/**/*")
    .pipe(newer("src/assets/images/dest/"))
    .pipe(imagemin())
    .pipe(dest("src/assets/images/dest/"));
}

function svg() {
  return (
    src("src/assets/images/src/icons/*.svg")
      .pipe(
        svgmin({
          js2svg: {
            pretty: true,
          },
        })
      )
      // remove all fill, style and stroke declarations in out shapes
      .pipe(
        cheerio({
          run: function ($) {
            $("[fill]").removeAttr("fill");
            $("[stroke]").removeAttr("stroke");
            $("[style]").removeAttr("style");
          },
          parserOptions: { xmlMode: true },
        })
      )
      // cheerio plugin create unnecessary string '&gt;', so replace it.
      .pipe(replace("&gt;", ">"))
      // build svg sprite
      .pipe(
        svgSprite({
          mode: {
            symbol: {
              sprite: "../sprite.svg",
              render: {
                scss: {
                  dest: "../_sprite.scss",
                },
              },
            },
          },
        })
      )
      .pipe(dest("src/assets/images/dest/sprite/"))
  );
}

function generateSprite() {
  const spriteData = src("src/assets/sprite/*.*").pipe(
    spritesmith({
      imgName: "sprite.png",
      cssName: "_sprite.scss",
      imgPath: "../assets/images/dest/sprite.png",
      padding: 5,
    })
  );

  var imgStream = spriteData.img.pipe(dest("src/assets/images/dest"));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css.pipe(dest("src/scss/mixins"));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);
}

function cleanimg() {
  return del("src/assets/images/dest/**/*", { force: true });
}

function cleandist() {
  return del("dist/**/*", { force: true });
}

function buildcopy() {
  const allStreams = [
    src(["src/**/*.html"]).pipe(dest("dist")),

    src(["src/css/**/*.css"])
      .pipe(concat("style.min.css"))
      .pipe(
        cleancss({
          level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
        })
      )
      .pipe(dest("dist/css")),

    src(["src/js/**/*.min.js"]).pipe(dest("dist/js")),

    src(["src/assets/images/dest/*.*"], images).pipe(
      dest("dist/assets/images/dest")
    ),

    src(["src/assets/fonts/**/*"]).pipe(dest("dist/assets/fonts")),
  ];

  return merge.apply(this, allStreams);
}

function startwatch() {
  watch(["src/**/*.js", "!src/**/*.min.js"], scripts);

  watch("src/scss/**/*.scss", styles);

  watch("src/*.html").on("change", browserSync.reload);

  watch("src/assets/sprite/*.*", generateSprite);

  watch("src/assets/images/src/**/*", images);
}

exports.browsersync = browsersync;

// exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.images = images;

exports.svg = svg;

exports.cleanimg = cleanimg;
exports.cleandist = cleandist;

exports.build = series(cleandist, styles, scripts, generateSprite, buildcopy);

exports.default = parallel(styles, scripts, browsersync, startwatch);
