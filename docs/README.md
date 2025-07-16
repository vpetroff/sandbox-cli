# Sandbox CLI Documentation

Beautiful, comprehensive documentation for Sandbox CLI built with [Mintlify](https://mintlify.com).

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Install Mintlify CLI**:
   ```bash
   npm install -g mintlify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000` to see the documentation.

## 📁 Documentation Structure

```
docs/
├── mint.json                 # Mintlify configuration
├── introduction.mdx          # Homepage and overview
├── getting-started/          # Installation and setup guides
│   ├── installation.mdx
│   ├── quick-start.mdx
│   └── configuration.mdx
├── providers/                # Cloud provider documentation
│   ├── overview.mdx
│   ├── daytona.mdx
│   ├── azure-aci.mdx
│   └── e2b.mdx
├── commands/                 # CLI command reference
│   ├── overview.mdx
│   ├── create.mdx
│   ├── deploy.mdx
│   ├── execute.mdx
│   ├── list.mdx
│   ├── select.mdx
│   ├── browse.mdx
│   └── destroy.mdx
├── guides/                   # Best practices and workflows
│   ├── workflows.mdx
│   ├── troubleshooting.mdx
│   └── best-practices.mdx
├── examples/                 # Real-world examples
│   ├── node-app.mdx
│   ├── python-app.mdx
│   └── docker-compose.mdx
└── api-reference/            # API documentation
    └── providers.mdx
```

## 🎨 Customization

### Branding

Update the branding in `mint.json`:

```json
{
  "name": "Sandbox CLI",
  "logo": {
    "dark": "/logo/dark.svg",
    "light": "/logo/light.svg"
  },
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#0D9373",
    "light": "#07C983",
    "dark": "#0D9373"
  }
}
```

### Navigation

Modify the navigation structure in `mint.json`:

```json
{
  "navigation": [
    {
      "group": "Get Started",
      "pages": [
        "introduction",
        "getting-started/installation",
        "getting-started/quick-start"
      ]
    }
  ]
}
```

### Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add the page to the navigation in `mint.json`
3. Use Mintlify components for enhanced formatting

## 📝 Writing Documentation

### MDX Components

Mintlify provides powerful components for documentation:

```mdx
<CardGroup cols={2}>
  <Card title="Feature 1" icon="rocket">
    Description of feature 1
  </Card>
  <Card title="Feature 2" icon="star">
    Description of feature 2
  </Card>
</CardGroup>

<Tabs>
  <Tab title="Option 1">
    Content for option 1
  </Tab>
  <Tab title="Option 2">
    Content for option 2
  </Tab>
</Tabs>

<CodeGroup>
```bash Command 1
npm run command1
```

```bash Command 2
npm run command2
```
</CodeGroup>

<Accordion title="Advanced Topic">
  Detailed explanation that can be collapsed
</Accordion>

<Steps>
  <Step title="First Step">
    Do this first
  </Step>
  <Step title="Second Step">
    Then do this
  </Step>
</Steps>
```

### Content Guidelines

1. **Clear Headings**: Use descriptive headings that help users navigate
2. **Code Examples**: Include working code examples for all features
3. **Visual Elements**: Use cards, tabs, and accordions to organize content
4. **Cross-References**: Link between related pages
5. **Consistent Tone**: Maintain a helpful, developer-friendly tone

## 🚀 Deployment

### Mintlify Hosting

1. **Connect Repository**:
   - Go to [Mintlify Dashboard](https://dashboard.mintlify.com)
   - Connect your GitHub repository
   - Configure build settings

2. **Automatic Deployment**:
   - Push changes to your main branch
   - Mintlify automatically builds and deploys
   - Changes are live within minutes

### Custom Domain

1. **Configure Domain**:
   ```json
   {
     "domain": "docs.yourdomain.com"
   }
   ```

2. **DNS Setup**:
   - Add CNAME record pointing to Mintlify
   - Configure SSL certificate

### Self-Hosting

```bash
# Build static site
npm run build

# Serve with any static hosting
# - Vercel
# - Netlify  
# - GitHub Pages
# - AWS S3 + CloudFront
```

## 🔧 Development

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Content Validation

Mintlify automatically validates:
- Markdown syntax
- Link integrity
- Image references
- Navigation structure

### Performance Optimization

- **Image Optimization**: Use WebP format for images
- **Code Splitting**: Mintlify automatically optimizes loading
- **Search Indexing**: Built-in search functionality
- **Mobile Responsive**: Automatic mobile optimization

## 📊 Analytics

### Built-in Analytics

Mintlify provides:
- Page view statistics
- User engagement metrics
- Search query analytics
- Performance monitoring

### Custom Analytics

Add Google Analytics or other tracking:

```json
{
  "analytics": {
    "ga4": {
      "measurementId": "G-XXXXXXXXXX"
    }
  }
}
```

## 🤝 Contributing

### Content Updates

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b docs/new-feature
   ```
3. **Make your changes**
4. **Test locally**:
   ```bash
   npm run dev
   ```
5. **Submit a pull request**

### Style Guide

- Use present tense ("Click the button" not "You will click the button")
- Be concise but comprehensive
- Include code examples for all features
- Use consistent formatting and terminology
- Test all code examples before publishing

## 🆘 Support

### Documentation Issues

- **Broken Links**: Check and update all internal/external links
- **Outdated Content**: Regular review and updates needed
- **Missing Examples**: Add practical examples for all features

### Mintlify Support

- [Mintlify Documentation](https://mintlify.com/docs)
- [Community Discord](https://mintlify.com/community)
- [GitHub Issues](https://github.com/mintlify/mint/issues)

## 📄 License

This documentation is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Live Documentation**: [Your docs URL]
- **Sandbox CLI Repository**: [Your CLI repo URL]
- **Mintlify**: https://mintlify.com
- **Support**: [Your support email/link]