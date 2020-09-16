async function handleRequest(event) {
  let url = new URL(event.request.url);
  
  let pattern = /(tools-ietf-org|xml2rfc-tools-ietf-org|www-rfc-editor-org|tools-ietf-production).(lucaspardue.com|lucas.worker.dev)/;

  const found = url.hostname.match(pattern);

  if (!found) {
    const init = { "status" : 404 , "statusText" : "Thingie not found!" };
    return new Response(init);
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
  let cache = caches.default  
  response = await cache.match(event.request)

  if (!response) {
    response = await fetch(url,event.request);

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
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
      element.setAttribute(
        this.attributeName,
        attribute.replace('www.rfc-editor.org/info', 'tools-ietf-org.lucaspardue.com/html')
      )
    }
  }
}

const rewriter = new HTMLRewriter()
  .on('a', new AttributeRewriter('href'))
  .on('img', new AttributeRewriter('src'))
  //.on('pre', new ElementHandler())

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
    //.on('img', new AttributeRewriter('src'))
    //.on('pre', new ElementHandler())

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})