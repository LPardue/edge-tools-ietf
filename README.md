# Edge-tools-IETF

I pity the tools!

![pity](pity.jpg)

# Description

A pretty simple Cloudflare Workers script to speed up access to resources on tools.ietf.org and www.rfc-editor.org. For example, try visiting https://tools-ietf-org.lucaspardue.com/html/rfc7540 a couple of times with local caching disabled and see how much faster life can be when modern edge capabilities are harnessed.

# Converting hosts

All you need to do is take a hostname, convert the dots to hyphens and append lucaspardue.com. Any path after that should work. The follow table lists supported substitute hosts

| Original  | Substitute  |
|---|---|
| tools.ietf.org | tools-ietf-org.lucaspardue.com |
| xml2rfc.tools.ietf.org | xml2rfc-tools-ietf-org.lucaspardue.com |
| www.rfc-editor.org  | www-rfc-editor-org.lucaspardue.com  |


Most paths on tools are probably supported but I've only tested viewing I-Ds and RFCs. Chances are other stuff could act funky, if so ping me and just fallback if needs be.

## Status and Detail

This is early days. So far the worker is hardcoded to:

1) Do reverse substitution using the details above.
2) Check the local edge cache for a copy and return it, or
3) Fetch the canonical copy from origin, rewrite some things (like links to RFC editor documents_, cache that version in the local edge cache.
4) Return the resource.
