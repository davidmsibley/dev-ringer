# Dev Ringer
A reverse proxy for developers. Mirror an entire environment locally, then intercept the paths you want to develop on.

> **dead ringer:**
> *noun,* a person or thing that closely resembles another

## Installation
dev-ringer can be installed globally to use from the command line
```
npm install -g dev-ringer
```
or it can be installed in a node js project to be used programmatically.
```
npm install dev-ringer --save
```

## How to use
### From a HAR log file
To create a configuration from an existing site, you can use a network log from
Chrome Developer Tools called a HAR.

First start a new incognito window. Open up Dev Tools and go to the Network tab.
Make sure the `Preserve Log` checkbox is checked.

Navigate to your site, and simulate a user's workflow. For this example, I've
navigated to `www.example.com` and clicked on `More Information...`

Right click on any of the entries in the Network log and click
`Copy all as HAR`. Create a new file `example.har.json` with the contents of the
clipboard.

Note: The HAR contains all locations, headers, and request bodys sent and
received by your browser. If you sent any sensitive information, be sure to
clean the file before submitting to source control.

Now have dev-ringer create a DRP configuration from the HAR.
```
ringer -H example.har.json -o example.drp.json
```
* [example.har.json](docs/examples/example.har.json)
* [example.drp.json](docs/examples/example.drp.json)

dev-ringer will write out the configuration to the specified file, log it to
the console and start up a server based on that configuration.

```
Server listening at http://localhost:8081/ Press ^C to quit.
```

The initial server will be a straightforward passthrough to the hosts found in
the HAR. You can visit http://localhost:8081/

### From a DRP config file
You can run dev-ringer on a DRP config file by:
```
ringer -f example.drp.json
```

Note: If any hosts serve `https`, the proxy for that host will be `https` as
well. You will need to accept the self signed certificate that ships with
dev-ringer.

### Intercepting paths
The config file made in the last section can be edited to intercept requests
by path.

Here I'm intercepting everything under the `/web` path to be proxied to a
local dev server running on port 8080:
```javascript
"https://localhost:8445": {
  "proxyPaths": [
    {
      "path": "/web",
      "origin": "http://localhost:8080"
    },
    {
      "path": "*",
      "origin": "https://predev.my.wisc.edu"
    }
  ],
```
* [predev.drp.json](docs/examples/predev.drp.json)

## Configuration options
Under the proxy server's host, you may specify:
* `proxyPaths`
  - target hosts and the paths to trigger them.
* `locationRewrites`
  - Location header hosts to rewrite on redirect
* `contentRewrites`
  - content within the response body to rewrite
```javascript
{
  "entryPoint": "http://localhost:8081/",
  "servers": {
    "http://localhost:8081": {
      "proxyPaths": [
        {
          "path": "*",
          "origin": "http://www.example.com"
        }
      ],
      "locationRewrites": [
        {
          "search": "http://www.example.com",
          "replace": "http://localhost:8081"
        }
      ],
      "contentRewrites": [
        {
          "search": "http://www.example.com",
          "replace": "http://localhost:8081"
        }
      ]
    }
  }
}
```

The `*` denotes all paths. There is no glob matching at this time. There is
no path rewriting at this time as well. Any server that intercepts a path
should mimic the directory structure underneath that path.
