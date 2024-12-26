'use client'

import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 py-16 space-y-12"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-gray-300 leading-relaxed">
          Ping ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we handle your data when you use our email management service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Gmail API Usage</h2>
        <p className="text-gray-300 leading-relaxed">
          Ping uses the Gmail API to provide email filtering services. Our access and usage comply with the{' '}
          <a 
            href="https://developers.google.com/terms/api-services-user-data-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300"
          >
            Google API Services User Data Policy
          </a>.
        </p>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">We only request access to:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Read your email messages and settings</li>
            <li>Modify your email labels and organization</li>
            <li>Create email filters based on your preferences</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Collection & Usage</h2>
        <div className="space-y-2">
          <h3 className="text-xl font-medium">We collect:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Email metadata (subject lines, dates, sender information)</li>
            <li>Email content for filtering purposes</li>
            <li>Your preferences and filter settings</li>
          </ul>
        </div>
        <p className="text-gray-300 leading-relaxed">
          This data is used solely for providing and improving our email filtering service. We do not sell or share your data with third parties.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Storage & Security</h2>
        <p className="text-gray-300 leading-relaxed">
          We use industry-standard security measures to protect your data. Email content is processed in memory and not permanently stored. Your preferences and settings are stored securely and encrypted.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Limited Use Disclosure</h2>
        <p className="text-gray-300 leading-relaxed">
          Our use and transfer of information received from Google APIs adheres to the{' '}
          <a 
            href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300"
          >
            Google API Services User Data Policy
          </a>, including the Limited Use requirements.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Deletion</h2>
        <p className="text-gray-300 leading-relaxed">
          You can request deletion of your data at any time by emailing murtazash123@gmail.com. Upon account deletion, we remove all your stored preferences and revoke our access to your Gmail account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Updates to This Policy</h2>
        <p className="text-gray-300 leading-relaxed">
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Contact Us</h2>
        <p className="text-gray-300 leading-relaxed">
          If you have any questions about this privacy policy, please contact us at murtazash123@gmail.com.
        </p>
      </section>
    </motion.div>
  )
} 