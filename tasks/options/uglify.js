module.exports = function(config) {
  return {
    dest: {
      expand: true,
      src: ['**/*.js', '!config.js', '!app/dashboards/*.js', '!app/dashboards/**/*.js',],
      dest: '<%= destDir %>',
      cwd: '<%= destDir %>',
      options: {
        // quite: true,
        compress: {},
        preserveComments: false,
        banner: '<%= meta.banner %>'
      }
    }
  };
};