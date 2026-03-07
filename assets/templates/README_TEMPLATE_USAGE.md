# README Template Usage Guide

This guide explains how to use the README template for Thinkport repositories.

## Overview

The README template (`README_TEMPLATE.md`) provides a standardized structure for all Thinkport repositories, ensuring consistent branding and documentation across projects.

## Quick Start

1. Copy `assets/templates/README_TEMPLATE.md` to your repository root as `README.md`
2. Replace all `{{VARIABLE}}` placeholders with your repository-specific content
3. Customize sections as needed while maintaining the overall structure

## Template Variables

The template uses the following placeholders that must be replaced:

### Required Variables

- `{{REPO_NAME}}` - Repository name (e.g., "thinkport.brand")
- `{{DESCRIPTION}}` - Short description of the repository
- `{{ORG}}` - GitHub organization or username (e.g., "thinkport")
- `{{PURPOSE}}` - Detailed purpose/overview of the repository
- `{{INSTALLATION}}` - Installation instructions
- `{{USAGE}}` - Usage instructions and examples
- `{{FEATURES}}` - List of key features
- `{{DOCUMENTATION}}` - Links to additional documentation
- `{{LICENSE}}` - License type (e.g., "GPL-3.0")

### Variable Replacement Examples

**Before:**
```markdown
# {{REPO_NAME}}

{{DESCRIPTION}}
```

**After:**
```markdown
# thinkport.brand

Repository to hold and share Corporate Identity and Corporate Design of Thinkport GmbH.
```

## Section Guidelines

### Header Section

The header should include:
- Repository name as H1
- Brief description (1-2 sentences)
- Download badge (if applicable)

### Download Assets Section

Use this section if your repository provides downloadable assets:
- Link to latest release
- Instructions for downloading

### Purpose Section

Provide a clear explanation of:
- What the repository contains
- Who should use it
- When to use it

### Installation Section

Include:
- Prerequisites
- Step-by-step installation instructions
- Platform-specific notes if applicable

### Usage Section

Provide:
- Basic usage examples
- Common use cases
- Code snippets or commands
- Links to detailed documentation

### Features Section

List key features as:
- Bullet points
- Brief descriptions
- Links to detailed feature documentation

### Contributing Section

The template includes a standard contributing section. Customize if your repository has specific contribution guidelines.

### Documentation Section

Link to:
- Additional documentation files
- External resources
- API documentation
- Guides and tutorials

### License Section

Specify the license type. Common options:
- `GPL-3.0` - GNU General Public License v3.0
- `MIT` - MIT License
- `Apache-2.0` - Apache License 2.0

### Footer Section

**Important:** The footer section with Thinkport branding should remain unchanged to maintain brand consistency across all repositories.

## Customization Guidelines

### Do's

✓ Replace all `{{VARIABLE}}` placeholders  
✓ Add repository-specific sections as needed  
✓ Include relevant badges and links  
✓ Maintain the footer branding section  
✓ Follow the existing structure and formatting  

### Don'ts

✗ Don't remove the footer branding section  
✗ Don't change the overall structure without good reason  
✗ Don't use inconsistent formatting  
✗ Don't skip required sections  

## Example: Filled Template

Here's an example of a filled template for a hypothetical repository:

```markdown
# thinkport.example

Example repository demonstrating Thinkport branding and structure.

## Download Assets

**Download the latest release:**

[![Download Latest Release](https://img.shields.io/github/v/release/kieksme/thinkport.example?label=Download%20Latest%20Release&style=for-the-badge&logo=github&logoColor=white&color=0B2649)](https://github.com/kieksme/thinkport.example/releases/latest)

## Purpose

This repository serves as an example of how to structure and document Thinkport projects.

## Installation

```bash
git clone https://github.com/kieksme/thinkport.example.git
cd thinkport.example
pnpm install
```

## Usage

```bash
pnpm start
```

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Contributing

[Standard contributing section...]

## Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)

## License

This repository is licensed under the GPL-3.0 - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Part of the [Thinkport](https://kieks.me) ecosystem**

[![Thinkport](https://img.shields.io/badge/Thinkport-Corporate%20Identity-0B2649?style=for-the-badge)](https://github.com/kieksme/thinkport.brand)

Made with ❤️ by [Thinkport GmbH](https://kieks.me)

</div>
```

## Best Practices

1. **Keep it updated**: Update the README when adding new features or changing functionality
2. **Be concise**: Keep descriptions clear and to the point
3. **Use examples**: Include code examples and use cases
4. **Link appropriately**: Link to detailed documentation rather than duplicating content
5. **Maintain consistency**: Follow the same structure and style across all Thinkport repositories

## Questions?

If you have questions about using the template or need help customizing it, please contact the designated maintainers or refer to the main [thinkport.brand](https://github.com/kieksme/thinkport.brand) repository.
