export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQCategory {
  title: string;
  questions: FAQQuestion[];
}

export const FAQ_DATA: FAQCategory[] = [
  {
    title: "General Questions",
    questions: [
      {
        question: "What is Accessible Map Agent?",
        answer:
          "Accessible Map Agent is a web application that generates alternative-text descriptions for ArcGIS web maps designed with ADA Title II requirements in mind. Using AI, it analyzes your map's visual content and creates detailed descriptions that can be used as alternative text, helping blind and low-vision users understand the geographic information your maps convey.",
      },
      {
        question: "Who is this for?",
        answer:
          "This tool is designed for GIS professionals working to improve the accessibility of their web maps, government agencies preparing for ADA Title II compliance (effective April 2026), organizations working toward WCAG 2.1 accessibility standards, and anyone who wants to make their maps more inclusive.",
      },
      {
        question: "What accessibility standards does this help with?",
        answer:
          'Our generated descriptions are designed to support ADA Title II web content accessibility requirements (effective April 2026), WCAG 2.1 Success Criterion 1.1.1 (Non-Text Content, Level AA), and Section 508 federal accessibility standards. The descriptions aim to provide an "equivalent purpose" alternative—conveying the same spatial understanding a sighted user would gain from viewing the map. As with any AI-generated content, we recommend reviewing and editing descriptions before use.',
      },
    ],
  },
  {
    title: "Maps and Data",
    questions: [
      {
        question: "What types of maps can I describe?",
        answer:
          "You can generate descriptions for any ArcGIS Online web map that you have access to view. This includes maps you created, maps shared with your organization, and public maps. The map must be accessible through ArcGIS Online's web map viewer.",
      },
      {
        question: "Does this work with private maps?",
        answer:
          "Yes, but with an important caveat: when you generate a description, a screenshot of your map is sent to an AI service (Anthropic's Claude) for processing. If your map contains sensitive or confidential data, that data will be visible in the screenshot. We recommend only generating descriptions for maps you're comfortable sharing with a third-party AI service.",
      },
      {
        question: "What map layers work best?",
        answer:
          "The AI can describe most layer types effectively: feature layers (points, lines, polygons), tile layers and basemaps, thematic maps with color-coded data, and heat maps and density visualizations. Complex 3D scenes or heavily animated maps may not describe as accurately.",
      },
    ],
  },
  {
    title: "Generation Process",
    questions: [
      {
        question: "How does the description generation work?",
        answer:
          "You navigate to the map view you want described. The app captures a screenshot and gathers layer metadata. This information is sent to Claude (an AI model by Anthropic). The AI analyzes the visual content and metadata. A comprehensive text description is generated and streamed back to you.",
      },
      {
        question: "How accurate are the descriptions?",
        answer:
          "The AI produces high-quality descriptions, but they should be treated as a starting point—not a final product. AI can make mistakes, so we strongly recommend reviewing every generated description for accuracy, editing any details specific to your organization or use case, and verifying that key features are correctly identified before publishing.",
      },
      {
        question: "Can I edit the generated descriptions?",
        answer:
          "Absolutely! You can copy the description as Markdown, HTML, or plain text and edit it in any text editor. We encourage you to customize the descriptions for your specific needs.",
      },
    ],
  },
  {
    title: "Usage and Pricing",
    questions: [
      {
        question: "How many free descriptions do I get?",
        answer:
          "Each organization gets 3 free map descriptions total (lifetime). This is shared across all users in your ArcGIS organization. Free tier descriptions are retained for 7 days.",
      },
      {
        question: "What counts as one 'generation'?",
        answer:
          "One generation = one completed description. Each time you click 'Generate Description' and receive a result, that counts as one generation. Canceling a generation before it completes does not count against your quota.",
      },
      {
        question: "How do I get more generations?",
        answer:
          "We offer subscription plans for organizations that need more capacity. Starter ($49/month) includes 25 maps/month with 90-day history. Professional ($199/month) includes 150 maps/month with 1-year history. Enterprise plans offer unlimited maps with unlimited history. All paid plans are shared across your entire organization. Visit the Settings page after signing in to request a subscription.",
      },
    ],
  },
  {
    title: "Data and Privacy",
    questions: [
      {
        question: "Is my map data stored?",
        answer:
          "By default, map screenshots and layer data are NOT stored—they are sent to the AI service for processing, used to generate the description, then discarded. However, you can opt in to share your map screenshots with dymaptic to help us improve our generation quality. If you enable this option, screenshots are stored securely and may be reviewed by our team to enhance future descriptions. What IS always stored: your account information (from ArcGIS), the generated description text, and the map title and ID.",
      },
      {
        question: "How long are descriptions retained?",
        answer:
          "Description retention depends on your subscription tier: Free tier retains descriptions for 7 days, Starter for 90 days, Professional for 1 year, and Enterprise has unlimited retention. You can also manually delete descriptions at any time from your history page.",
      },
      {
        question: "Is the AI trained on my data?",
        answer:
          "No. Anthropic's API does not use your inputs to train their models. Your map data is processed and then deleted.",
      },
    ],
  },
];
