# Avatar source portraits

Place portrait images (PNG or JPG) here to generate sample avatars.

If the folder is empty, `pnpm run generate:avatar:samples` creates a neutral placeholder image and uses it for the sample output so you can test the pipeline without adding real portraits.

Run:

```bash
pnpm run generate:avatar:samples
```

Generated avatars will be written to `examples/avatars/`.

Files with `tschoene` in the filename are excluded from sample generation.
