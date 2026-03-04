# Sample Business Cards

This directory contains example business cards generated using the business card generator.

## Generating Sample Cards

To generate the sample business cards, run:

```bash
pnpm generate-samples
```

This will create PDF files for front and back sides of example business cards in this directory.

## Usage

The sample cards demonstrate different configurations:

1. **Max Mustermann** - Complete contact information with all fields
2. **Anna Schmidt** - Developer profile with GitHub social media
3. **Tom Weber** - Designer profile with minimal contact information

## Custom Cards

To generate your own business cards, use:

```bash
pnpm generate-card
```

This will prompt you interactively for all contact information and generate personalized business cards.

## Output Format

Each business card consists of two PDF files:

- `{name}-front.pdf` - Front side with contact information and logo
- `{name}-back.pdf` - Back side with QR code containing vCard data

These PDF files are also used directly by the `app/implementations/business-cards.html` page for the live previews and download links. After regenerating the samples, deploy the updated `examples/sample-business-cards` directory so the previews always reflect the latest design (including logo updates).

## QR Code

The QR code on the back of each card contains vCard (VCF) formatted contact data that can be scanned and imported directly into contact management applications.
