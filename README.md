# Edge-tools-IETF

Speeding up access to resources on tools.ietf.org and www.rfc-editor.org.

I pity the tools!

![pity](pity.jpg)

# Description

A pretty simple Cloudflare Workers script to speed up access to resources on
tools.ietf.org and www.rfc-editor.org. Any path on those domains should work.

In my experience, the first load time for an RFC document on tools.ietf.org is
reduced from around 1.5 seconds down to 0.5 seconds). Subsequent loads are
reduced further to 0.05 seconds.

For example, try measuring and comparing load time of
https://tools.ietf.org/html/rfc7540 and
https://tools-ietf-org.lucaspardue.com/html/rfc7540 with local caching disabled
to see how much faster life can be when modern edge capabilities are harnessed.

# Speeding up Internet-Draft Builds

The speed advantages are nice for humans but also work well for machines. For
instance, if you're using [Martin Thomson's I-D
Template](https://github.com/martinthomson/i-d-template) then you'll be familiar
with turning source into IETF-formatted text, HTML or XML with


```sh
$ make
```

Under the hood, citation metadata is automatically fetched and written into the
output. Some metadata is fetched from the Web using HTTP and so it suffers from
slow access times. You can point the document generation instead at
edge-tools-ietf by passing an environment variable

```sh
$ XML_RESOURCE_ORG_PREFIX=https://xml2rfc-tools-ietf-org.lucaspardue.com/public/rfc make
```


# Converting Hosts

For now, the worker is hosted on my domain lucaspardue.com. To access these
sites proxied by these workers, all you need to do is take a hostname, convert
the dots to hyphens and append lucaspardue.com. The follow table lists supported
substitute hosts:

| Original  | Substitute  |
|---|---|
| tools.ietf.org | tools-ietf-org.lucaspardue.com |
| xml2rfc.tools.ietf.org | xml2rfc-tools-ietf-org.lucaspardue.com |
| www.rfc-editor.org  | www-rfc-editor-org.lucaspardue.com  |

Most paths on tools are probably supported but I've mainly focused on access to
HTML versions o Internet-Drats and RFCs. Chances are other stuff could act
funky, if so ping me and just fallback if needs be.

## Status and Detail

This is early days. So far the worker is hardcoded to:

1) Do reverse substitution using the details above.
2) Check the local edge cache for a copy and return it, or
3) Fetch the canonical copy from origin, rewrite some things (like links to RFC editor documents_, cache that version in the local edge cache.
4) Return the resource.
