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
 * Creates a proxyRes callback ready to rewrite the header
 * @param  {string} headerKey rewrite this header if it exists
 * @param  {string} search    search for this within the header value
 * @param  {string} replace   replace any matches with this
 * @return {Function} a proxyRes filter
 */
function rewriteHeader (headerKey, search, replace) {
  return function (proxyRes, req, res, options) {
    let headers = proxyRes.headers;
    if (headerKey && headers[headerKey]) {
      headers[headerKey] = rewrite(headers[headerKey], search, replace);
    }
    return true;
  };
}

/**
 * Creates a proxyReq callback ready to rewrite the path and query string
 * @param  {String} search  search for this within the path and query string
 * @param  {String} replace replace any matches with this
 * @return {Function} a proxyReq filter
 */
function rewritePath (search, replace) {
  return function (req, res) {
    req.url = rewrite(req.url, encodeURIComponent(search), encodeURIComponent(replace));
    return true;
  };
}

/**
 * Creates a proxyReq callback ready to rewrite POST form data
 * @param  {String} search  search for this within the POST form data
 * @param  {String} replace replace any matches with this
 * @return {Function} a proxyReq filter
 */
function rewritePostdata (search, replace) {
  return function (req, res) {
    if (Buffer.isBuffer(req.body)) {
      let result = rewrite(req.body.toString(), encodeURIComponent(search), encodeURIComponent(replace));
      req.body = Buffer.from(result);
    }
    return true;
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
  rewriteBody,
  rewriteHeader,
  rewritePath,
  rewritePostdata
};
