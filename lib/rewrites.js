const bodyRewrite = require('connect-body-rewrite');

/**
 * Create a global regex of a hostname
 * @param  {string} host
 * @return {RegExp} A global RegExp of the hostname
 */
function regexify (host) {
  // literal string replacement from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  let cleanedHost = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(cleanedHost, 'g');
}

/**
 * Globally replace a string
 * @param  {string} content rewrite this
 * @param  {string} search  search for this within the content
 * @param  {string} replace replace any matches with this
 * @return {string}         The rewritten content
 */
function rewrite (content, search, replace) {
  let result = content;
  if (content && 'string' === typeof content) {
    result = content.replace(regexify(search), replace);
  }
  return result;
}

/**
 * Creates a middleware callback ready to rewrite the header
 * @param  {string} headerKey rewrite this header if it exists
 * @param  {string} search    search for this within the header value
 * @param  {string} replace   replace any matches with this
 * @return {Function} a middleware filter
 */
function rewriteHeader (headerKey, search, replace) {
  return function (proxyRes, req, res, options) {
    let headers = proxyRes.headers;
    if (headerKey && headers[headerKey]) {
      headers[headerKey] = rewrite(headers[headerKey], search, replace);
    }
  };
}

/**
 * Creates a middleware callback ready to rewrite the body.
 * @param  {string} search search for this within the response body
 * @param  {string} replace replace any matches with this
 * @return {Function} a middleware filter
 */
function rewriteBody (search, replace) {
  return bodyRewrite({
    accept: function (req, res) {
      let result = false;
      if ((res.getHeader('content-type') &&
        res.getHeader('content-type').match(/text\//)) ||
        (req.headers['accept'] &&
        req.headers['accept'].match(/text\//))
      ) {
        result = true;
      }
      return result;
    },
    rewrite: function (body) {
      return rewrite(body, search, replace);
    }
  });
}

module.exports = {
  regexify,
  rewrite,
  rewriteHeader,
  rewriteBody
};
