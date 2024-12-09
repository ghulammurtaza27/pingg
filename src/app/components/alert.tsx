import React from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

interface AlertProps {
  message: string
  type: "'success'" | "'error'"
  onClose: () => void
}

export function Alert({ message, type, onClose }: AlertProps) {
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md flex items-center space-x-2 ${
      type === "'success'" ? "'bg-green-500'" : "'bg-red-500'"
    } text-white`}>
      {type === "'success'" ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  )
}

