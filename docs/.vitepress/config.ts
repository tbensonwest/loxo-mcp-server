import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Loxo MCP Server',
  description: 'Give Claude direct access to your Loxo recruitment platform',

  srcExclude: ['plans/**', 'superpowers/**'],
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Guides', link: '/guides/briefing-pack' },
      { text: 'Reference', link: '/reference/candidates' },
      { text: 'GitHub', link: 'https://github.com/tbensonwest/loxo-mcp-server' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Installation & Setup', link: '/getting-started/installation' }
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Preparing a Briefing Pack', link: '/guides/briefing-pack' },
          { text: 'Pipeline Status Update', link: '/guides/pipeline-status' },
          { text: 'Matching Candidates to a Role', link: '/guides/candidate-matching' },
          { text: 'Adding a New Candidate', link: '/guides/adding-candidate' },
          { text: 'Logging Activity After a Call', link: '/guides/logging-activity' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Candidates', link: '/reference/candidates' },
          { text: 'Jobs & Pipeline', link: '/reference/jobs-pipeline' },
          { text: 'Activities & Tasks', link: '/reference/activities-tasks' },
          { text: 'Companies & Data', link: '/reference/companies-data' },
          { text: 'Candidate Management', link: '/reference/candidate-management' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tbensonwest/loxo-mcp-server' }
    ]
  }
})
