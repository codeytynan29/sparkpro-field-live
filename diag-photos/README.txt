DIAGNOSE STEP PHOTOS
====================

Drop step photos for the diagnostic tree in this folder.

Naming:   <node-id>-<step-number>.jpg      (e.g. nc-board-fuse-3.jpg)
Format:   JPG or WebP, ~1200px on the long edge, under ~300 KB each.
Shoot:    landscape, good light, the part centered and obvious.

To attach a photo to a step, open src/data/diagnosticTree.js, find the node,
and turn the step's string into an object:

  { text: 'Pull the fuse straight out and hold it up to the light…',
    img:  '/diag-photos/nc-board-fuse-3.jpg',
    alt:  'A purple 3A blade fuse held up to the light' }

The alt text doubles as the enlarged photo's caption — write it like you'd
describe the photo to someone on the phone. Everything else is automatic:
thumbnail under the step, tap to enlarge, search unaffected.
