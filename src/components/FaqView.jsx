import { useState } from "react";

function FaqView() {
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState("");

  const faqs = [
    {
      q: "How soon can I expect a response from faculty?",
      a: "Faculty members typically review and respond to academic queries within 24 to 48 hours during official working days. Urgent queries can be marked during office hours."
    },
    {
      q: "Can I edit or cancel a query after submitting?",
      a: "Queries are immediately routed to the selected faculty. If you need to add details, you can submit a follow-up or discuss during office hours."
    },
    {
      q: "What should I include when asking a coding or DSA doubt?",
      a: "Include the specific problem statement, your approach, test cases where your solution fails, and clean code snippets if applicable."
    },
    {
      q: "How do office hour appointments work?",
      a: "You can book an open slot under the Appointments tab. Once the professor confirms the time, you can visit their designated cabin or attend an online session."
    },
    {
      q: "Can multiple faculty members answer the same course doubt?",
      a: "When asking a question, you select a specific professor assigned to your section or course. Other faculty members in the department can also view department-wide questions."
    },
    {
      q: "What is the policy for missed assignments or lab re-evaluations?",
      a: "Lab re-evaluations and genuine medical leaves must be communicated within 3 days of the missed session with appropriate documentation."
    }
  ];

  const filtered = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="faq-view">
      <div className="section-heading">
        <div>
          <h2>Frequently Asked Questions</h2>
          <p className="muted">
            Find immediate answers regarding course policies, doubts, and faculty support.
          </p>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="faq-accordion">
        {filtered.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`faq-item ${isOpen ? "open" : ""}`}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div className="faq-question">
                <span>{item.q}</span>
                <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
              </div>
              {isOpen && <div className="faq-answer">{item.a}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FaqView;
