// EDIT THIS FILE to change the questions. Everything else updates by itself.
// type: "single" (pick one), "multi" (tick all that apply), "text" (short answer, shown as a word cloud)
// Keep each id short, lowercase, letters and underscores only. Do not reuse an id for a different question.
window.POLL_QUESTIONS = [
  {
    id: "role",
    type: "single",
    text: "What is your job function?",
    options: ["Management", "Sales and marketing", "Finance", "HR", "Operations", "IT", "Other"]
  },
  {
    id: "skill",
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
    type: "multi",
    text: "Which AI tools do you use?",
    hint: "Tick all that apply.",
    options: ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Perplexity", "Canva AI", "None yet"]
  },
  {
    id: "frequency",
    type: "single",
    text: "How often do you use AI at work?",
    options: ["Never", "A few times a month", "Weekly", "Daily"]
  },
  {
    id: "uses",
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
    id: "feeling",
    type: "text",
    text: "In one word, how do you feel about AI?",
    placeholder: "One word",
    maxLength: 30
  }
];
