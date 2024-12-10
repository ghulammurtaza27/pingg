import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: "How do I start creating a knowledge base?",
    answer: "Begin by answering the initial question. The system will guide you through follow-up questions to build your knowledge base."
  },
  {
    question: "What are follow-up questions?",
    answer: "Follow-up questions are generated based on your previous answers to help expand and clarify the knowledge base."
  },
  {
    question: "How can I use the suggested answers?",
    answer: "Click on the help icon next to a question to view suggested answers. You can click on a suggestion to use it as your answer."
  },
  {
    question: "How do I finish creating the knowledge base?",
    answer: "Once you have answered all questions, click the 'Finish' button to complete the process and view your knowledge base."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-gray-200">
          <button
            onClick={() => toggleFAQ(index)}
            className="flex justify-between items-center w-full py-4 text-left"
          >
            <span className="font-medium">{faq.question}</span>
            <ChevronDown className={`h-5 w-5 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
          </button>
          <motion.div
            initial={false}
            animate={{ height: openIndex === index ? 'auto' : 0 }}
            className="overflow-hidden"
          >
            <p className="py-2 text-sm text-gray-600">{faq.answer}</p>
          </motion.div>
        </div>
      ))}
    </div>
  )
} 