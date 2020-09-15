# Edge-tools-IETF

I pity the tools!

![pity](pity.jpg)

# Description

A pretty simple Cloudflare Workers script to speed up access to resources on tools.ietf.org. For example, try visiting https://tools-ietf-org.lucaspardue.com/html/rfc7540 a couple of times with local caching disabled and see how much faster life can be when modern edge capabilities are harnessed.

Most paths on tools are probably supported but I've only supported viewing I-Ds and RFCs. Chances are other stuff could act funky, if so ping me and just fallback if needs be.

## Status and Detail

This is early days. So far the worker is hardcoded to:

1) Substitute for tools.ietf.org (tools-ietf-org.lucaspardue.com) or xml2rfc.tools.ietf.org (xml2rfc-tools-ietf-org.lucaspardue.com), and
2) Check the local edge cache for a copy and return it, or
3) Fetch the canonical copy from tools.ietf.org, rewrite some links to RFC editor documents, cache that version in the local edge cache.
4) Return the resource.

