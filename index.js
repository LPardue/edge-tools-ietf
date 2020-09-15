async function handleRequest(event) {
  let url = new URL(event.request.url);
  
  let pattern = /(tools-ietf-org|xml2rfc-tools-ietf-org|tools-ietf-production).(lucaspardue.com|lucas.worker.dev)/;

  const found = url.hostname.match(pattern);

  if (!found) {
    const init = { "status" : 404 , "statusText" : "Thingie not found!" };
    return new Response(init);
  }

  console.log(found);
  url.hostname = found[1].replaceAll('-','.');
  console.log(url.hostname);
  console.log(url);

  let response

  let cache = caches.default
  // try to find the cache key in the cache
  response = await cache.match(event.request)

  if (!response) {
    response = await fetch(url,event.request);

    let newResponse = rewriter.transform(response);

    event.waitUntil(cache.put(event.request, newResponse.clone()));
    return newResponse
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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})