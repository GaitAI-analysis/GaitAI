# Public brand and privacy audit

Reviewed 13 October 2026. Scope: the public GaitAI website and its current public
repository. The GaitAI Care application and private Wiki were not modified.

## Published content

- Retained all eight paper records, the patent reference, 21 talk records,
  product specifications, research mappings and technical articles.
- Publications use title-led references with venue, publisher, year, research
  area, a scope summary and an official DOI, publisher catalogue or patent
  registry link. The existing unverified manuscript retains its qualification.
- Removed individual bylines, personal profile links, author-bearing paper
  scans and the patent certificate preview/download. Original documents were
  preserved outside the public repository without alteration.
- Updated research attribution in Publications, Research, the homepage,
  SecureVision, Investors, Labs Dataset, Trust Center and the shared footer.
  Talk titles, dates and venues remain; available official source links replace
  personal portfolio evidence. Lab image descriptions and an avatar filename
  are neutral; their visual content is unchanged.
- Search and Ask GaitAI contain no person profiles or academic author lists.
  Identity requests receive a fixed public-scope response in both the browser
  and hosted Worker, without invoking a model or echoing a supplied name.
- The README and copied audit metadata no longer publish personal attribution
  or author-machine paths. Historical image measurements and asset hashes were
  retained; snapshot checksums reflect only the redacted directory hint.
- Public administrator allowlists use digests of the same account addresses.
  Authorization requirements are unchanged. No Firebase rules deployment or
  backend data change is part of this release.

## Verification

- Production export: 154 HTML pages, 1,147 total files inspected, including
  metadata, JSON-LD, JavaScript, sitemap, generated knowledge and static assets.
  No matches for the audited identity, personal academic profile or attribution
  phrases. No academic PDFs are included in the public assets.
- Media: 630 images and 101 video frames (one per second across 17 videos)
  checked with local OCR; image/video metadata checked separately. No matching
  personal name or attribution text found. OCR is an automated check, not a
  guarantee against recognition errors.
- Internal links: 7,740 links and 142 distinct local asset references passed.
- Browser: 64 page/viewport/theme checks at 1440, 1280, 768 and 390 pixels,
  light and dark; publication grid/list/search/year filters and assistant
  scope responses passed, with no horizontal overflow or JavaScript errors.
- TypeScript, lint, data validation, research evidence, media integrity and
  product image audit passed. Assistant checks: 49 acceptance questions,
  63 ranking cases, 249 paraphrases, 15 probes and 133 Worker tests passed.
- Private Wiki export boundary: 49 content-free entry routes and 468 text
  assets passed. GaitAI Care and private Wiki source files are unchanged.

## External and historical exposure

Official publisher and patent registry records retain their original author and
rights-holder information. Those records and their citations were not altered.
The collection does not claim GaitAI authorship or ownership of these works.

Earlier Git commits retain personal author metadata (593 commits in the reviewed
main-branch history), and earlier content may remain in Git history, older build
artifacts, search indexes or third-party caches. This release does not rewrite
Git history or purge external caches. The current repository-owner profile had
no audited personal-name match in its public identity fields.

Pages deployment uses the existing GitHub Pages workflow. The public Ask GaitAI
Worker was redeployed with its existing configuration on 13 October 2026 so the
hosted assistant applies the same public scope; no billing, new service or
private Wiki deployment is required. Release commits for this work are authored
under the GaitAI-analysis account identity rather than a personal name; earlier
commit metadata is left as it is.
