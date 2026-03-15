# Avatar source portraits

Place portrait images (PNG or JPG) here to generate sample avatars.

The implementations/avatars example page is intended to show **Tobias Drexler's portrait**. Generate those example avatars (generic filenames in `examples/avatars/`) via:

```bash
pnpm run generate:staff:assets --slug tobias
```

(Requires API credentials in `.env`.)

Alternatively, put portrait files here and run:

```bash
pnpm run generate:avatar:samples
```

Generated avatars are written to `examples/avatars/`. Files with `tschoene` in the filename are excluded.
