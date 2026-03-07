# Contributing to Thinkport Corporate Identity

Thank you for your interest in contributing to the Thinkport Corporate Identity and Corporate Design repository!

## 🚨 Important Notice

**All changes to this repository require explicit permission from authorized maintainers.**

This repository contains official corporate identity materials that represent the Thinkport GmbH brand. Unauthorized modifications could lead to brand inconsistencies and confusion in the market.

**Remember:** This is not a typical open-source project. Changes require formal approval to maintain brand integrity.

## Who Can Approve Changes?

Only individuals or teams listed in the [CODEOWNERS](CODEOWNERS) file are authorized to approve and merge changes to this repository.

## When to Propose Changes

You may propose changes in the following situations:

1. **New Brand Assets** - Adding new approved logos, templates, or materials
2. **Updates to Guidelines** - Correcting or clarifying brand guidelines
3. **Technical Improvements** - Improving file formats, organization, or documentation
4. **Corrections** - Fixing errors in existing materials

## How to Propose Changes

1. **Contact Maintainers First**
   - Before making any changes, discuss your proposal with the maintainers
   - Explain why the change is necessary
   - Get preliminary approval before investing time in implementation

2. **Fork the Repository**
   - Create your own fork of the repository
   - Never push directly to the main branch

3. **Create a Feature Branch**

   ```bash
   git checkout -b feature/descriptive-name
   ```

4. **Make Your Changes**
   - Keep changes minimal and focused
   - Follow existing file naming conventions (see below)
   - Update documentation as needed
   - Maintain file organization structure
   - Test files before committing

5. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "Add [description of asset]"
   ```

6. **Push and Create Pull Request**

   ```bash
   git push origin feature/descriptive-name
   ```

   Then create a Pull Request on GitHub with:
   - A clear, detailed description of your changes
   - Explanation of the rationale behind the modifications
   - Reference to any related discussions or issues
   - Screenshots or previews when applicable
   - Before/after comparisons if applicable

7. **Wait for Review**
   - Authorized maintainers will review your pull request
   - Be prepared to make revisions based on feedback
   - Changes will only be merged after proper approval

## Repository Structure

When contributing, please follow the established directory structure:

```plaintext
thinkport.brand/
├── assets/                    # ALL assets (included in release ZIP)
│   ├── logos/                 # Logo files in various formats
│   ├── colors/                # Color palette definitions
│   │   ├── swatches/         # SVG color swatches
│   │   ├── colors.css        # CSS variables
│   │   ├── colors.json       # JSON definitions
│   │   └── README.md         # Color documentation
│   ├── fonts/                # Typography and font files
│   ├── templates/            # Document and presentation templates
│   └── guidelines/           # Brand guidelines and usage documentation
├── .github/                   # CI/CD workflows (not in release)
├── README.md                  # Main repository documentation
├── LICENSE                    # License file
└── [other repo files]         # Contributing, Usage, etc. (not in release)
```

## File Naming Conventions

Use consistent, descriptive names:

- Use lowercase with hyphens: `thinkport-logo-primary.svg`
- Include variation/type: `thinkport-logo-white.svg`
- Add resolution for rasters: `thinkport-logo@2x.png`
- Use descriptive suffixes: `thinkport-template-invoice.docx`

## Asset Requirements

### Logo Files

- ✓ Vector formats (SVG, AI, EPS) required
- ✓ Multiple variations (color, monochrome, white, black)
- ✓ Proper transparent backgrounds for PNG
- ✓ Minimum 300 DPI for print raster files

### Color Files

- ✓ Color definitions in multiple formats (ASE, CSS, JSON)
- ✓ Include HEX, RGB, and CMYK values
- ✓ Verify accessibility contrast ratios
- ✓ Test colors in both digital and print contexts

### Font Files

- ✓ Include license information
- ✓ Provide multiple formats (WOFF2, WOFF, TTF, OTF)
- ✓ Include all necessary weights and styles
- ✓ Create specimen sheets for reference

### Templates

- ✓ Use brand-approved colors and fonts
- ✓ Follow layout and spacing guidelines
- ✓ Include placeholder content
- ✓ Test templates before submitting
- ✓ Provide usage instructions if needed

## Documentation Updates

When adding assets, update:

- Directory README files
- Main documentation (if new asset type)
- Guidelines (if affecting usage rules)
- Main README.md (if structural changes)

## What Will Be Rejected

Pull requests will be rejected if they:

- Lack proper authorization or approval
- Modify brand assets without proper documentation
- Do not follow the repository structure
- Include low-quality or inappropriate materials
- Violate brand guidelines
- Are submitted without prior discussion

## Review Process

All submissions will be reviewed for:

1. **Quality**: Files meet professional standards
2. **Compliance**: Assets follow brand guidelines
3. **Organization**: Proper directory and naming
4. **Documentation**: Adequate explanations provided
5. **Licensing**: Proper rights and permissions

## Questions?

If you have questions about contributing or need clarification on the process:

1. Check the repository README and documentation
2. Review the CODEOWNERS file for contact information
3. Open an issue to discuss your proposal before creating a pull request

If you're unsure about:

- Where to place a file
- How to name something
- Whether an asset meets guidelines
- Licensing or usage rights

Please open an issue or contact the brand team before submitting.

## Code of Conduct

- Be respectful and professional in all communications
- Understand that brand consistency is critical
- Follow brand guidelines
- Maintain quality standards
- Accept that not all proposals will be accepted
- Follow the approval process without exception
- Help others learn and contribute
- Report issues constructively

---

Thank you for helping maintain and improve the Thinkport brand assets!
