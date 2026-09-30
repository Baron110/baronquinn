// A starter set across the 5 original categories (Business, Legal,
// Certificate, Personal, ID & Cards) — not a reconstruction of the exact
// original 23 templates, since that exact list wasn't available to build
// from. Easy to expand: add an entry here and it shows up in the picker
// automatically.
export type DocTemplate = {
  id: string;
  name: string;
  category: "Business" | "Legal" | "Certificate" | "Personal" | "ID & Cards";
  placeholder: string;
  systemPrompt: string;
};

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "invoice",
    name: "Invoice",
    category: "Business",
    placeholder: "Business name, client name, items/services and prices, due date...",
    systemPrompt:
      "Write a clean, professional invoice in plain text based on the details given. Include an invoice number placeholder, date, itemized charges, and a total."
  },
  {
    id: "business-proposal",
    name: "Business proposal",
    category: "Business",
    placeholder: "What the proposal is for, who it's to, key points to include...",
    systemPrompt: "Write a concise, persuasive business proposal in plain text based on the details given."
  },
  {
    id: "meeting-minutes",
    name: "Meeting minutes",
    category: "Business",
    placeholder: "Meeting topic, attendees, key discussion points, decisions made...",
    systemPrompt: "Write formal meeting minutes in plain text, organized with attendees, agenda items, and action items."
  },
  {
    id: "nda",
    name: "Non-disclosure agreement",
    category: "Legal",
    placeholder: "The two parties involved, what information is confidential, duration...",
    systemPrompt:
      "Write a straightforward mutual NDA in plain text based on the details given. Note clearly at the top that this is a general template, not legal advice."
  },
  {
    id: "simple-contract",
    name: "Simple service contract",
    category: "Legal",
    placeholder: "The two parties, the service being provided, payment terms, timeline...",
    systemPrompt:
      "Write a simple service contract in plain text based on the details given. Note clearly at the top that this is a general template, not legal advice."
  },
  {
    id: "demand-letter",
    name: "Demand letter",
    category: "Legal",
    placeholder: "Who it's to, what's owed or being requested, the deadline...",
    systemPrompt:
      "Write a firm but professional demand letter in plain text based on the details given. Note clearly at the top that this is a general template, not legal advice."
  },
  {
    id: "certificate-completion",
    name: "Certificate of completion",
    category: "Certificate",
    placeholder: "Recipient's name, course/program name, date, issuing organization...",
    systemPrompt: "Write the text for a certificate of completion — short, formal, centered-style wording."
  },
  {
    id: "certificate-appreciation",
    name: "Certificate of appreciation",
    category: "Certificate",
    placeholder: "Recipient's name, what they're being recognized for, issuing organization...",
    systemPrompt: "Write the text for a certificate of appreciation — warm, short, formal wording."
  },
  {
    id: "cover-letter",
    name: "Cover letter",
    category: "Personal",
    placeholder: "The job you're applying for, your relevant experience, why you want it...",
    systemPrompt: "Write a compelling, concise cover letter in plain text based on the details given."
  },
  {
    id: "resignation-letter",
    name: "Resignation letter",
    category: "Personal",
    placeholder: "Your role, company, last working day, reason (optional)...",
    systemPrompt: "Write a professional, courteous resignation letter in plain text based on the details given."
  },
  {
    id: "recommendation-letter",
    name: "Recommendation letter",
    category: "Personal",
    placeholder: "Who it's for, your relationship to them, their strengths, what role it's for...",
    systemPrompt: "Write a genuine, specific letter of recommendation in plain text based on the details given."
  },
  {
    id: "business-card-text",
    name: "Business card wording",
    category: "ID & Cards",
    placeholder: "Name, title, company, contact details to include...",
    systemPrompt: "Write clean, well-organized text layout content for a business card based on the details given."
  }
];
