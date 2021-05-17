async function handleRequest(event) {
  let url = new URL(event.request.url);

  let pattern = /(datatracker-ietf-org|tools-ietf-org|xml2rfc-tools-ietf-org|www-rfc-editor-org|tools-ietf-production).(lucaspardue.com|lucas.workers.dev)/;

  const found = url.hostname.match(pattern);

  if (!found) {
    const init = { "status" : 404 , "statusText" : "Thingie not found!" };
    return new Response(init);
  }

  // If the page _really_ managed to request rfc-local.css, provide a
  // stub response. See `dumbCssRemover` later.
  if (url.pathname.endsWith("rfc-local.css")) {
    return new Response("/* Dummy CSS ... */", { headers: {"content-type": "text/css;charset=UTF-8",}, })
  }

  let rfcEditor = false;

  // RFC Editor url includes a freakin' hyphen
  if (found[1] == "www-rfc-editor-org") {
    url.hostname = "www.rfc-editor.org";
    rfcEditor = true;
  } else {
    url.hostname = found[1].replaceAll('-','.');
    transform = true;
  }

  let response

  // Try to find the cache key in the cache.
  // If it's not there, then we'll fetch it
  // and optionally transform.
  let cache = caches.default;
  response = await cache.match(event.request);
  if (response) {
    // Make the headers mutable by re-constructing the Response.
    response = new Response(response.body, response)
    response.headers.set("edge-tools-ietf", "from-cache");
  }

  if (!response) {
    // Look it up in the KV store
    console.log(url.toString());
    const value = await IETF.get(url.toString());
    if (value) {
      response = new Response(value, { headers: {"content-type": "text/html;charset=UTF-8", "edge-tools-ietf": "from-kv"}, })
      let newResponse = rewriter.transform(response);
      event.waitUntil(cache.put(event.request, newResponse.clone()));
      return newResponse
    }

    response = await fetch(url,event.request);
    // Make the headers mutable by re-constructing the Response.
    response = new Response(response.body, response)
    response.headers.set("edge-tools-ietf", "from-origin");

    if (rfcEditor == true) {
      if (url.pathname.endsWith(".json")) {
        event.waitUntil(cache.put(event.request, response.clone()));
        return response;
      }

      if (url.pathname == "/js/metadata.min.js") {
        let text = await response.text();
        let newResponse = new Response(text.replaceAll("https://www.rfc-editor.org", "https://www-rfc-editor-org.lucaspardue.com"), response);
        event.waitUntil(cache.put(event.request, newResponse.clone()));

        return newResponse;
      }

      let newResponse = rfcEfdRewriter.transform(response);

      event.waitUntil(cache.put(event.request, newResponse.clone()));
      return newResponse
    } else {
      if (event.request.method != "GET") {
        return response
      }

      // When hitting an I-D without a version, tools.ietf.org will return
      // a redirect. We'll rewrite the redirect URLs to point to the edge-tools.
      if (response.status == 302) {
        let loc = response.headers.get('Location');
        if (loc) {
          let newLoc = loc.replace('datatracker.ietf.org','datatracker-ietf-org.lucaspardue.com');
          response.headers.set('Location', newLoc);

          let newResponse = redirectRewriter.transform(response);
          event.waitUntil(cache.put(event.request, newResponse.clone()));
          return newResponse
        }
      }

      let newResponse = rewriter.transform(response);
      event.waitUntil(cache.put(event.request, newResponse.clone()));
      return newResponse
    }
  }

  return response
}

class AttributeRewriter {
  constructor(attributeName) {
	    this.attributeName = attributeName
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute) {
      let rfcEdRegex = /(?:www.)?rfc-editor.org/;
      let found = attribute.match(rfcEdRegex);

        if (found) {
          element.setAttribute(
            this.attributeName,
            attribute.replace(found, 'www-rfc-editor-org.lucaspardue.com')
          )
        }
    }
  }
}

class RedirectAttributeRewriter {
  constructor(attributeName) {
	    this.attributeName = attributeName
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName);

    if (attribute) {

          element.setAttribute(
            this.attributeName,
            attribute.replace('tools.ietf.org', 'tools-ietf-org.lucaspardue.com')
          )

    }
  }
}

class appendCSS {
	element(element){
		element.append(`
			<style>
			@media (prefers-color-scheme: dark){
				body {
					color: #eee;
					background: #121212;
				}
				.docinfo {
					background: #121212;
				}
        .table-striped {
          background: #1e1e1e;
        }
				a {
					color: #0ea7e7;
				}
			}
			</style>
		`, {html: true});
	}
}

const rewriter = new HTMLRewriter()
  .on('a', new AttributeRewriter('href'))
  .on('img', new AttributeRewriter('src'))
  .on('head', new appendCSS())

class RfcEdAttributeRewriter {
  constructor(attributeName) {
      this.attributeName = attributeName
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
      element.setAttribute(
        this.attributeName,
        attribute.replace('www.rfc-editor.org', 'www-rfc-editor-org.lucaspardue.com')
      )
    }
  }
}

const rfcEfdRewriter = new HTMLRewriter()
  .on('script', new RfcEdAttributeRewriter('src'))

class ElementRemover {
  constructor() {}

  element(element) {
      element.remove();
  }
}

const dumbCssRemover = new HTMLRewriter()
  .on('link[href="rfc-local.css"]', new ElementRemover());


const redirectRewriter = new HTMLRewriter()
  .on('a', new RedirectAttributeRewriter('href'))

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})