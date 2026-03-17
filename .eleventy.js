const { DateTime } = require('luxon');
const sitemapPlugin = require('@quasibit/eleventy-plugin-sitemap');
const htmlmin = require('html-minifier-terser');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('style.css');
  eleventyConfig.addPassthroughCopy('styles.css');
  eleventyConfig.addPassthroughCopy('script.js');
  eleventyConfig.addPassthroughCopy('admin');
  eleventyConfig.addPassthroughCopy('robots.txt');
  eleventyConfig.addPassthroughCopy('sitemap.xml');
  eleventyConfig.addPassthroughCopy('_redirects');
  eleventyConfig.addPassthroughCopy('_headers');

  eleventyConfig.addFilter('postDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('dd LLL yyyy');
  });
  eleventyConfig.addFilter('slug', function (str) {
    return str.toLowerCase().replace(/\s+/g, '-');
  });
  eleventyConfig.addCollection('blog', function (collectionApi) {
    return collectionApi
      .getFilteredByGlob('blog/**/index.html')
      .sort((a, b) => b.date - a.date);
  });
  eleventyConfig.addCollection('allBlogCategories', function (collectionApi) {
    const posts = collectionApi.getFilteredByGlob('blog/**/index.html');
    const categories = new Set();
    posts.forEach((p) => {
      if (p.data.category) categories.add(p.data.category);
    });
    return [...categories];
  });
  eleventyConfig.addCollection('allBlogTags', function (collectionApi) {
    const posts = collectionApi.getFilteredByGlob('blog/**/index.html');
    const slugMap = new Map();
    posts.forEach((p) => {
      if (p.data.tags) p.data.tags.forEach((t) => {
        const slug = t.toLowerCase().replace(/\s+/g, '-');
        if (!slugMap.has(slug)) slugMap.set(slug, t);
      });
    });
    return [...slugMap.values()];
  });
  // htmlmin disabled — was mangling HTML structure and breaking mobile layouts
  // eleventyConfig.addTransform('htmlmin', function (content, outputPath) { ... });

  eleventyConfig.addPlugin(sitemapPlugin, {
    sitemap: {
      hostname: 'https://www.bharatlike.com',
    },
  });

  return {
    dir: {
      input: '.',
      includes: '_includes',
      output: '_site',
    },
  };
};
