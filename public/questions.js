// EDIT THIS FILE to change the questions. Everything else updates by itself.
// type: "single" (pick one), "multi" (tick all that apply), "text" (short answer, shown as a word cloud)
// short: a two or three word label used on the results screen
// Keep each id short, lowercase, letters and underscores only. Do not reuse an id for a different question.
window.POLL_QUESTIONS = [
  {
    id: "role",
    short: "Job function",
    type: "single",
    text: "What is your job function?",
    options: ["Management", "Sales and marketing", "Finance", "HR", "Operations", "IT", "Other"]
  },
  {
    id: "skill",
    short: "AI skill level",
    type: "single",
    text: "How would you rate your AI skill level?",
    options: [
      "Beginner: I have only tried it a few times",
      "Basic: I use it occasionally",
      "Intermediate: I use it weekly with decent prompts",
      "Advanced: I use it daily and build workflows"
    ]
  },
  {
    id: "tools",
    short: "Tools used",
    type: "multi",
    text: "Which AI tools do you use?",
    hint: "Tick all that apply.",
    options: ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Perplexity", "Canva AI", "None yet"]
  },
  {
    id: "platform",
    short: "Company platform",
    type: "multi",
    text: "Which AI platform does your company provide?",
    hint: "Tick all that apply.",
    options: [
      "Microsoft 365 with Copilot",
      "Google Workspace with Gemini",
      "ChatGPT Enterprise",
      "Claude Enterprise",
      "No company AI system",
      "Others"
    ]
  },
  {
    id: "frequency",
    short: "How often",
    type: "single",
    text: "How often do you use AI at work?",
    options: ["Never", "A few times a month", "Weekly", "Daily"]
  },
  {
    id: "uses",
    short: "Main uses",
    type: "multi",
    text: "What do you mainly use it for?",
    hint: "Tick all that apply.",
    options: [
      "Writing and emails",
      "Research",
      "Summarising documents",
      "Data and Excel",
      "Images and design",
      "Presentations",
      "Automation"
    ]
  },
  {
    id: "challenge",
    short: "Biggest challenge",
    type: "single",
    text: "What is your biggest challenge with AI?",
    options: [
      "Not knowing what to ask",
      "Unreliable answers",
      "Data privacy worries",
      "No time to learn",
      "My company does not allow it"
    ]
  },
  {
    id: "learn",
    short: "Wants to learn",
    type: "multi",
    text: "What would you like to learn in this training?",
    hint: "Tick all that apply.",
    options: [
      "Writing better prompts",
      "Writing emails and reports faster",
      "Summarising documents and meetings",
      "Analysing data in Excel",
      "Creating presentations and images",
      "Automating repetitive tasks",
      "Building AI agents and workflows",
      "Using AI safely with company data",
      "Others"
    ]
  },
  {
    id: "feeling",
    short: "One word",
    type: "text",
    text: "In one word, how do you feel about AI?",
    placeholder: "One word",
    maxLength: 30
  }
];
