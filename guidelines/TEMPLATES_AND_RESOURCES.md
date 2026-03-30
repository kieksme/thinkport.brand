# Templates and Official Resources

Links and references to official Thinkport templates and resources. Access may require company credentials.

## Presentations

- **Slide Master for PowerPoint** – Official MasterTemplate for presentations. Obtain the current MasterTemplate from the brand team or the company’s shared drive (e.g. OneDrive/SharePoint).
- **Company introduction (Kurze Firmenvorstellung)** – Short company intro deck or one-pager. An updated deck aligned with the current Corporate Design is available in this repository under `examples/powerpoint/thinkport-company-intro.pptx` and is showcased on the implementations page at `implementations/powerpoint-templates.html`. For the latest internal version, you can still obtain the MasterTemplate from the brand team or the company’s shared drive.

## Business letter (Geschäftsbrief DIN 5008)

Official business letter template compliant with DIN 5008:

- **Template (SharePoint):** [Thinkport Geschäftsbrief DIN 5008](https://futureconsultant.sharepoint.com/:w:/s/thinkport_company/IQAYj02PuUcTSYse_biuOxQBAazK3IIh8c1dofsB7UiOStc?e=Itd78H)
- **Repo static A4 letterhead PDF:** `assets/templates/letterhead-a4.pdf`
- **Repo source template (HTML):** `assets/templates/letterhead-a4.html`

Use this template for formal company correspondence. Log in with your company account if required.

To regenerate the repository PDF from the HTML template:

```bash
pnpm run generate:letterhead:pdf
```

## Other templates

For document templates, email footers, and other branded materials in this repository, see:

- [assets/templates/](../assets/templates/) – Templates included in this repo.
- Brand team or intranet – For the latest Slide Master, company intro, and letterhead.
- For **staff-specific assets** (avatars, business cards, iOS posters, vCards, portfolio PDFs, email footers) generated from the Thinkport People API, see the CLI workflow and usage description in [`USAGE.md`](../USAGE.md) (`pnpm generate:staff:assets` and related scripts).
